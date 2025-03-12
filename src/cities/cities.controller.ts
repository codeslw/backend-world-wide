import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers, UseGuards } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiHeader, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CityResponseDto, PaginatedCityResponseDto } from './dto/city-response.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new city (Admin only)' })
  @ApiResponse({ status: 201, description: 'City successfully created', type: CityResponseDto })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cities with pagination and search, optionally filtered by country ID' })
  @ApiQuery({ name: 'countryId', required: false, description: 'Filter by country ID' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of cities', type: PaginatedCityResponseDto })
  findAll(
    @Query('countryId') countryId?: string,
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.citiesService.findAll(countryId, lang, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a city by ID' })
  @ApiParam({ name: 'id', description: 'City ID (UUID)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'City details', type: CityResponseDto })
  @ApiResponse({ status: 404, description: 'City not found' })
  findOne(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.citiesService.findOne(id, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a city (Admin only)' })
  @ApiParam({ name: 'id', description: 'City ID (UUID)' })
  @ApiResponse({ status: 200, description: 'City updated', type: CityResponseDto })
  @ApiResponse({ status: 404, description: 'City not found' })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(id, updateCityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a city (Admin only)' })
  @ApiParam({ name: 'id', description: 'City ID (UUID)' })
  @ApiResponse({ status: 200, description: 'City deleted', type: CityResponseDto })
  @ApiResponse({ status: 404, description: 'City not found' })
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
} 