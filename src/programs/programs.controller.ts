import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiHeader, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProgramResponseDto, PaginatedProgramResponseDto } from './dto/program-response.dto';
import { CreateManyProgramsDto } from './dto/create-many-programs.dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new program (Admin only)' })
  @ApiResponse({ status: 201, description: 'Program successfully created', type: ProgramResponseDto })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Post('create/many')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create multiple programs at once (Admin only)' })
  @ApiResponse({ status: 201, description: 'Programs successfully created' })
  createMany(@Body() createManyProgramsDto: CreateManyProgramsDto) {
    return this.programsService.createMany(createManyProgramsDto.programs);
  }

  @Get()
  @ApiOperation({ summary: 'Get all programs with pagination and search, optionally filtered by parent ID' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent program ID' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'List of programs', type: PaginatedProgramResponseDto })
  findAll(
    @Query('parentId') parentId?: string,
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.programsService.findAll(parentId, lang, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a program by ID' })
  @ApiParam({ name: 'id', description: 'Program ID (UUID)' })
  @ApiHeader({ name: 'Accept-Language', enum: ['uz', 'ru', 'en'], description: 'Language preference' })
  @ApiResponse({ status: 200, description: 'Program details', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  findOne(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.programsService.findOne(id, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a program (Admin only)' })
  @ApiParam({ name: 'id', description: 'Program ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Program updated', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a program (Admin only)' })
  @ApiParam({ name: 'id', description: 'Program ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Program deleted', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
} 