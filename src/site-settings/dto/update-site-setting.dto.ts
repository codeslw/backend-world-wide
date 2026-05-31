import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSiteSettingDto {
  @ApiPropertyOptional({ example: 'World Wide' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  appTitle?: string;
}

