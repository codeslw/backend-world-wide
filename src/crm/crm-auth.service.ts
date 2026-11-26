import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailOtpPurpose, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../db/prisma.service';
import { OtpService } from '../auth/otp.service';
import {
  CrmChangePasswordDto,
  CrmResetPasswordDto,
  CrmVerifyDto,
} from './dto/crm-auth.dto';

/** Compared against when there is no such account, so the time taken says nothing. */
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

const IDENTITY = {
  id: true,
  email: true,
  role: true,
  password: true,
  passwordChangedAt: true,
  profile: { select: { firstName: true, lastName: true, phoneNumber: true } },
} satisfies Prisma.UserSelect;

/**
 * Sign-in for edu-crm. Admin accounts live here, with their passwords; the CRM
 * asks this service instead of keeping copies, so a password changed or
 * reset anywhere applies everywhere at once. Only ADMIN accounts get in.
 */
@Injectable()
export class CrmAuthService {
  private readonly logger = new Logger(CrmAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
  ) {}

  private async findAdmin(email: string) {
    const wanted = email.trim().toLowerCase();
    const rows = await this.prisma.user.findMany({
      where: { email: { equals: wanted, mode: 'insensitive' }, role: 'ADMIN' },
      select: IDENTITY,
    });
    // Compared again here: the case-insensitive match treats % and _ as wildcards.
    return rows.find((r) => r.email.toLowerCase() === wanted) ?? null;
  }

  async verify(dto: CrmVerifyDto) {
    const user = await this.findAdmin(dto.email);
    const ok = await bcrypt.compare(dto.password, user?.password ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new UnauthorizedException('Wrong email or password');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
      phone: user.profile?.phoneNumber ?? null,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  async changePassword(dto: CrmChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, role: 'ADMIN' },
      select: IDENTITY,
    });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }
    return this.setPassword(user.id, dto.newPassword);
  }

  /** Emails a reset code. Answers the same whether or not the account exists. */
  async forgotPassword(email: string) {
    const user = await this.findAdmin(email);
    if (user) {
      try {
        await this.otp.issue(user.email, EmailOtpPurpose.PASSWORD_RESET);
      } catch (error) {
        // A code was sent moments ago: the same answer as a fresh one. Email
        // not being configured is worth telling.
        if (!(error instanceof BadRequestException)) throw error;
      }
    }
    return { resendIn: 60, expiresIn: 600 };
  }

  async resetPassword(dto: CrmResetPasswordDto) {
    const user = await this.findAdmin(dto.email);
    if (!user) {
      throw new BadRequestException('The code is invalid or has expired.');
    }
    await this.otp.consume(
      user.email,
      dto.code,
      EmailOtpPurpose.PASSWORD_RESET,
    );
    return this.setPassword(user.id, dto.newPassword);
  }

  private async setPassword(userId: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hash },
        select: { passwordChangedAt: true },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);
    this.logger.log(`Password changed through edu-crm for admin ${userId}`);
    return { passwordChangedAt: updated.passwordChangedAt };
  }
}
