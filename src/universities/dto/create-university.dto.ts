import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsNumber, IsUUID, IsUrl, IsOptional, IsDateString, Min, Max } from 'class-validator';
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
  @Min(1000)
  @Max(new Date().getFullYear())
  established: number;


  @ApiProperty({ description: 'University photo URL', type: "string" })
  @IsUrl()
  photoUrl: string;

  @ApiProperty({ description: 'University type', enum: UniversityType })
  @IsEnum(UniversityType)
  type: UniversityType;

  @ApiProperty({ description: 'Average application fee' })
  @IsNumber()
  @Min(0)
  avgApplicationFee: number;

  @ApiProperty({ description: 'Country ID' })
  @IsUUID()
  countryId: string;

  @ApiProperty({ description: 'City ID' })
  @IsUUID()
  cityId: string;

  @ApiProperty({ description: 'University description in Uzbek' })
  @IsString()
  descriptionUz: string;

  @ApiProperty({ description: 'University description in Russian' })
  @IsString()
  descriptionRu: string;

  @ApiProperty({ description: 'University description in English' })
  @IsString()
  descriptionEn: string;

  @ApiProperty({ description: 'Winter intake deadline', required: false })
  @IsOptional()
  @IsDateString()
  winterIntakeDeadline?: string;

  @ApiProperty({ description: 'Autumn intake deadline', required: false })
  @IsOptional()
  @IsDateString()
  autumnIntakeDeadline?: string;

  @ApiProperty({ description: 'University ranking' })
  @IsInt()
  @Min(1)
  ranking: number;

  @ApiProperty({ description: 'Number of students' })
  @IsInt()
  @Min(0)
  studentsCount: number;

  @ApiProperty({ description: 'Acceptance rate (percentage)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  acceptanceRate: number;

  @ApiProperty({ description: 'University website URL' })
  @IsUrl()
  website: string;

  @ApiProperty({ description: 'Tuition fee ID' })
  @IsInt()
  tuitionFeeId: number;
} 