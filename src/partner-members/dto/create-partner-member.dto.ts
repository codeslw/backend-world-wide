import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'International format. Needed to sign in to edu-crm (codes go to Telegram).',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  temporaryPassword: string;

  @ApiProperty({ enum: [PartnerRole.MANAGER, PartnerRole.MEMBER] })
  @IsEnum([PartnerRole.MANAGER, PartnerRole.MEMBER])
  role: Extract<PartnerRole, 'MANAGER' | 'MEMBER'>;
}
