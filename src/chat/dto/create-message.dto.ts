import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Chat ID' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ description: 'Message text content', required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ description: 'File ID for attachments', required: false })
  @IsOptional()
  @IsString()
  fileId?: string;

  @ApiProperty({ description: 'Message ID being replied to', required: false })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
} 