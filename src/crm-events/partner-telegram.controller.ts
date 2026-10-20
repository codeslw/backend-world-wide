import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enum/roles.enum';
import { PrismaService } from '../db/prisma.service';

export interface PartnerTelegramStatus {
  userId: string;
  phone: string | null;
  linked: boolean;
  linkedAt: Date | null;
}

@ApiTags('partner-telegram')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-telegram')
export class PartnerTelegramController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Whether partners have shared their phone number with the CRM Telegram bot (Admin only)',
    description:
      'Partners can receive CRM sign-in codes only after linking their phone to the bot. Mirrored from the CRM over NATS, so it can lag by a second or two.',
  })
  @ApiQuery({ name: 'userId', required: false })
  @Get('status')
  status(@Query('userId') userId?: string): Promise<PartnerTelegramStatus[]> {
    return this.prisma.$queryRaw<PartnerTelegramStatus[]>(Prisma.sql`
      SELECT u."id" AS "userId",
             p."phoneNumber" AS "phone",
             COALESCE(l."linked", false) AS "linked",
             l."linkedAt" AS "linkedAt"
      FROM "users" u
      LEFT JOIN "profiles" p ON p."userId" = u."id"
      LEFT JOIN "partner_telegram_links" l
        ON l."phone" = regexp_replace(p."phoneNumber", '[\\s\\-().]', '', 'g')
      WHERE u."role" = 'PARTNER'
        AND (${userId ?? null}::text IS NULL OR u."id" = ${userId ?? null}::text)
      ORDER BY u."createdAt" DESC`);
  }
}
