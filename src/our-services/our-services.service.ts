import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateOurServiceDto } from './dto/create-our-service.dto';
import { UpdateOurServiceDto } from './dto/update-our-service.dto';
import { UpdateOurServicesPageDto } from './dto/update-our-services-page.dto';

type Lang = 'uz' | 'ru' | 'en';

@Injectable()
export class OurServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public endpoint payload: returns localized active services list + page header copy.
   */
  async getPublicPayload(lang: Lang = 'uz') {
    const pageContent = await this.ensurePageContent();
    const services = await this.prisma.ourService.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const isRu = lang === 'ru';
    const isEn = lang === 'en';

    const localizedServices = services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: isEn ? s.titleEn : isRu ? s.titleRu : s.titleUz,
      shortDesc: isEn ? s.shortDescEn : isRu ? s.shortDescRu : s.shortDescUz,
      fullDesc: isEn ? s.fullDescEn : isRu ? s.fullDescRu : s.fullDescUz,
      iconName: s.iconName,
      badge: isEn ? s.badgeEn : isRu ? s.badgeRu : s.badgeUz,
      features: isEn ? s.featuresEn : isRu ? s.featuresRu : s.featuresUz,
      actionText: isEn ? s.actionTextEn : isRu ? s.actionTextRu : s.actionTextUz,
      actionUrl: s.actionUrl,
      sortOrder: s.sortOrder,
      isFeatured: s.isFeatured,
      // Raw fields included so clients can fallback if needed
      titleUz: s.titleUz,
      titleRu: s.titleRu,
      titleEn: s.titleEn,
    }));

    return {
      hero: {
        title: isEn ? pageContent.heroTitleEn : isRu ? pageContent.heroTitleRu : pageContent.heroTitleUz,
        subtitle: isEn ? pageContent.heroSubtitleEn : isRu ? pageContent.heroSubtitleRu : pageContent.heroSubtitleUz,
        bannerTitle: isEn ? pageContent.bannerTitleEn : isRu ? pageContent.bannerTitleRu : pageContent.bannerTitleUz,
        bannerSubtitle: isEn ? pageContent.bannerSubtitleEn : isRu ? pageContent.bannerSubtitleRu : pageContent.bannerSubtitleUz,
      },
      services: localizedServices,
    };
  }

  /**
   * Admin raw list of all services
   */
  async getAllServicesAdmin() {
    return this.prisma.ourService.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get single service by ID or Slug
   */
  async getServiceBySlugOrId(idOrSlug: string) {
    const service = await this.prisma.ourService.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!service) {
      throw new NotFoundException(`Service '${idOrSlug}' not found`);
    }
    return service;
  }

  /**
   * Create a new service
   */
  async createService(dto: CreateOurServiceDto) {
    return this.prisma.ourService.create({
      data: dto,
    });
  }

  /**
   * Update an existing service
   */
  async updateService(id: string, dto: UpdateOurServiceDto) {
    await this.getServiceBySlugOrId(id);
    return this.prisma.ourService.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a service
   */
  async deleteService(id: string) {
    await this.getServiceBySlugOrId(id);
    return this.prisma.ourService.delete({
      where: { id },
    });
  }

  /**
   * Get or initialize singleton page content
   */
  async ensurePageContent() {
    let page = await this.prisma.ourServicesPage.findFirst();
    if (!page) {
      page = await this.prisma.ourServicesPage.create({
        data: {
          heroTitleUz: "Xizmatlarimiz!",
          heroTitleRu: "Наши услуги!",
          heroTitleEn: "Our Services!",
          heroSubtitleUz: "O'qishga kirishdan tortib viza va aeroportda kutib olishgacha — barcha professional xizmatlarimiz",
          heroSubtitleRu: "От поступления в университет до визы и встречи в аэропорту — все наши профессиональные услуги",
          heroSubtitleEn: "From university admissions to visa assistance and airport pickup — all our professional services",
          bannerTitleUz: "Savollaringiz bormi yoki maslahat kerakmi?",
          bannerTitleRu: "Есть вопросы или нужна консультация?",
          bannerTitleEn: "Have questions or need consultation?",
          bannerSubtitleUz: "Bizning mutaxassislarimiz sizga eng maqbul yechimni taklif qilishadi",
          bannerSubtitleRu: "Наши специалисты предложат вам наилучшее решение",
          bannerSubtitleEn: "Our experts will offer you the best possible solution",
        },
      });
    }
    return page;
  }

  /**
   * Update page content hero/banner text
   */
  async updatePageContent(dto: UpdateOurServicesPageDto) {
    const page = await this.ensurePageContent();
    return this.prisma.ourServicesPage.update({
      where: { id: page.id },
      data: dto,
    });
  }
}
