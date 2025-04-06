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
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countriesService.create(createCountryDto);
  }

  @Post('create/many')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create multiple countries at once (Admin only)' })
  @ApiResponse({ status: 201, description: 'Countries successfully created' })
  createMany(@Body() createManyCountriesDto: CreateManyCountriesDto) {
    return this.countriesService.createMany(createManyCountriesDto.countries);
  }

  @Get()
  @ApiOperation({ summary: 'Get all countries with pagination and search' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of countries', type: PaginatedCountryResponseDto })
  findAll(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto: PaginationDto,
  ) {
    return this.countriesService.findAll(lang, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by ID' })
  @ApiParam({ name: 'id', description: 'Country ID (UUID)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'Country details', type: CountryResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found' })
  findOne(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.countriesService.findOne(id, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a country (Admin only)' })
  @ApiParam({ name: 'id', description: 'Country ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Country updated', type: CountryResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found' })
  update(@Param('id') id: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countriesService.update(id, updateCountryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a country (Admin only)' })
  @ApiParam({ name: 'id', description: 'Country ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Country deleted', type: CountryResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found' })
  remove(@Param('id') id: string) {
    return this.countriesService.remove(id);
  }
} 