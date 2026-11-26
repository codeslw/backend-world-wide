import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** Forms that create mini applications. */
export const MINI_APPLICATION_SOURCES = ['QUICK_FORM', 'SERVICES'];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** "+998 (90) 123-45-67" or "998901234567" -> "+998901234567". */
export function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  let digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith('+')) {
    // A local Uzbek number without the country code.
    digits = digits.length === 9 ? `+998${digits}` : `+${digits}`;
  }
  return digits;
}

export class CreateMiniApplicationDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the applicant',
    required: true,
  })
  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the applicant (the services form asks for one name only)',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the applicant (including country code)',
    required: true,
  })
  @Transform(({ value }) => normalizePhone(value))
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message:
      'PhoneNumber must be a valid E.164 phone number (e.g., +1234567890)',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    enum: MINI_APPLICATION_SOURCES,
    description: 'Which form it came from',
  })
  @IsOptional()
  @IsIn(MINI_APPLICATION_SOURCES)
  source?: string;

  @ApiPropertyOptional({ description: 'Service the person is interested in' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  service?: string;

  @ApiPropertyOptional({ description: 'Country the person wants to study in' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'What the person wrote' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'University the person asked about' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  universityId?: string;
}
