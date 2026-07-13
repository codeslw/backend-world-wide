import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SetHomepageVisibilityDto {
  @ApiProperty({ description: 'Whether the review should show on the home page' })
  @IsBoolean()
  show: boolean;

  @ApiPropertyOptional({
    description:
      'ID of a currently-featured review to replace. Required when enabling and the home page already has the maximum number of reviews.',
  })
  @IsOptional()
  @IsString()
  replaceId?: string;
}
