import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class DownloadFileByUrlDto {
  @ApiProperty({
    description: 'The URL of the file to download',
    example: 'https://example.com/path/to/your/file.pdf',
  })
  @IsNotEmpty()
  @IsUrl()
  url: string;
} 