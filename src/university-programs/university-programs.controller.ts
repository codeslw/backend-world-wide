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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UniversityProgramsService } from './university-programs.service';
import { CreateUniversityProgramDto } from './dto/create-university-program.dto';
import { UpdateUniversityProgramDto } from './dto/update-university-program.dto';
import { UniversityProgramFilterDto } from './dto/university-program-filter.dto';
import { ProgramAdmissionRequirementDto } from './dto/program-admission-requirement.dto';
import { PaginatedUniversityProgramResponseDto } from './dto/paginated-university-program-response.dto';
import {
  ProgramAdmissionRequirementResponseDto,
  UniversityProgramDetailDto,
  UniversityProgramFacetsDto,
} from './dto/university-program-response.dto';

@ApiTags('university-programs')
@Controller('university-programs')
export class UniversityProgramsController {
  constructor(
    private readonly universityProgramsService: UniversityProgramsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Search the public program catalog across all universities',
    description:
      'Only active programs are returned. Supports faceted filtering, student eligibility filters and sorting.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference (defaults to uz)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of programs',
    type: PaginatedUniversityProgramResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
    type: ErrorResponseDto,
  })
  findAll(
    @Query() filterDto: UniversityProgramFilterDto,
    @Headers('accept-language') lang = 'uz',
  ): Promise<PaginatedUniversityProgramResponseDto> {
    return this.universityProgramsService.findAll(filterDto, lang);
  }

  // Declared before ':idOrSlug' so the param route does not swallow it.
  @Get('facets')
  @ApiOperation({
    summary: 'Catalog filter sidebar counts',
    description:
      'Counts of active programs grouped by faculty, department and study level, honouring the same filters as the list endpoint.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference (defaults to uz)',
  })
  @ApiResponse({
    status: 200,
    description: 'Facet buckets',
    type: UniversityProgramFacetsDto,
  })
  getFacets(
    @Query() filterDto: UniversityProgramFilterDto,
    @Headers('accept-language') lang = 'uz',
  ): Promise<UniversityProgramFacetsDto> {
    return this.universityProgramsService.getFacets(filterDto, lang);
  }

  @Get('admin/:idOrSlug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a program by id or slug, including deactivated ones',
    description:
      'Admin-only twin of GET /:idOrSlug. Deactivating a program is the ' +
      'recommended alternative to deleting one that already has ' +
      'applications, and the data migration left placeholder programs ' +
      'inactive, so the editor has to be able to load them.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'Program UUID or public slug' })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference (defaults to uz)',
  })
  @ApiResponse({
    status: 200,
    description: 'Program details',
    type: UniversityProgramDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
    type: ErrorResponseDto,
  })
  findOneForAdmin(
    @Param('idOrSlug') idOrSlug: string,
    @Headers('accept-language') lang = 'uz',
  ): Promise<UniversityProgramDetailDto> {
    return this.universityProgramsService.findOne(idOrSlug, lang, {
      includeInactive: true,
    });
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a program by id or slug' })
  @ApiParam({
    name: 'idOrSlug',
    description: 'Program UUID or public slug',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference (defaults to uz)',
  })
  @ApiResponse({
    status: 200,
    description: 'Program details',
    type: UniversityProgramDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found or inactive',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Headers('accept-language') lang = 'uz',
  ): Promise<UniversityProgramDetailDto> {
    return this.universityProgramsService.findOne(idOrSlug, lang);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a program (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Program created',
    type: UniversityProgramDetailDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
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
  create(
    @Body() createDto: CreateUniversityProgramDto,
    @Headers('accept-language') lang = 'uz',
  ): Promise<UniversityProgramDetailDto> {
    return this.universityProgramsService.create(createDto, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update a program (Admin only)',
    description:
      'Partial update. campusIds / intakeIds / admissionRequirement are replaced wholesale when present. Renaming does not change the slug unless `slug` is supplied.',
  })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({
    status: 200,
    description: 'Program updated',
    type: UniversityProgramDetailDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
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
    description: 'Program not found',
    type: ErrorResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUniversityProgramDto,
    @Headers('accept-language') lang = 'uz',
  ): Promise<UniversityProgramDetailDto> {
    return this.universityProgramsService.update(id, updateDto, lang);
  }

  @Patch(':id/admission-requirement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Upsert the structured admission requirements (Admin only)',
    description:
      'Replaces the whole requirements block so the admin requirements tab can save on its own.',
  })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({
    status: 200,
    description: 'Admission requirement saved',
    type: ProgramAdmissionRequirementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
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
    description: 'Program not found',
    type: ErrorResponseDto,
  })
  upsertAdmissionRequirement(
    @Param('id') id: string,
    @Body() requirementDto: ProgramAdmissionRequirementDto,
    @Headers('accept-language') lang = 'uz',
  ): Promise<ProgramAdmissionRequirementResponseDto> {
    return this.universityProgramsService.upsertAdmissionRequirement(
      id,
      requirementDto,
      lang,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a program (Admin only)',
    description:
      'Blocked while applications reference the program; deactivate it instead.',
  })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({ status: 204, description: 'Program deleted' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - related applications exist',
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
    description: 'Program not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.universityProgramsService.remove(id);
  }
}
