import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { PrismaService } from '../db/prisma.service';
import { Response } from 'express';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';
import { parse } from 'url';
import { basename } from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly digitalOceanService: DigitalOceanService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Upload a single file with automatic cleanup if DB insert fails.
   */
  async uploadFile(file: Express.Multer.File) {
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // 1) Upload to DO Spaces
    const key = await this.digitalOceanService.uploadFile(file, 'uploads');

    // 2) Attempt DB insert. If it fails, cleanup the uploaded object.
    try {
      const savedFile = await this.prisma.file.create({
        data: {
          filename: file.originalname,
          url: key, // store only the key
        },
      });

      // 3) Return saved DB row with a presigned URL for client consumption
      return {
        ...savedFile,
        url: await this.digitalOceanService.getPresignedUrl(key),
      };
    } catch (dbError) {
      // cleanup uploaded object to avoid orphaned objects
      try {
        await this.digitalOceanService.deleteFile(key);
        this.logger.log(`Cleaned up uploaded object ${key} after DB failure.`);
      } catch (cleanupErr) {
        // Log cleanup error, but prioritize surfacing the DB error
        this.logger.error(
          `Failed to cleanup object ${key} after DB error: ${cleanupErr.message}`,
        );
      }

      // Rethrow a more descriptive error (optionally include dbError.message)
      throw new InternalServerErrorException(
        `Failed to save file metadata to database: ${dbError.message}`,
      );
    }
  }

  /**
   * Upload many files. If any file fails, previously uploaded files in this batch are cleaned up.
   */
  async uploadMultipleFiles(files: Express.Multer.File[]) {
    const results: any[] = [];
    const uploadedKeys: string[] = []; // track keys that must be cleaned if something fails

    try {
      for (const file of files) {
        const key = await this.digitalOceanService.uploadFile(file, 'uploads');
        uploadedKeys.push(key);

        // try DB insert
        const saved = await this.prisma.file.create({
          data: {
            filename: file.originalname,
            url: key,
          },
        });

        results.push({
          ...saved,
          url: await this.digitalOceanService.getPresignedUrl(key),
        });
      }

      return results;
    } catch (err) {
      // Clean up any already-uploaded files in this batch
      for (const k of uploadedKeys) {
        try {
          await this.digitalOceanService.deleteFile(k);
          this.logger.log(`Cleaned up ${k} after batch failure.`);
        } catch (cleanupErr) {
          this.logger.error(`Failed to cleanup ${k}: ${cleanupErr.message}`);
        }
      }
      // Surface an error
      throw new InternalServerErrorException(
        `Batch upload failed: ${err.message}`,
      );
    }
  }

  async getAllFiles(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count(),
    ]);

    const data = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await this.digitalOceanService.getPresignedUrl(file.url),
      })),
    );

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFile(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException(`File with ID ${id} not found`);

    return {
      ...file,
      url: await this.digitalOceanService.getPresignedUrl(file.url),
    };
  }

  /**
   * Download file by DB id (uses presigned url).
   */
  async downloadFile(id: string, res: Response) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException(`File with ID ${id} not found`);

    const presignedUrl = await this.digitalOceanService.getPresignedUrl(
      file.url,
    );

    const response = await axios.get(presignedUrl, { responseType: 'stream' });
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  }

  /**
   * Delete file by DB id. Delete from DO first then DB (or use transaction if preferred).
   */
  async deleteFile(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException(`File with ID ${id} not found`);

    // 1) delete from storage
    await this.digitalOceanService.deleteFile(file.url);

    // 2) delete from DB
    return this.prisma.file.delete({ where: { id } });
  }

  /**
   * Delete by a full URL or by key. This will try to derive the key and remove the DB row + storage object.
   */
  async deleteFileByUrl(url: string) {
    let objectKey: string;

    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname.replace(/^\/+/, ''); // trim starting slashes

      // If DO uses path-style and bucket is the first segment, remove it.
      const bucketName = this.digitalOceanService['bucket'];
      if (bucketName && path.startsWith(`${bucketName}/`)) {
        objectKey = path.substring(bucketName.length + 1);
      } else {
        // if hostname contains bucket, path is already the key
        objectKey = path;
      }
    } catch (e) {
      // Not a URL — assume it's already the key
      objectKey = url;
    }

    const file = await this.prisma.file.findFirst({
      where: { url: objectKey },
    });
    if (!file) {
      throw new NotFoundException(`File with key '${objectKey}' not found`);
    }

    // delete from storage and DB
    await this.digitalOceanService.deleteFile(file.url);
    return this.prisma.file.delete({ where: { id: file.id } });
  }

  async downloadFileByUrl(url: string, res: Response): Promise<void> {
    try {
      // Use axios directly. This prevents any potential wrappers from
      // re-encoding the URL and invalidating the signature.
      const response = await axios.get(url, {
        responseType: 'stream',
      });

      const filename = basename(parse(url).pathname || 'downloaded-file');
      const contentType =
        response.headers['content-type'] || 'application/octet-stream';

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Type', contentType);

      response.data.pipe(res);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`Failed to download from URL. Status: ${error.response.status}. URL: ${url}`);
        if (error.response.status === 403) {
           throw new BadRequestException('Access to the file was denied. The temporary link may have expired or been altered.');
        }
        if (error.response.status === 404) {
          throw new NotFoundException(`File not found at URL: ${url}`);
        }
      }
      this.logger.error(`Generic error downloading file: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Error downloading file from URL: ${error.message}`,
      );
    }
  }


  async downloadFileById(id: string, res: Response): Promise<void> {
    // 1. Find the file record in the database
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    try {
      // 2. Generate a FRESH, short-lived presigned URL right now
      // Note: file.url here actually stores the object key, which is correct
      const presignedUrl = await this.digitalOceanService.getPresignedUrl(
        file.url,
        60, // URL is only needed for a few seconds, so 60 is plenty.
      );

      // 3. Use axios to fetch the file from the new URL and stream it
      const response = await axios.get(presignedUrl, {
        responseType: 'stream',
      });

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.filename}"`,
      );
      res.setHeader('Content-Type', response.headers['content-type']);
      response.data.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to stream file for ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Could not process file download.');
    }
  }
}
  

