import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address the code was sent to' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Six-digit code from the password reset email' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ example: 'newPassword123', description: 'New password (minimum 6 characters)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
