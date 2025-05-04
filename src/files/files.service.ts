import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(
    private readonly digitalOceanService: DigitalOceanService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async uploadFile(file: Express.Multer.File) {
    //Check file size doesn't exceed 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate a unique filename
    const filename = `${Date.now()}-${file.originalname}`;

    // Upload to DigitalOcean Spaces
    const key = await this.digitalOceanService.uploadFile(file, filename);

    // Save metadata to PostgreSQL (store the key, not the full URL)
    const savedFile = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        url: key, // Store just the key
      },
    });

    // Generate a presigned URL for immediate use
    const presignedUrl = await this.digitalOceanService.getPresignedUrl(key);

    return {
      ...savedFile,
      url: presignedUrl, // Return the presigned URL
    };
  }

  async uploadMultipleFiles(files: Express.Multer.File[]) {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  async getAllFiles(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count(),
    ]);
    
    return {
      data: files,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });
    
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    
    // Generate a fresh presigned URL
    const presignedUrl = await this.digitalOceanService.getPresignedUrl(file.url);
    
    return {
      ...file,
      url: presignedUrl, // Return with presigned URL
    };
  }

  async downloadFile(file: any, res: Response) {
    try {
      // Get the file from DigitalOcean
      const response = await axios({
        method: 'GET',
        url: file.url,
        responseType: 'stream',
      });
      
      // Set headers
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', response.headers['content-type']);
      
      // Pipe the file stream to the response
      return response.data.pipe(res);
    } catch (error) {
      throw new NotFoundException('File could not be downloaded');
    }
  }

  async deleteFile(id: string) {
    // Get the file first to get the URL
    const file = await this.prisma.file.findUnique({
      where: { id },
    });
    
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    
    try {
      // Delete from DigitalOcean
      await this.digitalOceanService.deleteFile(file.url);
      
      // Delete from database
      return await this.prisma.file.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Error deleting file with ID ${id}: ${error.message}`);
    }
  }

  async deleteFileByUrl(url: string) {
    // Extract the key from the URL if it's a presigned URL
    let key = url;
    if (url.includes('?')) {
      key = url.split('?')[0].split('/').slice(-2).join('/');
    }
    
    // Find the file in the database
    const file = await this.prisma.file.findFirst({
      where: { 
        url: { 
          contains: key 
        } 
      },
    });
    
    if (!file) {
      throw new NotFoundException(`File with URL ${url} not found`);
    }
    
    // Delete the file
    await this.digitalOceanService.deleteFile(key);
    
    // Delete from database
    return await this.prisma.file.delete({
      where: { id: file.id },
    });
  }

  async downloadFileByUrl(url: string, res: Response): Promise<void> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { responseType: 'stream' })
      );

      const parsedUrl = parse(url);
      const filename = basename(parsedUrl.pathname || 'downloaded-file');
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);

      response.data.pipe(res);

    } catch (error) {
      this.handleDownloadError(error, url);
    }
  }

  private handleDownloadError(error: any, url: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`File not found at URL: ${url}`);
      }
      throw new BadRequestException(`Error downloading file from URL: ${error.message}`);
    }
    throw new BadRequestException(`An unexpected error occurred while downloading the file: ${error.message}`);
  }
}