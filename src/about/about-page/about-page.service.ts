import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { AboutPage } from '@prisma/client';
import { DigitalOceanService } from '../../digital-ocean/digital-ocean.service';
import { UpdateAboutPageDto } from './dto/update-about-page.dto';
import { RevalidationService } from '../revalidation.service';

const ABOUT_PAGE_ID = 'global';

@Injectable()
export class AboutPageService {
  private readonly logger = new Logger(AboutPageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly revalidation: RevalidationService,
  ) {}

  async ensure(): Promise<AboutPage> {
    const page = await this.prisma.aboutPage.upsert({
      where: { id: ABOUT_PAGE_ID },
      create: { id: ABOUT_PAGE_ID },
      update: {},
    });
    return this.normalize(page);
  }

  async update(dto: UpdateAboutPageDto): Promise<AboutPage> {
    await this.ensure();
    const updated = await this.prisma.aboutPage.update({
      where: { id: ABOUT_PAGE_ID },
      data: {
        ...dto,
        heroImageUrl:
          dto.heroImageUrl === undefined
            ? undefined
            : this.digitalOceanService.normalizeToPublicUrl(dto.heroImageUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(updated);
  }

  private normalize(page: AboutPage): AboutPage {
    return {
      ...page,
      heroImageUrl: this.digitalOceanService.normalizeToPublicUrl(
        page.heroImageUrl,
      ),
    };
  }
}
