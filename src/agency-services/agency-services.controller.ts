import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgencyServicesService } from './agency-services.service';
import { CreateAgencyServiceDto } from './dto/create-agency-service.dto';
import { UpdateAgencyServiceDto } from './dto/update-agency-service.dto';
import { AgencyServiceResponseDto } from './dto/agency-service-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('Agency Services')
@Controller('agency-services')
export class AgencyServicesController {
  constructor(private readonly agencyServicesService: AgencyServicesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new agency service template' })
  @ApiResponse({ status: 201, type: AgencyServiceResponseDto })
  create(@Body() createAgencyServiceDto: CreateAgencyServiceDto) {
    return this.agencyServicesService.create(createAgencyServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agency service templates' })
  @ApiResponse({ status: 200, type: [AgencyServiceResponseDto] })
  findAll() {
    return this.agencyServicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agency service template by id' })
  @ApiResponse({ status: 200, type: AgencyServiceResponseDto })
  findOne(@Param('id') id: string) {
    return this.agencyServicesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an agency service template' })
  @ApiResponse({ status: 200, type: AgencyServiceResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateAgencyServiceDto: UpdateAgencyServiceDto,
  ) {
    return this.agencyServicesService.update(id, updateAgencyServiceDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an agency service template' })
  @ApiResponse({ status: 24, description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.agencyServicesService.remove(id);
  }
}
