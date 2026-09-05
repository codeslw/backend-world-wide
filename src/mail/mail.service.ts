import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends transactional email over SMTP.
 *
 * Transport is provider-agnostic on purpose: point SMTP_HOST/PORT/USER/PASS at
 * Gmail, Mailgun, SES, Resend or a local MailHog and nothing else changes.
 *
 * When SMTP_HOST is not configured the service degrades to "log mode" instead
 * of throwing: the message (including the OTP) is written to the application
 * log so the whole signup/reset flow stays testable on a dev machine with no
 * mail credentials. Log mode is refused when NODE_ENV=production, because
 * silently not delivering a password-reset code in prod is worse than a hard
 * failure at boot.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');

    if (!host) {
      if (this.configService.get('NODE_ENV') === 'production') {
        throw new Error(
          'SMTP_HOST is not configured. Email delivery is required in production ' +
            '(signup verification and password reset depend on it).',
        );
      }
      this.logger.warn(
        'SMTP_HOST is not set — running in log mode. Emails will be printed to ' +
          'the log instead of being delivered.',
      );
      return;
    }

    const port = Number(this.configService.get('SMTP_PORT', 587));

    this.transporter = nodemailer.createTransport({
      host,
      port,
      // Implicit TLS on 465; STARTTLS (upgraded after connect) on 587/25.
      secure: this.configService.get('SMTP_SECURE', String(port === 465)) === 'true',
      auth: this.configService.get<string>('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
    });

    this.logger.log(`SMTP transport configured (${host}:${port})`);
  }

  async send(options: SendMailOptions): Promise<void> {
    const from = this.configService.get<string>(
      'SMTP_FROM',
      'World Wide <no-reply@worldwide.uz>',
    );

    if (!this.transporter) {
      this.logger.warn(
        `[MAIL LOG MODE] to=${options.to} subject="${options.subject}"\n${options.text}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from, ...options });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      // Surface the failure to the caller so the endpoint can decide, but log
      // the detail here — the caller deliberately does not echo SMTP internals
      // back to the client.
      this.logger.error(
        `Failed to send email to ${options.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
