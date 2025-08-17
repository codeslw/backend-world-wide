import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enum/roles.enum';
import { Type } from 'class-transformer';
import { CreateAdminProfileDto } from '../../profiles/dto/create-admin-profile.dto';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, default: Role.CLIENT, description: 'User role' })
  @IsString()
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    type: CreateAdminProfileDto,
    description:
      'User profile information (optional for admins, only firstName, lastName, and dateOfBirth required if provided)',
  })
  @ValidateNested()
  @Type(() => CreateAdminProfileDto)
  @IsOptional()
  profile?: CreateAdminProfileDto;
}
