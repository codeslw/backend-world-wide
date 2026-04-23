import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProcessStepDto {
  @ApiProperty({ description: 'Template ID this step belongs to' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Step order (1-based)' })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Step name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Step description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status key mapping (e.g. SUBMITTED, UNDER_REVIEW)' })
  @IsString()
  statusKey: string;

  @ApiPropertyOptional({ description: 'Whether this step is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
