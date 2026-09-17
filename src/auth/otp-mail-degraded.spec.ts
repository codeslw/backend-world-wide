import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailOtpPurpose } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../db/prisma.service';
import { OtpService } from './otp.service';

/**
 * The API must never crash at boot over email config (exit 1 + container
 * restart loop). Missing SMTP degrades to log mode, and OTP issue endpoints
 * answer 503 until SMTP is configured.
 */
describe('missing SMTP configuration', () => {
  const unconfiguredMail = () =>
    new MailService({
      get: (_key: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService);

  it('MailService boots without SMTP_HOST instead of throwing', () => {
    const mail = unconfiguredMail();
    expect(() => mail.onModuleInit()).not.toThrow();
    expect(mail.isConfigured()).toBe(false);
  });

  it('OtpService refuses to issue codes while mail is unconfigured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: { emailOtp: {} } },
        {
          provide: MailService,
          useValue: { isConfigured: () => false, send: jest.fn() },
        },
      ],
    }).compile();

    const otp = module.get<OtpService>(OtpService);
    await expect(
      otp.issue('user@example.com', EmailOtpPurpose.EMAIL_VERIFICATION),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
