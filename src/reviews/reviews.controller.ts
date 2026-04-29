import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new review (public)' })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews sorted by rating (public)' })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top N reviews by rating (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  findTop(@Query('limit') limit?: string) {
    return this.reviewsService.findTop(limit ? parseInt(limit) : 3);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a review (admin only)' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
