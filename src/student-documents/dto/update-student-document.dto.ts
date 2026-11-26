import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateStudentDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'When the document stops being valid; null clears it',
  })
  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== null)
  @IsDateString()
  expiresAt?: string | null;
}
