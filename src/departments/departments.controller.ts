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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import {
  DepartmentResponseDto,
  PaginatedDepartmentResponseDto,
} from './dto/department-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

const SUPPORTED_LANGS = ['uz', 'ru', 'en'];

@ApiTags('departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  private resolveLang(lang?: string): string {
    const normalized = (lang || '').toLowerCase().split(',')[0].trim().slice(0, 2);
    return SUPPORTED_LANGS.includes(normalized) ? normalized : 'uz';
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Department successfully created',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid data or duplicate slug within the faculty',
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
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all departments with pagination, optionally filtered by faculty',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of departments',
    type: PaginatedDepartmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
    type: ErrorResponseDto,
  })
  findAll(
    @Query() query: QueryDepartmentDto,
    @Headers('accept-language') lang?: string,
  ) {
    return this.departmentsService.findAll(query, this.resolveLang(lang));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID (includes its faculty)' })
  @ApiParam({ name: 'id', description: 'Department ID (UUID)' })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'Department details',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @Headers('accept-language') lang?: string,
  ) {
    return this.departmentsService.findOne(id, this.resolveLang(lang));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a department (Admin only)' })
  @ApiParam({ name: 'id', description: 'Department ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Department updated',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid data or duplicate slug within the faculty',
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
    description: 'Department or faculty not found',
    type: ErrorResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department (Admin only)' })
  @ApiParam({ name: 'id', description: 'Department ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Department deleted' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - department is still referenced by university programs (RELATED_PROGRAMS_EXIST)',
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
    description: 'Department not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
