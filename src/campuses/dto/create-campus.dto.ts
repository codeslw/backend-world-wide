import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CampusStatus } from '@prisma/client';

export class CreateCampusDto {
  @ApiProperty({ description: 'University ID' })
  @IsUUID()
  universityId: string;

  @ApiProperty({ description: 'Name of the campus' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campus code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Photos of campus', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Established Date' })
  @IsOptional()
  @IsDateString()
  establishedDate?: Date;

  @ApiProperty({ description: 'Address' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Boundaries (GeoJSON)' })
  @IsOptional()
  boundaries?: any;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Total Area' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalArea?: number;

  @ApiPropertyOptional({ description: 'Building Count' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  buildingCount?: number;

  @ApiPropertyOptional({ description: 'Facility Types', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilityTypes?: string[];

  @ApiPropertyOptional({ description: 'Parking Capacity' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parkingCapacity?: number;

  @ApiPropertyOptional({ description: 'Campus Director' })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Operating Hours' })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiPropertyOptional({ enum: CampusStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(CampusStatus)
  status?: CampusStatus;
}
