import { ApiProperty } from '@nestjs/swagger';
import { PartnerAction, PartnerRole } from '@prisma/client';

class PermissionDto {
  @ApiProperty({ enum: PartnerAction })
  action: PartnerAction;

  @ApiProperty()
  granted: boolean;
}

export class PartnerMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: PartnerRole })
  role: PartnerRole;

  @ApiProperty({ type: [PermissionDto] })
  permissions: PermissionDto[];

  @ApiProperty()
  createdAt: Date;
}
