import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address the code was sent to' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Six-digit code from the email' })
  @IsString()
  @Length(6, 6)
  code: string;
}
