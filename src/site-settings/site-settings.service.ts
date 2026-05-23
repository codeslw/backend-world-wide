import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';

const DEFAULT_APP_TITLE = 'World Wide';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
  ) {}

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
    const previousLogoUrl = existing.logoUrl;
    const nextLogoUrl = data.logoUrl;
    const shouldClearLogo = data.clearLogo === true;

    if ((shouldClearLogo || nextLogoUrl !== undefined) && previousLogoUrl) {
      const oldKey = this.extractStorageKey(previousLogoUrl);
      if (oldKey) {
        try {
          await this.digitalOceanService.deleteFile(oldKey);
        } catch (error) {
          this.logger.warn(
            `Failed to delete previous site logo ${oldKey}: ${error.message}`,
          );
        }
      }
    }

    return this.prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...(data.appTitle ? { appTitle: data.appTitle } : {}),
        ...(shouldClearLogo
          ? { logoUrl: null }
          : data.logoUrl !== undefined
            ? { logoUrl: data.logoUrl }
            : {}),
      },
    });
  }

  private extractStorageKey(logoUrl: string): string | null {
    try {
      const parsed = new URL(logoUrl);
      const path = parsed.pathname.replace(/^\/+/, '');
      const bucket = this.digitalOceanService['bucket'];

      if (bucket && path.startsWith(`${bucket}/`)) {
        return path.substring(bucket.length + 1);
      }

      return path || null;
    } catch {
      return logoUrl.replace(/^\/+/, '') || null;
    }
  }
}
