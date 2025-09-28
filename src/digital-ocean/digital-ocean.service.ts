import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DigitalOceanService {
  private s3: AWS.S3;
  private readonly logger = new Logger(DigitalOceanService.name);
  private bucket: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get<string>('DIGITAL_OCEAN_ENDPOINT');
    const key = this.configService.get<string>('DIGITAL_OCEAN_ACCESS_KEY');
    const secret = this.configService.get<string>('DIGITAL_OCEAN_SECRET_KEY');
    this.bucket = this.configService.get<string>('DIGITAL_OCEAN_BUCKET');

    if (!this.endpoint || !key || !secret || !this.bucket) {
      throw new Error('Missing Digital Ocean configuration.');
    }

    const spacesEndpoint = new AWS.Endpoint(this.endpoint);

    this.s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: key,
      secretAccessKey: secret,
      httpOptions: {
        timeout: 300000,
        connectTimeout: 5000,
      },
      s3ForcePathStyle: true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    if (file.size > 5 * 1024 * 1024) {
      return this.uploadLargeFile(file, key);
    }

    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    await this.s3.upload(params).promise();
    return key;
  }

  private async uploadLargeFile(
    file: Express.Multer.File,
    key: string,
  ): Promise<string> {
    const multipartParams = {
      Bucket: this.bucket,
      Key: key,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const multipartUpload = await this.s3
      .createMultipartUpload(multipartParams)
      .promise();
    const partSize = 5 * 1024 * 1024;
    const numParts = Math.ceil(file.size / partSize);
    const parts = [];

    try {
      for (let i = 0; i < numParts; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);

        const partParams = {
          Bucket: this.bucket,
          Key: key,
          PartNumber: i + 1,
          UploadId: multipartUpload.UploadId,
          Body: file.buffer.slice(start, end),
        };

        const uploadPartResult = await this.s3.uploadPart(partParams).promise();
        parts.push({ PartNumber: i + 1, ETag: uploadPartResult.ETag });
      }

      await this.s3
        .completeMultipartUpload({
          Bucket: this.bucket,
          Key: key,
          UploadId: multipartUpload.UploadId,
          MultipartUpload: { Parts: parts },
        })
        .promise();

      return key;
    } catch (error) {
      // ensure abort on failure
      try {
        await this.s3
          .abortMultipartUpload({
            Bucket: this.bucket,
            Key: key,
            UploadId: multipartUpload.UploadId,
          })
          .promise();
      } catch (abortErr) {
        this.logger.error(
          `Failed to abort multipart upload for ${key}: ${abortErr.message}`,
        );
      }
      throw error;
    }
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.${this.endpoint}/${key}`;
  }

  /**
   * Delete file by key.
   * Returns true if delete succeeded or object didn't exist; throws only on unexpected error.
   */
  async deleteFile(key: string): Promise<boolean> {
    const params = { Bucket: this.bucket, Key: key };
    try {
      await this.s3.deleteObject(params).promise();
      this.logger.log(`Deleted file ${key}`);
      return true;
    } catch (error) {
      // Some S3 SDK errors are transient; log and rethrow for serious issues
      this.logger.error(`Error deleting file ${key}: ${error.message}`);
      throw error;
    }
  }
}
