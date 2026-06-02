import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateReviewDto, ReviewTypeDto } from './dto/create-review.dto';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    return this.prisma.review.create({
      data: {
        ...dto,
        type: dto.type ?? ReviewTypeDto.STUDENT_TESTIMONIAL,
        rating: dto.rating ?? 5,
      },
    });
  }

  async findAll(type?: ReviewTypeDto): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { rating: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findTop(limit = 3, type?: ReviewTypeDto): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async remove(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
    return this.prisma.review.delete({ where: { id } });
  }
}
