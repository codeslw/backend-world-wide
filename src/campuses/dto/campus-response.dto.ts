import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampusStatus } from '@prisma/client';

export class CampusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  universityId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional({ isArray: true })
  photos?: string[];

  @ApiPropertyOptional()
  establishedDate?: Date;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  boundaries?: any;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  totalArea?: number;

  @ApiPropertyOptional()
  buildingCount?: number;

  @ApiPropertyOptional({ isArray: true })
  facilityTypes?: string[];

  @ApiPropertyOptional()
  parkingCapacity?: number;

  @ApiPropertyOptional()
  director?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  operatingHours?: string;

  @ApiProperty({ enum: CampusStatus })
  status: CampusStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
