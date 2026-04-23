import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { IntakeSeason } from '@prisma/client';

export class CreatePartnerApplicationDto {
  @ApiProperty({ description: 'ID of the partner student to apply for' })
  @IsUUID()
  partnerStudentId: string;

  @ApiProperty({ description: 'University ID' })
  @IsUUID()
  universityId: string;

  @ApiProperty({ description: 'Program ID' })
  @IsUUID()
  programId: string;

  @ApiProperty({ enum: IntakeSeason, description: 'Preferred intake season' })
  @IsEnum(IntakeSeason)
  intakeSeason: IntakeSeason;

  @ApiProperty({ description: 'Year of intended intake' })
  @IsNumber()
  @Min(new Date().getFullYear())
  @Max(new Date().getFullYear() + 5)
  intakeYear: number;

  @ApiPropertyOptional({ description: 'English proficiency test & score' })
  @IsOptional()
  @IsString()
  englishProficiency?: string;

  @ApiPropertyOptional({ description: 'GPA or academic score' })
  @IsOptional()
  @IsString()
  gpa?: string;

  @ApiPropertyOptional({ description: 'Additional prerequisites or qualifications' })
  @IsOptional()
  @IsString()
  prerequisites?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Backup programs array of objects with programId, universityId, programTitle, universityName',
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  backupPrograms?: any[];
}
