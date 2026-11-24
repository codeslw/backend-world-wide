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
import { AdmissionRequirementsService } from './admission-requirements.service';
import { CreateAdmissionRequirementDto } from './dto/create-admission-requirement.dto';
import { UpdateAdmissionRequirementDto } from './dto/update-admission-requirement.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('Admission Requirements')
@Controller('admission-requirements')
export class AdmissionRequirementsController {
  constructor(
    private readonly admissionRequirementsService: AdmissionRequirementsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create admission requirement' })
  create(@Body() createDto: CreateAdmissionRequirementDto) {
    return this.admissionRequirementsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admission requirements' })
  findAll(@Query('universityId') universityId?: string) {
    if (universityId) {
      return this.admissionRequirementsService.findByUniversity(universityId);
    }
    return this.admissionRequirementsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admission requirement by ID' })
  findOne(@Param('id') id: string) {
    return this.admissionRequirementsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update admission requirement by ID' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdmissionRequirementDto,
  ) {
    return this.admissionRequirementsService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete admission requirement by ID' })
  remove(@Param('id') id: string) {
    return this.admissionRequirementsService.remove(id);
  }
}
