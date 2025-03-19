import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DigitalOceanService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('DIGITAL_OCEAN_BUCKET');
    
    this.s3Client = new S3Client({
      region: 'blr-1', // Digital Ocean Spaces use this region
      endpoint: this.configService.get<string>('DIGITAL_OCEAN_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('DIGITAL_OCEAN_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('DIGITAL_OCEAN_SECRET_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: file.buffer,
      ACL: 'private', // Make files private by default
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    // Return the file path (not a public URL)
    return `${filename}`;
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // Generate a presigned URL that expires
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}