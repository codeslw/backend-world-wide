import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ description: 'Optional initial message', required: false })
  @IsOptional()
  initialMessage?: string;
} 