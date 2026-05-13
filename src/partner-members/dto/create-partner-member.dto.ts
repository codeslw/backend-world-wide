import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartnerRole } from '@prisma/client';

export class CreatePartnerMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  temporaryPassword: string;

  @ApiProperty({ enum: [PartnerRole.MANAGER, PartnerRole.MEMBER] })
  @IsEnum([PartnerRole.MANAGER, PartnerRole.MEMBER])
  role: Extract<PartnerRole, 'MANAGER' | 'MEMBER'>;
}
