import {
  Controller,
  Body,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewTypeDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewFilterOptionsResponseDto } from './dto/review-filter-options.dto';
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
  @ApiOperation({
    summary: 'Get all result items sorted by section order (public)',
  })
  @ApiQuery({ name: 'type', required: false, enum: ReviewTypeDto })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'program', required: false, type: String })
  @ApiQuery({ name: 'university', required: false, type: String })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  findAll(
    @Query('type') type?: ReviewTypeDto,
    @Query('country') country?: string,
    @Query('year') year?: string,
    @Query('program') program?: string,
    @Query('university') university?: string,
  ) {
    return this.reviewsService.findAll({
      type,
      country,
      year: year ? parseInt(year) : undefined,
      program,
      university,
    });
  }

  @Get('filter-options')
  @ApiOperation({ summary: 'Get result page filter options (public)' })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    description: 'Language preference',
  })
  @ApiResponse({ status: 200, type: ReviewFilterOptionsResponseDto })
  getFilterOptions(@Headers('Accept-Language') lang: string = 'uz') {
    return this.reviewsService.getFilterOptions(lang);
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top N result items (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ReviewTypeDto })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'program', required: false, type: String })
  @ApiQuery({ name: 'university', required: false, type: String })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  findTop(
    @Query('limit') limit?: string,
    @Query('type') type?: ReviewTypeDto,
    @Query('country') country?: string,
    @Query('year') year?: string,
    @Query('program') program?: string,
    @Query('university') university?: string,
  ) {
    return this.reviewsService.findTop(limit ? parseInt(limit) : 3, {
      type,
      country,
      year: year ? parseInt(year) : undefined,
      program,
      university,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a review/result item (admin only)' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
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
