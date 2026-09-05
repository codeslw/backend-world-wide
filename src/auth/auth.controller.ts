import { Controller, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('auth') // Groups endpoints under "auth" in Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: Object,
    example: {
      access_token: 'jwt.token.here',
      refresh_token: 'refresh.token.here',
      user: { id: 'uuid', email: 'user@example.com', role: 'CLIENT' },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    return this.authService.login(loginDto, req?.ip);
  }

  @Post('register')
  @ApiOperation({
    summary: 'User registration with automatic profile creation',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User and profile created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use',
    type: ErrorResponseDto,
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: Object,
    example: {
      access_token: 'new.jwt.token.here',
      refresh_token: 'new.refresh.token.here',
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user by revoking refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: Object,
    example: { message: 'Logout successful' },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(refreshTokenDto.refreshToken);
    return { message: 'Logout successful' };
  }

  // OTP endpoints carry a tighter throttle than the global 100/min: they send
  // mail and guess-check codes, so they are the ones worth rate limiting.

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Confirm a signup email address with the emailed code',
    description:
      'On success the account is marked verified and a token pair is returned, ' +
      'so the user is signed in without re-entering their password.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified and user signed in',
    type: Object,
    example: {
      access_token: 'jwt.token.here',
      refresh_token: 'refresh.token.here',
      user: { id: 'uuid', email: 'user@example.com', role: 'CLIENT' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Code invalid, expired, or email already verified',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No account for this email' })
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto, @Req() req) {
    return this.authService.verifyEmail(verifyOtpDto, req?.ip);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Re-send the signup verification code' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({
    status: 200,
    description:
      'Generic acknowledgement — identical whether or not the address is registered',
    type: Object,
    example: {
      message:
        'If an unverified account exists for this address, a verification code has been sent.',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Resend requested inside the cooldown window',
    type: ErrorResponseDto,
  })
  async resendVerification(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.resendVerificationOtp(sendOtpDto);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Email a password reset code' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({
    status: 200,
    description:
      'Generic acknowledgement — identical whether or not the address is registered',
    type: Object,
    example: {
      message:
        'If an account exists for this address, a password reset code has been sent.',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Reset requested inside the cooldown window',
    type: ErrorResponseDto,
  })
  async forgotPassword(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.forgotPassword(sendOtpDto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Set a new password using the emailed reset code',
    description:
      'Revokes every existing refresh token for the account so any session an ' +
      'attacker holds is ended by the reset.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: Object,
    example: { message: 'Your password has been reset. You can now sign in.' },
  })
  @ApiResponse({
    status: 400,
    description: 'Code invalid or expired',
    type: ErrorResponseDto,
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
