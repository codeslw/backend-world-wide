import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsNumber, IsUrl, IsOptional, IsDate, Min, Max } from 'class-validator';
import { UniversityType } from '../../common/enum/university-type.enum';

export class CreateUniversityDto {
  @ApiProperty({ description: 'University name in Uzbek' })
  @IsString()
  nameUz: string;

  @ApiProperty({ description: 'University name in Russian' })
  @IsString()
  nameRu: string;

  @ApiProperty({ description: 'University name in English' })
  @IsString()
  nameEn: string;

  @ApiProperty({ description: 'Year of establishment' })
  @IsInt()
  established: number;

  @ApiProperty({ enum: UniversityType, description: 'Type of university' })
  @IsEnum(UniversityType)
  type: UniversityType;

  @ApiProperty({ description: 'Average application fee' })
  @IsNumber()
  avgApplicationFee: number;

  @ApiProperty({ description: 'Country ID' })
  @IsString()
  countryId: string;

  @ApiProperty({ description: 'City ID' })
  @IsString()
  cityId: string;

  @ApiProperty({ description: 'Description in Uzbek' })
  @IsString()
  descriptionUz: string;

  @ApiProperty({ description: 'Description in Russian' })
  @IsString()
  descriptionRu: string;

  @ApiProperty({ description: 'Description in English' })
  @IsString()
  descriptionEn: string;

  @ApiProperty({ description: 'Winter intake deadline', required: false })
  @IsOptional()
  @IsDate()
  winterIntakeDeadline?: Date;

  @ApiProperty({ description: 'Autumn intake deadline', required: false })
  @IsOptional()
  @IsDate()
  autumnIntakeDeadline?: Date;

  @ApiProperty({ description: 'University ranking' })
  @IsInt()
  ranking: number;

  @ApiProperty({ description: 'Number of students' })
  @IsInt()
  studentsCount: number;

  @ApiProperty({ description: 'Acceptance rate (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  acceptanceRate: number;

  @ApiProperty({ description: 'University website URL' })
  @IsUrl()
  website: string;

  @ApiProperty({ description: 'Minimum tuition fee' })
  @IsNumber()
  tuitionFeeMin: number;

  @ApiProperty({ description: 'Maximum tuition fee' })
  @IsNumber()
  tuitionFeeMax: number;

  @ApiProperty({ description: 'Tuition fee currency', default: 'USD' })
  @IsString()
  @IsOptional()
  tuitionFeeCurrency?: string;
} 