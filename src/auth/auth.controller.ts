import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
      user: { id: 'uuid', email: 'user@example.com', role: 'CLIENT' }
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration with automatic profile creation' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User and profile created successfully', 
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data provided', 
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email already in use', 
    type: ErrorResponseDto 
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
      refresh_token: 'new.refresh.token.here' 
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
}
