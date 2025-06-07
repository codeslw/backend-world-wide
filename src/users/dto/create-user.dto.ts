import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enum/roles.enum';
import { Type } from 'class-transformer';
import { CreateProfileDto } from '../../profiles/dto/create-profile.dto';

export class CreateUserDto {
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

  @ApiProperty({
    type: CreateProfileDto,
    description: 'User profile information',
  })
  @ValidateNested()
  @Type(() => CreateProfileDto)
  @IsOptional()
  profile?: CreateProfileDto;
}
