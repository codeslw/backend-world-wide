import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../db/prisma.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new NotFoundException({
        message: 'User with such credentials not found',
        statusCode: 404,
      });
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
    });
    
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async validateRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    // Clean up old refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Create JWT refresh token payload
    const payload = {
      sub: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign JWT refresh token with longer expiration
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Store refresh token metadata in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async refreshAccessToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify JWT refresh token signature and expiration
      const refreshPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      // Verify token type and extract user ID
      if (refreshPayload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = refreshPayload.sub;

      // Check if refresh token exists in database (for revocation support)
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: { 
          token: refreshToken,
          userId: userId,
        },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Generate new access token
      const accessPayload = {
        email: tokenRecord.user.email,
        sub: tokenRecord.user.id,
        role: tokenRecord.user.role,
      };

      const accessToken = this.jwtService.sign(accessPayload, {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
      });

      // Generate new refresh token (token rotation)
      const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };

    } catch (error) {
      // Clean up any invalid tokens
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
