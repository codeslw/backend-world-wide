import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateDocumentTypeDto {
  @ApiProperty({ description: 'Step ID this document type belongs to' })
  @IsUUID()
  stepId: string;

  @ApiProperty({ description: 'Document name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this document is required' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Accepted file types', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileTypes?: string[];

  @ApiPropertyOptional({ description: 'Maximum file size in MB' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxSizeMb?: number;
}
