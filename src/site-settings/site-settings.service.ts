import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { RevalidationService } from '../about/revalidation.service';

const DEFAULT_APP_TITLE = 'World Wide';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly revalidation: RevalidationService,
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
      consultingLogoUrl: settings.consultingLogoUrl,
      updatedAt: settings.updatedAt,
    };
  }

  async updateSettings(
    data: UpdateSiteSettingDto & {
      logoUrl?: string | null;
      consultingLogoUrl?: string | null;
    },
  ) {
    const existing = await this.ensureSettings();
    const shouldClearLogo = data.clearLogo === true;
    const shouldClearConsultingLogo = data.clearConsultingLogo === true;

    // When a logo is replaced or cleared, remove the previous file from storage.
    await this.removeReplacedLogo(
      existing.logoUrl,
      shouldClearLogo || data.logoUrl !== undefined,
    );
    await this.removeReplacedLogo(
      existing.consultingLogoUrl,
      shouldClearConsultingLogo || data.consultingLogoUrl !== undefined,
    );

    const updated = await this.prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...(data.appTitle ? { appTitle: data.appTitle } : {}),
        ...(shouldClearLogo
          ? { logoUrl: null }
          : data.logoUrl !== undefined
            ? { logoUrl: data.logoUrl }
            : {}),
        ...(shouldClearConsultingLogo
          ? { consultingLogoUrl: null }
          : data.consultingLogoUrl !== undefined
            ? { consultingLogoUrl: data.consultingLogoUrl }
            : {}),
      },
    });

    // Bust the frontend's ISR cache so the new title/logos appear immediately
    // in the header and About page instead of after the revalidate window.
    this.revalidation.revalidateTags(['site-settings', 'about']);

    return updated;
  }

  private async removeReplacedLogo(
    previousUrl: string | null | undefined,
    isBeingReplaced: boolean,
  ) {
    if (!isBeingReplaced || !previousUrl) return;
    const oldKey = this.extractStorageKey(previousUrl);
    if (!oldKey) return;
    try {
      await this.digitalOceanService.deleteFile(oldKey);
    } catch (error) {
      this.logger.warn(
        `Failed to delete previous site logo ${oldKey}: ${error.message}`,
      );
    }
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
