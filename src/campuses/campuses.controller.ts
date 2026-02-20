import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CampusesService } from './campuses.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { CampusResponseDto } from './dto/campus-response.dto';

@ApiTags('Campuses')
@Controller('campuses')
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campus' })
  @ApiResponse({ status: 201, type: CampusResponseDto })
  create(@Body() createCampusDto: CreateCampusDto) {
    return this.campusesService.create(createCampusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campuses' })
  @ApiQuery({ name: 'universityId', required: false, type: String })
  @ApiResponse({ status: 200, type: [CampusResponseDto] })
  findAll(@Query('universityId') universityId?: string) {
    return this.campusesService.findAll(universityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campus by ID' })
  @ApiResponse({ status: 200, type: CampusResponseDto })
  findOne(@Param('id') id: string) {
    return this.campusesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campus' })
  @ApiResponse({ status: 200, type: CampusResponseDto })
  update(@Param('id') id: string, @Body() updateCampusDto: UpdateCampusDto) {
    return this.campusesService.update(id, updateCampusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campus' })
  @ApiResponse({ status: 200, type: CampusResponseDto })
  remove(@Param('id') id: string) {
    return this.campusesService.remove(id);
  }
}
