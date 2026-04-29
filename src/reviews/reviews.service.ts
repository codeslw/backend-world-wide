import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    return this.prisma.review.create({ data: dto });
  }

  async findAll(): Promise<Review[]> {
    return this.prisma.review.findMany({
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findTop(limit = 3): Promise<Review[]> {
    return this.prisma.review.findMany({
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async remove(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
    return this.prisma.review.delete({ where: { id } });
  }
}
