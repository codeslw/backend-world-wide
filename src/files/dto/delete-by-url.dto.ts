import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteByUrlDto {
  @ApiProperty({ description: 'URL of the file to delete' })
  @IsNotEmpty()
  @IsString()
  url: string;
}
