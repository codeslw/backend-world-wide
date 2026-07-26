import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { QueryFacultyDto } from './dto/query-faculty.dto';
import {
  FacultyResponseDto,
  PaginatedFacultyResponseDto,
} from './dto/faculty-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

const SUPPORTED_LANGS = ['uz', 'ru', 'en'];

@ApiTags('faculties')
@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  private resolveLang(lang?: string): string {
    const normalized = (lang || '').toLowerCase().split(',')[0].trim().slice(0, 2);
    return SUPPORTED_LANGS.includes(normalized) ? normalized : 'uz';
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new faculty (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Faculty successfully created',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or duplicate slug',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultiesService.create(createFacultyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all faculties with pagination, search and optional relations',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of faculties',
    type: PaginatedFacultyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
    type: ErrorResponseDto,
  })
  findAll(
    @Query() query: QueryFacultyDto,
    @Headers('accept-language') lang?: string,
  ) {
    return this.facultiesService.findAll(query, this.resolveLang(lang));
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a faculty by UUID or slug (includes departments)' })
  @ApiParam({ name: 'idOrSlug', description: 'Faculty UUID or slug' })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'Faculty details',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Faculty not found',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Headers('accept-language') lang?: string,
  ) {
    return this.facultiesService.findOne(idOrSlug, this.resolveLang(lang));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a faculty (Admin only)' })
  @ApiParam({ name: 'id', description: 'Faculty ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Faculty updated',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or duplicate slug',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Faculty not found',
    type: ErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultiesService.update(id, updateFacultyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a faculty (Admin only)' })
  @ApiParam({ name: 'id', description: 'Faculty ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Faculty deleted' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - faculty still has departments (RELATED_DEPARTMENTS_EXIST) or university programs (RELATED_PROGRAMS_EXIST)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Faculty not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.facultiesService.remove(id);
  }
}
