import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiHeader, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UniversityResponseDto, PaginatedUniversityResponseDto } from './dto/university-response.dto';
import { UniversityType } from '../common/enum/university-type.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new university (Admin only)' })
  @ApiResponse({ status: 201, description: 'University successfully created', type: UniversityResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Conflict - University with these details already exists', type: ErrorResponseDto })
  create(@Body() createUniversityDto: CreateUniversityDto) {
    return this.universitiesService.create(createUniversityDto);
  }

  @Post('create/many')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple universities at once (Admin only)' })
  @ApiBody({ type: [CreateUniversityDto] })
  @ApiResponse({ status: 201, description: 'Universities successfully created', type: [UniversityResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Conflict - One or more universities already exist', type: ErrorResponseDto })
  createMany(@Body() createUniversityDtos: CreateUniversityDto[]) {
    return this.universitiesService.createMany(createUniversityDtos);
  }

  @Get()
  @ApiOperation({ summary: 'Get all universities with pagination, filtering, and search' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'countryCode', required: false, description: 'Filter by country code' })
  @ApiQuery({ name: 'cityId', required: false, description: 'Filter by city ID' })
  @ApiQuery({ name: 'type', required: false, enum: UniversityType, description: 'Filter by university type' })
  @ApiQuery({ name: 'minRanking', required: false, description: 'Filter by minimum ranking' })
  @ApiQuery({ name: 'maxRanking', required: false, description: 'Filter by maximum ranking' })
  @ApiQuery({ name: 'minEstablished', required: false, description: 'Filter by minimum establishment year' })
  @ApiQuery({ name: 'maxEstablished', required: false, description: 'Filter by maximum establishment year' })
  @ApiQuery({ name: 'minAcceptanceRate', required: false, description: 'Filter by minimum acceptance rate' })
  @ApiQuery({ name: 'maxAcceptanceRate', required: false, description: 'Filter by maximum acceptance rate' })
  @ApiQuery({ name: 'minApplicationFee', required: false, description: 'Filter by minimum application fee' })
  @ApiQuery({ name: 'maxApplicationFee', required: false, description: 'Filter by maximum application fee' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortDirection', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of universities', type: PaginatedUniversityResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid parameters', type: ErrorResponseDto })
  findAll(
    @Query('countryCode', new ParseIntPipe({ optional: true })) countryCode?: number,
    @Query('cityId') cityId?: string,
    @Query('type') type?: string,
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.universitiesService.findAll(countryCode, cityId, type, lang, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a university by ID' })
  @ApiParam({ name: 'id', description: 'University ID (UUID)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'University details', type: UniversityResponseDto })
  @ApiResponse({ status: 404, description: 'University not found', type: ErrorResponseDto })
  findOne(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.universitiesService.findOne(id, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a university (Admin only)' })
  @ApiParam({ name: 'id', description: 'University ID (UUID)' })
  @ApiResponse({ status: 200, description: 'University updated', type: UniversityResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'University not found', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Conflict - University with these details already exists', type: ErrorResponseDto })
  update(@Param('id') id: string, @Body() updateUniversityDto: UpdateUniversityDto) {
    return this.universitiesService.update(id, updateUniversityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a university (Admin only)' })
  @ApiParam({ name: 'id', description: 'University ID (UUID)' })
  @ApiResponse({ status: 200, description: 'University deleted', type: UniversityResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'University not found', type: ErrorResponseDto })
  remove(@Param('id') id: string) {
    return this.universitiesService.remove(id);
  }
} 