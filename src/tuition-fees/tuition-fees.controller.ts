import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { TuitionFeesService } from './tuition-fees.service';
import { CreateTuitionFeeDto } from './dto/create-tuition-fee.dto';
import { UpdateTuitionFeeDto } from './dto/update-tuition-fee.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { TuitionFeeResponseDto, PaginatedTuitionFeeResponseDto } from './dto/tuition-fee-response.dto';

@ApiTags('tuition-fees')
@Controller('tuition-fees')
export class TuitionFeesController {
  constructor(private readonly tuitionFeesService: TuitionFeesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tuition fee (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tuition fee created', type: TuitionFeeResponseDto })
  create(@Body() createTuitionFeeDto: CreateTuitionFeeDto) {
    return this.tuitionFeesService.create(createTuitionFeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tuition fees' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  @ApiResponse({ status: 200, description: 'List of tuition fees', type: PaginatedTuitionFeeResponseDto })
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.tuitionFeesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tuition fee by ID' })
  @ApiParam({ name: 'id', description: 'Tuition fee ID' })
  @ApiResponse({ status: 200, description: 'Tuition fee details', type: TuitionFeeResponseDto })
  @ApiResponse({ status: 404, description: 'Tuition fee not found' })
  findOne(@Param('id') id: string) {
    return this.tuitionFeesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tuition fee (Admin only)' })
  @ApiParam({ name: 'id', description: 'Tuition fee ID' })
  @ApiResponse({ status: 200, description: 'Tuition fee updated', type: TuitionFeeResponseDto })
  @ApiResponse({ status: 404, description: 'Tuition fee not found' })
  update(@Param('id') id: string, @Body() updateTuitionFeeDto: UpdateTuitionFeeDto) {
    return this.tuitionFeesService.update(+id, updateTuitionFeeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tuition fee (Admin only)' })
  @ApiParam({ name: 'id', description: 'Tuition fee ID' })
  @ApiResponse({ status: 200, description: 'Tuition fee deleted', type: TuitionFeeResponseDto })
  @ApiResponse({ status: 404, description: 'Tuition fee not found' })
  remove(@Param('id') id: string) {
    return this.tuitionFeesService.remove(+id);
  }
} 