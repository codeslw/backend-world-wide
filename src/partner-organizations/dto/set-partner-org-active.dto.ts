import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetPartnerOrgActiveDto {
  @ApiProperty({
    description: 'Whether the organization has platform access',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
