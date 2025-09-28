import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsBoolean,
  IsOptional,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country code' })
  @IsNumber()
  @Min(1)
  @Max(999)
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn: string;

  @ApiPropertyOptional({
    description: 'Whether this country is featured as main (only 3 allowed)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional({
    description: 'Photo URL for the country (required when isMain is true)',
    example: 'https://example.com/country.jpg',
  })
  @IsOptional()
  @ValidateIf((o) => o.isMain === true)
  @IsUrl()
  photoUrl?: string;
}
