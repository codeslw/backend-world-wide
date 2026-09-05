import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send the code to' })
  @IsEmail()
  email: string;
}
