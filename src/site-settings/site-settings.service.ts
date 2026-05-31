import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';

const DEFAULT_APP_TITLE = 'World Wide';

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSettings() {
    return this.prisma.siteSetting.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        appTitle: DEFAULT_APP_TITLE,
      },
      update: {},
    });
  }

  async getPublicSettings() {
    const settings = await this.ensureSettings();
    return {
      appTitle: settings.appTitle,
      logoUrl: settings.logoUrl,
      updatedAt: settings.updatedAt,
    };
  }

  async updateSettings(
    data: UpdateSiteSettingDto & { logoUrl?: string | null },
  ) {
    const existing = await this.ensureSettings();

    return this.prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...(data.appTitle ? { appTitle: data.appTitle } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      },
    });
  }
}

