import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateReviewDto, ReviewTypeDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Prisma, Review } from '@prisma/client';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';

export interface ReviewFilters {
  type?: ReviewTypeDto;
  country?: string;
  year?: number;
  program?: string;
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

  async update(id: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);

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

    if (filters.year && Number.isInteger(filters.year)) {
      where.createdAt = {
        gte: new Date(Date.UTC(filters.year, 0, 1)),
        lt: new Date(Date.UTC(filters.year + 1, 0, 1)),
      };
    }

    return where;
  }
}
