import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ description: 'File ID', type : "string"})
  id: string;

  @ApiProperty({ description: 'Original filename', type : "string"})
  filename: string;

  @ApiProperty({ description: 'File URL', type : "string"})
  url: string;

  @ApiProperty({ description: 'Creation date', type : "string"})
  createdAt: string;
} 