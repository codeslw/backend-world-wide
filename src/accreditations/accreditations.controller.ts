import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccreditationsService } from './accreditations.service';
import { CreateAccreditationDto } from './dto/create-accreditation.dto';
import { UpdateAccreditationDto } from './dto/update-accreditation.dto';
import { AccreditationResponseDto } from './dto/accreditation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('Accreditations')
@Controller('accreditations')
export class AccreditationsController {
  constructor(private readonly accreditationsService: AccreditationsService) {}

  @Get()
  @ApiOperation({ summary: 'List accreditations (public)' })
  @ApiResponse({ status: 200, type: [AccreditationResponseDto] })
  findAll() {
    return this.accreditationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an accreditation by id (public)' })
  @ApiResponse({ status: 200, type: AccreditationResponseDto })
  findOne(@Param('id') id: string) {
    return this.accreditationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an accreditation (admin only)' })
  @ApiResponse({ status: 201, type: AccreditationResponseDto })
  create(@Body() dto: CreateAccreditationDto) {
    return this.accreditationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an accreditation (admin only)' })
  @ApiResponse({ status: 200, type: AccreditationResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateAccreditationDto) {
    return this.accreditationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an accreditation (admin only)' })
  @ApiResponse({ status: 200, type: AccreditationResponseDto })
  remove(@Param('id') id: string) {
    return this.accreditationsService.remove(id);
  }
}
