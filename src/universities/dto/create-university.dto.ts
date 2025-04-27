import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsEnum,
  IsNumber,
  IsUrl,
  IsOptional,
  IsDate,
  Min,
  Max,
  IsEmail,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UniversityType } from '../../common/enum/university-type.enum';
import { UniversityProgramDto } from './university-program.dto';

export class CreateUniversityDto {
  @ApiProperty({ description: 'University name in Uzbek', example: 'Toshkent Axborot Texnologiyalari Universiteti' })
  @IsString()
  @IsNotEmpty()
  nameUz: string;

  @ApiProperty({ description: 'University name in Russian', example: 'Ташкентский Университет Информационных Технологий' })
  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @ApiProperty({ description: 'University name in English', example: 'Tashkent University of Information Technologies' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ description: 'Year of establishment', example: 1955 })
  @IsInt()
  established: number;

  @ApiProperty({ enum: UniversityType, description: 'Type of university', example: UniversityType.PUBLIC })
  @IsEnum(UniversityType)
  type: UniversityType;

  @ApiProperty({ description: 'Average application fee', example: 50.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  avgApplicationFee: number;

  @ApiProperty({ description: 'Country code', example: 860 })
  @IsInt() // Assuming country code is an integer ID from Country model
  countryCode: number;

  @ApiProperty({ description: 'City ID', example: 'b7a3f4e0-8e1f-4f8f-b8f4-9a7b1c2d3e4f' })
  @IsString() // Assuming city ID is a string UUID from City model
  @IsNotEmpty()
  cityId: string;

  @ApiProperty({ description: 'Description in Uzbek', example: "O'zbekistondagi yetakchi IT universiteti." })
  @IsString()
  @IsNotEmpty()
  descriptionUz: string;

  @ApiProperty({ description: 'Description in Russian', example: 'Ведущий ИТ-университет Узбекистана.' })
  @IsString()
  @IsNotEmpty()
  descriptionRu: string;

  @ApiProperty({ description: 'Description in English', example: 'Leading IT university in Uzbekistan.' })
  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @ApiProperty({ description: 'Winter intake deadline (YYYY-MM-DD)', required: false, example: '2025-11-30' })
  @IsOptional()
  @IsDateString()
  winterIntakeDeadline?: string;

  @ApiProperty({ description: 'Autumn intake deadline (YYYY-MM-DD)', required: false, example: '2025-07-31' })
  @IsOptional()
  @IsDateString()
  autumnIntakeDeadline?: string;

  @ApiProperty({ description: 'University ranking', example: 1500 })
  @IsInt()
  @Min(1)
  ranking: number;

  @ApiProperty({ description: 'Number of students', example: 25000 })
  @IsInt()
  @Min(0)
  studentsCount: number;

  @ApiProperty({ description: 'Acceptance rate (percentage, 0-100)', example: 35.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  acceptanceRate: number;

  @ApiProperty({ description: 'University website URL', example: 'https://tuit.uz' })
  @IsUrl()
  website: string;

  @ApiProperty({ description: 'University email', example: 'info@tuit.uz' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'University phone number', example: '+998712386415' })
  // @IsPhoneNumber() // Commented out: Requires specific country code or use IsString
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'University address', example: 'Amir Temur Avenue 108, Tashkent, Uzbekistan' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'University photo URL', required: false, example: 'https://example.com/photo.jpg' })
  @IsUrl()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({
    description: 'List of programs offered by the university with their specific tuition fees.',
    type: [UniversityProgramDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniversityProgramDto)
  @IsNotEmpty()
  programs: UniversityProgramDto[];
} 