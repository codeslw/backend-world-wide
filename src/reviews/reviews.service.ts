import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateReviewDto, ReviewTypeDto } from './dto/create-review.dto';
import { Review } from '@prisma/client';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';

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

  async findAll(type?: ReviewTypeDto): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { rating: 'desc' }, { createdAt: 'desc' }],
    });

    return reviews.map((review) => this.normalizeReviewImage(review));
  }

  async findTop(limit = 3, type?: ReviewTypeDto): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return reviews.map((review) => this.normalizeReviewImage(review));
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
}
