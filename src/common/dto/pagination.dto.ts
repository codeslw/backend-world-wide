import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ description: 'Page number (starts from 1)', default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  // @Type(() => Number) // Rely on enableImplicitConversion in ValidationPipe
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  // @Type(() => Number) // Rely on enableImplicitConversion in ValidationPipe
  limit?: number = 10;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;
} 