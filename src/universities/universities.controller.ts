import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  UniversityResponseDto,
  PaginatedUniversityResponseDto,
} from './dto/university-response.dto';
import { UniversityType } from '../common/enum/university-type.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UniversityFilterDto } from './dto/university-filter.dto';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new university (Admin only)' })
  @ApiBody({ type: CreateUniversityDto, description: 'Data for creating a new university, including programs with tuition fees.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'University successfully created', type: UniversityResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request - Invalid data provided (e.g., invalid UUIDs, missing fields, invalid program IDs)', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict - University creation failed due to duplicate data', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error', type: ErrorResponseDto })
  async create(@Body() createUniversityDto: CreateUniversityDto): Promise<UniversityResponseDto> {
    return this.universitiesService.create(createUniversityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all universities with pagination, filtering, and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, description, website' })
  @ApiQuery({ name: 'countryCode', required: false, type: Number, description: 'Filter by country code (integer ID)' })
  @ApiQuery({ name: 'cityId', required: false, type: String, description: 'Filter by city ID (UUID)' })
  @ApiQuery({ name: 'type', required: false, enum: UniversityType, description: 'Filter by university type' })
  @ApiQuery({ name: 'minRanking', required: false, type: Number, description: 'Filter by minimum ranking' })
  @ApiQuery({ name: 'maxRanking', required: false, type: Number, description: 'Filter by maximum ranking' })
  @ApiQuery({ name: 'minEstablished', required: false, type: Number, description: 'Filter by minimum establishment year' })
  @ApiQuery({ name: 'maxEstablished', required: false, type: Number, description: 'Filter by maximum establishment year' })
  @ApiQuery({ name: 'minAcceptanceRate', required: false, type: Number, description: 'Filter by minimum acceptance rate (%)' })
  @ApiQuery({ name: 'maxAcceptanceRate', required: false, type: Number, description: 'Filter by maximum acceptance rate (%)' })
  @ApiQuery({ name: 'minApplicationFee', required: false, type: Number, description: 'Filter by minimum average application fee' })
  @ApiQuery({ name: 'maxApplicationFee', required: false, type: Number, description: 'Filter by maximum average application fee' })
  @ApiQuery({ name: 'programs', required: false, type: String, description: 'Filter by program IDs (comma-separated UUIDs string)', style: 'form', explode: false })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (e.g., ranking, nameUz, createdAt)' })
  @ApiQuery({ name: 'sortDirection', required: false, enum: ['asc', 'desc'], description: 'Sort direction (asc or desc)' })
  @ApiHeader({ name: 'Accept-Language', required: false, enum: ['uz', 'ru', 'en'], description: 'Language preference for localized fields (default: uz)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved list of universities', type: PaginatedUniversityResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request - Invalid query parameters', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error', type: ErrorResponseDto })
  async findAll(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() filterDto: UniversityFilterDto,
  ): Promise<PaginatedUniversityResponseDto> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findAll(filterDto, effectiveLang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single university by its ID' })
  @ApiParam({ name: 'id', required: true, description: 'University ID (UUID format)', type: String })
  @ApiHeader({ name: 'Accept-Language', required: false, enum: ['uz', 'ru', 'en'], description: 'Language preference for localized fields (default: uz)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved university details', type: UniversityResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found - University with the specified ID does not exist', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request - Invalid ID format', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error', type: ErrorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ): Promise<UniversityResponseDto> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findOne(id, effectiveLang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing university (Admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'University ID (UUID format)', type: String })
  @ApiBody({ type: UpdateUniversityDto, description: 'Data to update for the university. Fields not provided will remain unchanged. Programs array replaces existing programs.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'University successfully updated', type: UniversityResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request - Invalid data provided (e.g., invalid UUIDs, invalid program IDs)', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found - University with the specified ID does not exist', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict - Update failed due to duplicate data', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error', type: ErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUniversityDto: UpdateUniversityDto
  ): Promise<UniversityResponseDto> {
    return this.universitiesService.update(id, updateUniversityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a university (Admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'University ID (UUID format)', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'University successfully deleted' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - Authentication required', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found - University with the specified ID does not exist', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error', type: ErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.universitiesService.remove(id);
  }
} 