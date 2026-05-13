import { IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PartnerAction } from '@prisma/client';

class PermissionItemDto {
  @ApiProperty({ enum: PartnerAction })
  @IsEnum(PartnerAction)
  action: PartnerAction;

  @ApiProperty()
  @IsBoolean()
  granted: boolean;
}

export class SetPermissionsDto {
  @ApiProperty({ type: [PermissionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions: PermissionItemDto[];
}
