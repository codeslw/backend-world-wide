import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSiteSettingDto {
  @ApiPropertyOptional({ example: 'World Wide' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  appTitle?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  clearLogo?: boolean;
}
