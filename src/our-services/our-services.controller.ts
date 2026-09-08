import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OurServicesService } from './our-services.service';
import { CreateOurServiceDto } from './dto/create-our-service.dto';
import { UpdateOurServiceDto } from './dto/update-our-service.dto';
import { UpdateOurServicesPageDto } from './dto/update-our-services-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

type Lang = 'uz' | 'ru' | 'en';

@ApiTags('Our Services')
@Controller('our-services')
export class OurServicesController {
  constructor(private readonly ourServicesService: OurServicesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get public localized services list and page hero copy',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
  })
  @ApiResponse({ status: 200 })
  getPublicServices(@Headers('Accept-Language') lang: string = 'uz') {
    const effective: Lang = (['uz', 'ru', 'en'].includes(lang) ? lang : 'uz') as Lang;
    return this.ourServicesService.getPublicPayload(effective);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all services for admin panel (including inactive)' })
  @ApiResponse({ status: 200 })
  getAllAdmin() {
    return this.ourServicesService.getAllServicesAdmin();
  }

  @Get('page')
  @ApiOperation({ summary: 'Get raw page content settings' })
  @ApiResponse({ status: 200 })
  getPageContent() {
    return this.ourServicesService.ensurePageContent();
  }

  @Patch('page')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update page header & banner copy' })
  @ApiResponse({ status: 200 })
  updatePageContent(@Body() dto: UpdateOurServicesPageDto) {
    return this.ourServicesService.updatePageContent(dto);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get single service by ID or Slug' })
  @ApiResponse({ status: 200 })
  getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.ourServicesService.getServiceBySlugOrId(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new service (admin only)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateOurServiceDto) {
    return this.ourServicesService.createService(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a service (admin only)' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateOurServiceDto) {
    return this.ourServicesService.updateService(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a service (admin only)' })
  @ApiResponse({ status: 200 })
  delete(@Param('id') id: string) {
    return this.ourServicesService.deleteService(id);
  }
}
