import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name: string | null;

  @ApiPropertyOptional()
  logoUrl: string | null;

  @ApiPropertyOptional()
  website: string | null;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  email: string | null;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  registrationNumber: string | null;

  @ApiPropertyOptional()
  country: string | null;

  @ApiPropertyOptional()
  city: string | null;

  @ApiPropertyOptional()
  address: string | null;

  @ApiPropertyOptional()
  linkedinUrl: string | null;

  @ApiPropertyOptional()
  instagramUrl: string | null;

  @ApiPropertyOptional()
  facebookUrl: string | null;

  @ApiProperty()
  updatedAt: Date;
}
