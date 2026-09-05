import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailOtpPurpose } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../db/prisma.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { Role } from '../common/enum/roles.enum';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private partnerOrgsService: PartnerOrganizationsService,
    private audit: PartnerAuditService,
    private otpService: OtpService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new NotFoundException({
        message: 'User with such credentials not found',
        statusCode: 404,
      });
    }

    // Accounts created before email verification existed were grandfathered in
    // by the migration, so this only blocks signups that never confirmed.
    if (!user.isEmailVerified) {
      throw new ForbiddenException({
        message:
          'Your email address has not been verified. Please check your inbox for the verification code.',
        statusCode: 403,
        error: 'EMAIL_NOT_VERIFIED',
      });
    }

    let organizationId: string | null = null;
    let partnerRole: string | null = null;
    let permissions: string[] = [];

    if (user.role === Role.PARTNER) {
      // Check if this user is a member of someone else's org first
      const membership = await this.partnerOrgsService.findByMemberUserId(
        user.id,
      );
      if (membership) {
        organizationId = membership.organizationId;
        partnerRole = membership.role;
        permissions = membership.permissions
          .filter((p) => p.granted)
          .map((p) => p.action);
      } else {
        // Not a member → they are (or will be) an owner
        const org = await this.partnerOrgsService.getOrCreateForOwner(user.id);
        organizationId = org.id;
        partnerRole = 'OWNER';
      }

      // Block access for organizations whose platform access has been disabled.
      const orgActive = await this.partnerOrgsService.isUserOrgActive(user.id);
      if (!orgActive) {
        throw new UnauthorizedException(
          "Your organization's platform access has been disabled. Please contact support.",
        );
      }
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      ...(organizationId && { organizationId, partnerRole, permissions }),
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    // Record partner logins in the audit trail.
    if (user.role === Role.PARTNER) {
      await this.audit.log({
        action: 'LOGIN',
        actorId: user.id,
        actorRole: user.role,
        organizationId,
        ipAddress,
        metadata: { partnerRole },
      });
    }

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

  /**
   * Creates the account and emails a verification code. The user exists at this
   * point but cannot log in until they confirm — see the isEmailVerified gate
   * in login().
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    try {
      await this.otpService.issue(
        createUserDto.email,
        EmailOtpPurpose.EMAIL_VERIFICATION,
      );
    } catch (error) {
      // The account is already created; failing the whole request would leave
      // the caller unable to retry (the email is taken) and unable to log in.
      // Report success and let them use the resend endpoint instead.
      this.logger.error(
        `Account ${createUserDto.email} created but the verification email failed to send`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      ...user,
      requiresEmailVerification: true,
    };
  }

  /**
   * Re-sends a signup verification code.
   *
   * Responds identically whether or not the address has an account, so the
   * endpoint cannot be used to enumerate registered emails.
   */
  async resendVerificationOtp(dto: SendOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (user && !user.isEmailVerified) {
      // Key the code off the stored address, not the submitted one, so codes
      // issued and consumed via differently-cased input still line up.
      await this.otpService.issue(
        user.email,
        EmailOtpPurpose.EMAIL_VERIFICATION,
      );
    }

    return {
      message:
        'If an unverified account exists for this address, a verification code has been sent.',
    };
  }

  /**
   * Confirms the signup code and logs the user straight in, so they are not
   * asked for their password again immediately after registering.
   */
  async verifyEmail(dto: VerifyOtpDto, ipAddress?: string) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('No account found for this email address.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('This email address is already verified.');
    }

    await this.otpService.consume(
      user.email,
      dto.code,
      EmailOtpPurpose.EMAIL_VERIFICATION,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    this.logger.log(`Email verified for user ${user.id}`);

    // Issue tokens directly: the OTP just proved control of the address, and
    // the password was set moments ago during registration.
    return this.issueTokensFor(user.id, ipAddress);
  }

  /**
   * Starts a password reset by emailing a code.
   *
   * Like resendVerificationOtp, the response does not reveal whether the
   * address is registered.
   */
  async forgotPassword(dto: SendOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (user) {
      await this.otpService.issue(user.email, EmailOtpPurpose.PASSWORD_RESET);
    }

    return {
      message:
        'If an account exists for this address, a password reset code has been sent.',
    };
  }

  /**
   * Consumes the reset code and sets the new password.
   *
   * All refresh tokens are revoked afterwards: a password reset should end any
   * session an attacker may already hold.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Consume-time failures are generic for the same anti-enumeration reason.
      throw new BadRequestException('The code is invalid or has expired.');
    }

    await this.otpService.consume(
      user.email,
      dto.code,
      EmailOtpPurpose.PASSWORD_RESET,
    );

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // A successful reset proves control of the inbox, so an account that
        // never finished signup verification is verified by the same act.
        isEmailVerified: true,
      },
    });

    await this.revokeAllRefreshTokens(user.id);

    this.logger.log(`Password reset completed for user ${user.id}`);

    return { message: 'Your password has been reset. You can now sign in.' };
  }

  /**
   * Builds the access/refresh token pair for an already-authenticated user,
   * resolving partner claims the same way login() does.
   */
  private async issueTokensFor(userId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    let organizationId: string | null = null;
    let partnerRole: string | null = null;
    let permissions: string[] = [];

    if (user.role === Role.PARTNER) {
      const membership = await this.partnerOrgsService.findByMemberUserId(
        user.id,
      );
      if (membership) {
        organizationId = membership.organizationId;
        partnerRole = membership.role;
        permissions = membership.permissions
          .filter((p) => p.granted)
          .map((p) => p.action);
      } else {
        const org = await this.partnerOrgsService.getOrCreateForOwner(user.id);
        organizationId = org.id;
        partnerRole = 'OWNER';
      }

      const orgActive = await this.partnerOrgsService.isUserOrgActive(user.id);
      if (!orgActive) {
        throw new UnauthorizedException(
          "Your organization's platform access has been disabled. Please contact support.",
        );
      }
    }

    const accessToken = this.jwtService.sign(
      {
        email: user.email,
        sub: user.id,
        role: user.role,
        ...(organizationId && { organizationId, partnerRole, permissions }),
      },
      { expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m') },
    );

    const refreshToken = await this.generateRefreshToken(user.id);

    if (user.role === Role.PARTNER) {
      await this.audit.log({
        action: 'LOGIN',
        actorId: user.id,
        actorRole: user.role,
        organizationId,
        ipAddress,
        metadata: { partnerRole },
      });
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  /** Keeps the email_otps table from accumulating lapsed rows. */
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredOtps() {
    const count = await this.otpService.purgeExpired();
    if (count > 0) {
      this.logger.verbose(`Purged ${count} expired OTP row(s)`);
    }
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
        secret:
          this.configService.get('JWT_REFRESH_SECRET') ||
          this.configService.get('JWT_SECRET'),
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
      secret:
        this.configService.get('JWT_REFRESH_SECRET') ||
        this.configService.get('JWT_SECRET'),
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
        secret:
          this.configService.get('JWT_REFRESH_SECRET') ||
          this.configService.get('JWT_SECRET'),
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

      // Resolve partner claims for the refreshed token
      let organizationId: string | null = null;
      let partnerRole: string | null = null;
      let permissions: string[] = [];

      if (tokenRecord.user.role === Role.PARTNER) {
        const membership = await this.partnerOrgsService.findByMemberUserId(
          tokenRecord.user.id,
        );
        if (membership) {
          organizationId = membership.organizationId;
          partnerRole = membership.role;
          permissions = membership.permissions
            .filter((p) => p.granted)
            .map((p) => p.action);
        } else {
          const org = await this.partnerOrgsService.getOrCreateForOwner(
            tokenRecord.user.id,
          );
          organizationId = org.id;
          partnerRole = 'OWNER';
        }

        const orgActive = await this.partnerOrgsService.isUserOrgActive(
          tokenRecord.user.id,
        );
        if (!orgActive) {
          throw new UnauthorizedException(
            "Your organization's platform access has been disabled.",
          );
        }
      }

      // Generate new access token
      const accessPayload = {
        email: tokenRecord.user.email,
        sub: tokenRecord.user.id,
        role: tokenRecord.user.role,
        ...(organizationId && { organizationId, partnerRole, permissions }),
      };

      const accessToken = this.jwtService.sign(accessPayload, {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
      });

      // Generate new refresh token (token rotation)
      const newRefreshToken = await this.generateRefreshToken(
        tokenRecord.user.id,
      );

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
