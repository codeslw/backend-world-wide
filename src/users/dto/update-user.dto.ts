import { IsEmail, IsString, MinLength, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enum/roles.enum';
import { Type } from 'class-transformer';
import { UpdateProfileDto } from '../../profiles/dto/update-profile.dto';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123', description: 'User password', required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: Role, description: 'User role', required: false })
  @IsString()
  @IsOptional()
  role?: Role;
  
  @ApiProperty({ type: UpdateProfileDto, description: 'User profile information', required: false })
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  @IsOptional()
  profile?: UpdateProfileDto;
} 