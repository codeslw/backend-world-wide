import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DigitalOceanService {
  private s3: AWS.S3;
  private readonly logger = new Logger(DigitalOceanService.name);

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('DIGITAL_OCEAN_ENDPOINT');
    const key = this.configService.get<string>('DIGITAL_OCEAN_ACCESS_KEY');
    const secret = this.configService.get<string>('DIGITAL_OCEAN_SECRET_KEY');
    const bucket = this.configService.get<string>('DIGITAL_OCEAN_BUCKET');
    
    // Log configuration (without secrets)
    this.logger.log(`Initializing Digital Ocean service with endpoint: ${endpoint}, bucket: ${bucket}`);
    
    if (!endpoint || !key || !secret || !bucket) {
      this.logger.error('Missing Digital Ocean configuration');
      throw new Error('Missing Digital Ocean configuration. Check your environment variables.');
    }
    
    const spacesEndpoint = new AWS.Endpoint(endpoint);
    
    this.s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: key,
      secretAccessKey: secret,
      // Add these optimizations
      httpOptions: {
        timeout: 300000, // 5 minutes timeout for large uploads
        connectTimeout: 5000, // 5 seconds to establish connection
      },
      s3ForcePathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const uniqueFileName = `${folder}/${uuidv4()}-${file.originalname}`;
    
    // Use multipart upload for large files
    if (file.size > 5 * 1024 * 1024) { // 5MB threshold
      return this.uploadLargeFile(file, uniqueFileName);
    }
    
    // Regular upload for smaller files
    const params = {
      Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
      Key: uniqueFileName,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    await this.s3.upload(params).promise();
    return uniqueFileName;
  }
  
  private async uploadLargeFile(file: Express.Multer.File, key: string): Promise<string> {
    // Initialize multipart upload
    const multipartParams = {
      Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
      Key: key,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };
    
    const multipartUpload = await this.s3.createMultipartUpload(multipartParams).promise();
    
    try {
      // Optimal part size (5MB is the minimum)
      const partSize = 5 * 1024 * 1024;
      const numParts = Math.ceil(file.size / partSize);
      const uploadPromises = [];
      
      // Upload each part
      for (let i = 0; i < numParts; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        
        const partParams = {
          Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
          Key: key,
          PartNumber: i + 1,
          UploadId: multipartUpload.UploadId,
          Body: file.buffer.slice(start, end),
        };
        
        // Upload part and get ETag
        const uploadPartResult = await this.s3.uploadPart(partParams).promise();
        uploadPromises.push({
          PartNumber: i + 1,
          ETag: uploadPartResult.ETag,
        });
      }
      
      // Complete multipart upload
      const completeParams = {
        Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
        Key: key,
        UploadId: multipartUpload.UploadId,
        MultipartUpload: {
          Parts: uploadPromises,
        },
      };
      
      await this.s3.completeMultipartUpload(completeParams).promise();
      return key;
    } catch (error) {
      // Abort multipart upload if it fails
      await this.s3.abortMultipartUpload({
        Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
        Key: key,
        UploadId: multipartUpload.UploadId,
      }).promise();
      
      throw error;
    }
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const params = {
      Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
      Key: key,
      Expires: expiresIn,
    };
    
    return this.s3.getSignedUrl('getObject', params);
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.configService.get('DIGITAL_OCEAN_BUCKET'),
      Key: key,
    };
    
    try {
      await this.s3.deleteObject(params).promise();
      this.logger.log(`Successfully deleted file ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${key}: ${error.message}`);
      throw error;
    }
  }
}