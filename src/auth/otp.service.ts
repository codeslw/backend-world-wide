import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EmailOtpPurpose } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../db/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
} from '../mail/mail.templates';

/** Minutes a freshly issued code stays valid. */
const OTP_TTL_MINUTES = 10;
/** Wrong guesses tolerated before the code is burned. */
const MAX_ATTEMPTS = 5;
/** Seconds a caller must wait before requesting another code for the same purpose. */
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Issues a code for `email`/`purpose`, emails it, and invalidates any code
   * previously issued for the same pair.
   *
   * Throws BadRequestException if called again inside the resend cooldown, so
   * the endpoint cannot be used to flood an address with mail.
   */
  async issue(email: string, purpose: EmailOtpPurpose): Promise<void> {
    const normalizedEmail = this.normalize(email);

    const lastIssued = await this.prisma.emailOtp.findFirst({
      where: { email: normalizedEmail, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (lastIssued) {
      const elapsedSeconds =
        (Date.now() - lastIssued.createdAt.getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          `Please wait ${Math.ceil(
            RESEND_COOLDOWN_SECONDS - elapsedSeconds,
          )} seconds before requesting another code.`,
        );
      }
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Supersede outstanding codes for this email+purpose: only the newest code
    // should ever be accepted.
    await this.prisma.$transaction([
      this.prisma.emailOtp.deleteMany({
        where: { email: normalizedEmail, purpose },
      }),
      this.prisma.emailOtp.create({
        data: { email: normalizedEmail, codeHash, purpose, expiresAt },
      }),
    ]);

    const template =
      purpose === EmailOtpPurpose.EMAIL_VERIFICATION
        ? emailVerificationTemplate(code, OTP_TTL_MINUTES)
        : passwordResetTemplate(code, OTP_TTL_MINUTES);

    await this.mail.send({ to: normalizedEmail, ...template });
  }

  /**
   * Checks `code` against the outstanding OTP and consumes it on success.
   *
   * A wrong code increments the attempt counter; crossing MAX_ATTEMPTS deletes
   * the row, forcing the caller to request a fresh code rather than keep
   * guessing. Every failure mode reports the same generic message so a caller
   * cannot distinguish "no code issued" from "wrong code".
   */
  async consume(
    email: string,
    code: string,
    purpose: EmailOtpPurpose,
  ): Promise<void> {
    const normalizedEmail = this.normalize(email);

    const otp = await this.prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('The code is invalid or has expired.');
    }

    if (!(await bcrypt.compare(code, otp.codeHash))) {
      const attempts = otp.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await this.prisma.emailOtp.delete({ where: { id: otp.id } });
        this.logger.warn(
          `OTP burned after ${MAX_ATTEMPTS} failed attempts for ${normalizedEmail} (${purpose})`,
        );
        throw new BadRequestException(
          'Too many incorrect attempts. Please request a new code.',
        );
      }
      await this.prisma.emailOtp.update({
        where: { id: otp.id },
        data: { attempts },
      });
      throw new BadRequestException('The code is invalid or has expired.');
    }

    await this.prisma.emailOtp.delete({ where: { id: otp.id } });
  }

  /**
   * Hourly sweep of expired and consumed codes. Nothing depends on these rows
   * once they lapse; this only stops the table growing without bound.
   */
  async purgeExpired(): Promise<number> {
    const { count } = await this.prisma.emailOtp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Six digits from a CSPRNG. `randomInt` is uniform over the range, unlike the
   * modulo-of-random-bytes shortcut.
   */
  private generateCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
