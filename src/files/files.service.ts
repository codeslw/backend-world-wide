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
        storageKey: key,
        publicUrl: this.digitalOceanService.getPublicUrl(key),
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
          storageKey: key,
          publicUrl: this.digitalOceanService.getPublicUrl(key),
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
      storageKey: file.url,
      publicUrl: this.digitalOceanService.getPublicUrl(file.url),
      url: await this.digitalOceanService.getPresignedUrl(file.url),
    };
  }

  /**
   * Resolve a stored storage key (or a legacy full/presigned URL) into a
   * stable, non-expiring public URL. Uploaded objects are stored with a
   * `public-read` ACL, so the public URL is directly accessible and — unlike a
   * presigned URL — never expires. Used by chat so attachments keep working
   * after the (formerly 1-hour) presigned link would have expired.
   */
  toPublicUrl(keyOrUrl?: string | null): string | null {
    return this.digitalOceanService.normalizeToPublicUrl(keyOrUrl);
  }

  /**
   * Reduce any stored value (key or full/presigned URL) back to a stable
   * storage key so it can be re-signed or re-served later.
   */
  toStorageKey(keyOrUrl: string): string {
    return this.digitalOceanService.getStorageKey(keyOrUrl);
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
    if (!url || !url.trim()) {
      throw new BadRequestException('A file url is required');
    }

    // Reduce the incoming value to a storage key. This both normalizes legacy
    // presigned/public URLs and prevents SSRF: we never fetch an arbitrary
    // attacker-controlled URL — only objects from our own bucket, re-signed now.
    const storageKey = this.digitalOceanService.getStorageKey(url.trim());
    if (/^https?:\/\//i.test(storageKey)) {
      throw new BadRequestException('Only managed storage files can be downloaded');
    }

    try {
      const presignedUrl = await this.digitalOceanService.getPresignedUrl(
        storageKey,
        60,
      );

      // Use axios directly so the freshly-signed URL is not re-encoded and its
      // signature invalidated.
      const response = await axios.get(presignedUrl, {
        responseType: 'stream',
      });

      // storageKey is already decoded by getStorageKey — decoding again would
      // throw URIError on filenames containing a literal '%'.
      const filename = basename(storageKey) || 'download';
      const contentType =
        response.headers['content-type'] || 'application/octet-stream';

      this.setDownloadHeaders(res, filename, contentType);

      response.data.pipe(res);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `Failed to download from URL. Status: ${error.response.status}. URL: ${url}`,
        );
        if (error.response.status === 403) {
          throw new BadRequestException(
            'Access to the file was denied. The temporary link may have expired or been altered.',
          );
        }
        if (error.response.status === 404) {
          throw new NotFoundException(`File not found at URL: ${url}`);
        }
      }
      this.logger.error(
        `Generic error downloading file: ${error.message}`,
        error.stack,
      );
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

      this.setDownloadHeaders(
        res,
        file.filename,
        response.headers['content-type'],
      );
      response.data.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to stream file for ID ${id}: ${error.message}`);
      throw new InternalServerErrorException(
        'Could not process file download.',
      );
    }
  }

  /**
   * Set download response headers with an RFC 5987 `filename*` so non-ASCII
   * filenames survive, plus an ASCII fallback for legacy clients.
   */
  private setDownloadHeaders(
    res: Response,
    filename: string,
    contentType?: string,
  ): void {
    const safe = (filename || 'download').replace(/["\r\n]/g, '_');
    const asciiFallback = safe.replace(/[^\x20-\x7e]/g, '_');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(safe)}`,
    );
    res.setHeader(
      'Content-Type',
      contentType || 'application/octet-stream',
    );
  }
}
