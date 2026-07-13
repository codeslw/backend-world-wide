import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateReviewDto, ReviewTypeDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Prisma, Review } from '@prisma/client';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { ReviewFilterOptionsResponseDto } from './dto/review-filter-options.dto';
import { InvalidDataException } from '../common/exceptions/app.exceptions';

export const MAX_HOMEPAGE_REVIEWS = 3;

export interface ReviewFilters {
  type?: ReviewTypeDto;
  country?: string;
  year?: number;
  program?: string;
  university?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    const review = await this.prisma.review.create({
      data: {
        ...dto,
        imageUrl: this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
        type: dto.type ?? ReviewTypeDto.STUDENT_TESTIMONIAL,
        rating: dto.rating ?? 5,
      },
    });

    return this.normalizeReviewImage(review);
  }

  async findAll(filters: ReviewFilters = {}): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: this.buildWhere(filters),
      orderBy: [
        { sortOrder: 'asc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return reviews.map((review) => this.normalizeReviewImage(review));
  }

  async findTop(limit = 3, filters: ReviewFilters = {}): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: this.buildWhere(filters),
      orderBy: [
        { sortOrder: 'asc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return reviews.map((review) => this.normalizeReviewImage(review));
  }

  async findHomepage(filters: ReviewFilters = {}): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: { ...this.buildWhere(filters), showOnHomepage: true },
      orderBy: [
        { sortOrder: 'asc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: MAX_HOMEPAGE_REVIEWS,
    });

    return reviews.map((review) => this.normalizeReviewImage(review));
  }

  async getFilterOptions(
    lang: string = 'uz',
  ): Promise<ReviewFilterOptionsResponseDto> {
    const [countries, programs, reviews] = await Promise.all([
      this.prisma.country.findMany({
        select: { nameUz: true, nameRu: true, nameEn: true },
        orderBy: { nameEn: 'asc' },
      }),
      this.prisma.program.findMany({
        select: { title: true },
        orderBy: { title: 'asc' },
      }),
      this.prisma.review.findMany({
        select: {
          createdAt: true,
          degree: true,
          university: true,
          country: true,
          destinationCountry: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const localizedCountryOptions = countries.map((country) => {
      const label = this.pickLocalized(country, 'name', lang);
      return { value: label, label };
    });

    const catalogProgramOptions = programs.map((program) => {
      const label = this.pickLocalized(program, 'title', lang);
      return { value: label, label };
    });

    const existingDegreeOptions = this.toOptions(
      reviews.map((review) => review.degree),
    );

    const universityOptions = this.dedupeOptions(
      reviews.flatMap((review) => {
        const value = review.university?.trim();
        if (!value) return [];
        const country =
          review.destinationCountry?.trim() ||
          review.country?.trim() ||
          undefined;
        return [{ value, label: value, country }];
      }),
    );

    const years = Array.from(
      new Set(reviews.map((review) => review.createdAt.getFullYear())),
    )
      .sort((a, b) => b - a)
      .map((year) => ({ value: String(year), label: String(year) }));

    return {
      countries: this.sortOptions(this.dedupeOptions(localizedCountryOptions)),
      programs: this.sortOptions(
        this.dedupeOptions([
          ...catalogProgramOptions,
          ...existingDegreeOptions,
        ]),
      ),
      universities: this.sortOptions(universityOptions),
      years,
    };
  }

  async update(id: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);

    if (dto.showOnHomepage && !review.showOnHomepage) {
      await this.assertHomepageCapNotReached();
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...dto,
        imageUrl:
          dto.imageUrl === undefined
            ? undefined
            : this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
      },
    });

    return this.normalizeReviewImage(updated);
  }

  /**
   * Toggles showOnHomepage for `id`. When enabling and the cap is already
   * reached, `replaceId` must name a currently-featured review to swap out —
   * both writes happen in one transaction so the homepage set never briefly
   * exceeds MAX_HOMEPAGE_REVIEWS or drops below what the admin intended.
   */
  async setHomepageVisibility(
    id: string,
    show: boolean,
    replaceId?: string,
  ): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);

    if (!show) {
      const updated = await this.prisma.review.update({
        where: { id },
        data: { showOnHomepage: false },
      });
      return this.normalizeReviewImage(updated);
    }

    if (review.showOnHomepage) {
      return this.normalizeReviewImage(review);
    }

    const currentCount = await this.prisma.review.count({
      where: { showOnHomepage: true },
    });

    if (currentCount < MAX_HOMEPAGE_REVIEWS) {
      const updated = await this.prisma.review.update({
        where: { id },
        data: { showOnHomepage: true },
      });
      return this.normalizeReviewImage(updated);
    }

    if (!replaceId) {
      throw new InvalidDataException(
        `Home page already has ${MAX_HOMEPAGE_REVIEWS} reviews. Choose one to replace.`,
      );
    }

    const replaceTarget = await this.prisma.review.findUnique({
      where: { id: replaceId },
    });
    if (!replaceTarget?.showOnHomepage) {
      throw new InvalidDataException(
        'The review to replace is not currently shown on the home page',
      );
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.review.update({
        where: { id: replaceId },
        data: { showOnHomepage: false },
      }),
      this.prisma.review.update({
        where: { id },
        data: { showOnHomepage: true },
      }),
    ]);

    return this.normalizeReviewImage(updated);
  }

  private async assertHomepageCapNotReached(): Promise<void> {
    const count = await this.prisma.review.count({
      where: { showOnHomepage: true },
    });
    if (count >= MAX_HOMEPAGE_REVIEWS) {
      throw new InvalidDataException(
        `Cannot show on home page: maximum of ${MAX_HOMEPAGE_REVIEWS} reviews can be pinned at a time`,
      );
    }
  }

  async remove(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
    return this.prisma.review.delete({ where: { id } });
  }

  private normalizeReviewImage(review: Review): Review {
    return {
      ...review,
      imageUrl: this.digitalOceanService.normalizeToPublicUrl(review.imageUrl),
    };
  }

  private buildWhere(filters: ReviewFilters): Prisma.ReviewWhereInput {
    const where: Prisma.ReviewWhereInput = {};

    if (filters.type) where.type = filters.type;

    if (filters.country?.trim()) {
      const country = filters.country.trim();
      where.OR = [
        { country: { equals: country, mode: 'insensitive' } },
        { destinationCountry: { equals: country, mode: 'insensitive' } },
      ];
    }

    if (filters.program?.trim()) {
      where.degree = { equals: filters.program.trim(), mode: 'insensitive' };
    }

    if (filters.university?.trim()) {
      where.university = {
        equals: filters.university.trim(),
        mode: 'insensitive',
      };
    }

    if (filters.year && Number.isInteger(filters.year)) {
      where.createdAt = {
        gte: new Date(Date.UTC(filters.year, 0, 1)),
        lt: new Date(Date.UTC(filters.year + 1, 0, 1)),
      };
    }

    return where;
  }

  private pickLocalized(
    item: Record<string, string | null>,
    fieldPrefix: string,
    lang: string,
  ): string {
    const normalizedLang = ['uz', 'ru', 'en'].includes(lang) ? lang : 'uz';
    return (
      item[`${fieldPrefix}${this.capitalize(normalizedLang)}`] ||
      item[`${fieldPrefix}En`] ||
      item[`${fieldPrefix}Uz`] ||
      ''
    );
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private toOptions(values: Array<string | null>): Array<{
    value: string;
    label: string;
  }> {
    return values
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .map((value) => ({ value, label: value }));
  }

  private dedupeOptions<T extends { value: string; label: string }>(
    options: T[],
  ): T[] {
    const seen = new Set<string>();
    return options.filter((option) => {
      const key = option.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortOptions<T extends { label: string }>(options: T[]): T[] {
    return [...options].sort((a, b) => a.label.localeCompare(b.label));
  }
}
