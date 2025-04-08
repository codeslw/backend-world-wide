import { Controller, Get, Param, Query, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedCountryResponseDto, CountryResponseDto } from '../countries/dto/country-response.dto';
import { PaginatedCityResponseDto, CityResponseDto } from '../cities/dto/city-response.dto';
import { PaginatedProgramResponseDto, ProgramResponseDto } from '../programs/dto/program-response.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries for catalog display' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of countries', type: PaginatedCountryResponseDto })
  getCountries(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto: PaginationDto,
  ) {
    return this.catalogService.getCountries(lang, paginationDto);
  }

  @Get('countries/:code')
  @ApiOperation({ summary: 'Get a country by code' })
  @ApiParam({ name: 'code', description: 'Country code (numeric)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'Country details', type: CountryResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found' })
  getCountry(
    @Param('code', ParseIntPipe) code: number,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.catalogService.getCountry(code, lang);
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get all cities for catalog display, optionally filtered by country ID' })
  @ApiQuery({ name: 'countryCode', required: false, description: 'Filter by country code' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of cities', type: PaginatedCityResponseDto })
  getCities(
    @Query('countryCode', new ParseIntPipe({ optional: true })) countryCode?: number,
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.catalogService.getCities(countryCode, lang, paginationDto);
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get a city by ID for catalog display' })
  @ApiParam({ name: 'id', description: 'City ID (UUID)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'City details', type: CityResponseDto })
  @ApiResponse({ status: 404, description: 'City not found' })
  getCity(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.catalogService.getCity(id, lang);
  }

  @Get('programs')
  @ApiOperation({ summary: 'Get all programs for catalog display, optionally filtered by parent ID' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent program ID' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of programs', type: PaginatedProgramResponseDto })
  getPrograms(
    @Query('parentId') parentId?: string,
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.catalogService.getPrograms(parentId, lang, paginationDto);
  }

  @Get('programs/root')
  @ApiOperation({ summary: 'Get only root-level programs (without parent)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of root programs', type: PaginatedProgramResponseDto })
  getRootPrograms(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.catalogService.getRootPrograms(lang, paginationDto);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get a program by ID for catalog display' })
  @ApiParam({ name: 'id', description: 'Program ID (UUID)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'Program details', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  getProgram(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.catalogService.getProgram(id, lang);
  }
} 