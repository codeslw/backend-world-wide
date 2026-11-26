import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApplicationDocumentStatus } from '@prisma/client';
import { REQUIREMENT_KEY } from './create-application-document.dto';

/** Attach a file from the applicant's profile to a requirement of an application. */
export class CreateDocumentFromProfileDto {
  @ApiPropertyOptional()
  @ValidateIf((o) => !o.applicationId)
  @IsUUID()
  partnerApplicationId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.partnerApplicationId)
  @IsUUID()
  applicationId?: string;

  @ApiProperty({ description: 'The requirement, as the checklist names it.' })
  @Matches(REQUIREMENT_KEY, {
    message: 'documentTypeId must be a UUID or kind:<KIND>',
  })
  documentTypeId: string;

  @ApiProperty({ description: 'Id of the profile file on that requirement.' })
  @IsUUID()
  profileFileId: string;

  @ApiPropertyOptional({ enum: ApplicationDocumentStatus })
  @IsOptional()
  @IsEnum(ApplicationDocumentStatus)
  status?: ApplicationDocumentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
