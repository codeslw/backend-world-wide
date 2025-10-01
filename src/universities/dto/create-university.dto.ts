import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UniversityType } from '../../common/enum/university-type.enum';
import { UniversityProgramDto } from './university-program.dto';
import { Type } from 'class-transformer';
import { UniversityRequirementsDto } from './university-requirements.dto';
import { Currency } from '../../common/enum/currency.enum';

export class CreateUniversityDto {
  @ApiProperty({
    description: 'Name of the univsersity',
    example: 'Toshkent Axborot Texnologiyalari Universiteti',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Year the university was established',
    example: 1955,
  })
  @IsOptional()
  @IsInt()
  established?: number;

  @ApiProperty({
    enum: UniversityType,
    description: 'Type of the university (PUBLIC or PRIVATE)',
    example: UniversityType.PUBLIC,
  })
  @IsEnum(UniversityType)
  type: UniversityType;

  @ApiPropertyOptional({
    description: 'Description of the university in Uzbek',
  })
  @IsOptional()
  @IsString()
  descriptionUz?: string;

  @ApiPropertyOptional({
    description: 'Description of the university in Russian',
  })
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @ApiPropertyOptional({
    description: 'Description of the university in English',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Official website of the university',
    example: 'https://tuit.uz',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Contact email of the university',
    example: 'info@tuit.uz',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number of the university',
    example: '+998712386415',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    description: 'Full address of the university',
    example: '108 Amir Temur Avenue, Tashkent, Uzbekistan',
  })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'Deadline for winter intake applications',
    example: '2024-12-15',
  })
  @IsOptional()
  @IsDateString()
  winterIntakeDeadline?: string;

  @ApiPropertyOptional({
    description: 'Deadline for autumn intake applications',
    example: '2024-08-31',
  })
  @IsOptional()
  @IsDateString()
  autumnIntakeDeadline?: string;

  @ApiPropertyOptional({
    description: 'Global or national ranking of the university',
    example: 1500,
  })
  @IsOptional()
  @IsInt()
  ranking?: number;

  @ApiPropertyOptional({
    description: 'Total number of students',
    example: 25000,
  })
  @IsOptional()
  @IsInt()
  studentsCount?: number;

  @ApiPropertyOptional({
    description: 'Acceptance rate percentage',
    example: 45.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  acceptanceRate?: number;

  @ApiPropertyOptional({
    description: 'Average application fee',
    example: 50.0,
  })
  @IsOptional()
  @IsNumber()
  avgApplicationFee?: number;

  @ApiPropertyOptional({
    description: 'Currency for the application fee',
    example: Currency.USD,
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  applicationFeeCurrency?: Currency;

  @ApiPropertyOptional({
    description: 'URL to a photo of the university',
    example: 'https://example.com/university.jpg',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether this university is featured as main (only 3 allowed)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiProperty({
    description: 'ID of the city where the university is located',
    example: 'a8f6b6e4-9b1a-4b0e-8b0a-7b0c9b0a7b0c',
  })
  @IsString()
  cityId: string;

  @ApiProperty({
    description: 'Code of the country where the university is located',
    example: 860,
  })
  @IsInt()
  countryCode: number;

  @ApiProperty({
    type: [UniversityProgramDto],
    description: 'List of programs offered by the university with tuition fees',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UniversityProgramDto)
  programs: UniversityProgramDto[];

  @ApiPropertyOptional({
    description: 'Admission requirements for the university',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UniversityRequirementsDto)
  requirements?: UniversityRequirementsDto;
}
