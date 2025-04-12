import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UseGuards, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CountryResponseDto, PaginatedCountryResponseDto } from './dto/country-response.dto';
import { CreateManyCountriesDto } from './dto/create-many-countries.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new country (Admin only)' })
  @ApiResponse({ status: 201, description: 'Country successfully created', type: CountryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Conflict - Country with this code already exists', type: ErrorResponseDto })
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countriesService.create(createCountryDto);
  }

  @Post('create/many')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create multiple countries at once' })
  @ApiResponse({ status: 201, description: 'Countries successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Conflict - One or more countries already exist', type: ErrorResponseDto })
  createMany(@Body() createManyCountriesDto: CreateManyCountriesDto) {
    return this.countriesService.createMany(createManyCountriesDto.countries);
  }

  @Get()
  @ApiOperation({ summary: 'Get all countries with pagination and search' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of countries', type: PaginatedCountryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid parameters', type: ErrorResponseDto })
  findAll(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto: PaginationDto,
  ) {
    return this.countriesService.findAll(lang, paginationDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get a country by code' })
  @ApiParam({ name: 'code', description: 'Country code (numeric)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'Country details', type: CountryResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found', type: ErrorResponseDto })
  findOne(
    @Param('code') code: number,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.countriesService.findOne(code, lang);
  }

  @Patch(':code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a country (Admin only)' })
  @ApiParam({ name: 'code', description: 'Country code (numeric)' })
  @ApiResponse({ status: 200, description: 'Country updated', type: CountryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found', type: ErrorResponseDto })
  update(@Param('code') code: number, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countriesService.update(code, updateCountryDto);
  }

  @Delete(':code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a country (Admin only)' })
  @ApiParam({ name: 'code', description: 'Country code (numeric)' })
  @ApiResponse({ status: 200, description: 'Country deleted', type: CountryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found', type: ErrorResponseDto })
  remove(@Param('code') code: number) {
    return this.countriesService.remove(code);
  }
} 