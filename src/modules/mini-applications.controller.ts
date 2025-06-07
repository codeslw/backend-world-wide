import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MiniApplicationsService } from './mini-applications.service';
import { CreateMiniApplicationDto } from './dto/create-mini-application.dto';
import { UpdateMiniApplicationDto } from './dto/update-mini-application.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MiniApplication } from '@prisma/client'; // Import the entity type
import {
  MiniApplicationResponseDto,
  PaginatedMiniApplicationResponseDto,
} from './dto/mini-application-response.dto';

@ApiTags('Mini Applications (Public)')
@Controller('mini-applications')
export class MiniApplicationsController {
  constructor(
    private readonly miniApplicationsService: MiniApplicationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mini application' })
  @ApiResponse({
    status: 201,
    description: 'The mini application has been successfully created.',
    type: MiniApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  // @ApiResponse({ status: 404, description: 'University not found.' })
  @ApiBody({ type: CreateMiniApplicationDto })
  async create(
    @Body() createMiniApplicationDto: CreateMiniApplicationDto,
  ): Promise<MiniApplication> {
    return this.miniApplicationsService.create(createMiniApplicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all mini applications with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (e.g., createdAt)',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved mini applications.',
    type: PaginatedMiniApplicationResponseDto,
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: MiniApplication[]; meta: any }> {
    return this.miniApplicationsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific mini application by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Mini Application ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved mini application.',
    type: MiniApplicationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mini application not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MiniApplication> {
    return this.miniApplicationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific mini application by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Mini Application ID',
  })
  @ApiBody({ type: UpdateMiniApplicationDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated mini application.',
    type: MiniApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({
    status: 404,
    description: 'Mini application or University not found.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMiniApplicationDto: UpdateMiniApplicationDto,
  ): Promise<MiniApplication> {
    return this.miniApplicationsService.update(id, updateMiniApplicationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific mini application by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Mini Application ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Successfully deleted mini application.',
  })
  @ApiResponse({ status: 404, description: 'Mini application not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.miniApplicationsService.remove(id);
  }
}
