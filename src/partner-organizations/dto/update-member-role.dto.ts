import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['MANAGER', 'MEMBER'] })
  @IsIn(['MANAGER', 'MEMBER'])
  role: 'MANAGER' | 'MEMBER';
}
