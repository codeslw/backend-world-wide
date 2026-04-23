import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PartnerStudentsService } from './partner-students.service';
import { CreatePartnerStudentDto } from './dto/create-partner-student.dto';
import { UpdatePartnerStudentDto } from './dto/update-partner-student.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('partner-students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-students')
export class PartnerStudentsController {
  constructor(private readonly partnerStudentsService: PartnerStudentsService) {}

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Create a new partner student' })
  @ApiResponse({ status: 201, description: 'Student successfully created' })
  @Post()
  create(@Req() req, @Body() createPartnerStudentDto: CreatePartnerStudentDto) {
    return this.partnerStudentsService.create(req.user.userId, createPartnerStudentDto);
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Get all students for the current partner' })
  @ApiResponse({ status: 200, description: 'List of students' })
  @Get()
  findAllForPartner(@Req() req) {
    return this.partnerStudentsService.findAllByPartner(req.user.userId);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all students (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all partner students' })
  @Get('all')
  findAll() {
    return this.partnerStudentsService.findAll();
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get a partner student by ID' })
  @ApiResponse({ status: 200, description: 'Student details' })
  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    const partnerId = req.user.role === Role.ADMIN ? undefined : req.user.userId;
    return this.partnerStudentsService.findOne(id, partnerId);
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a partner student' })
  @ApiResponse({ status: 200, description: 'Student successfully updated' })
  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updatePartnerStudentDto: UpdatePartnerStudentDto,
  ) {
    const partnerId = req.user.role === Role.ADMIN ? undefined : req.user.userId;
    return this.partnerStudentsService.update(id, updatePartnerStudentDto, partnerId);
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a partner student' })
  @ApiResponse({ status: 200, description: 'Student successfully removed' })
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    const partnerId = req.user.role === Role.ADMIN ? undefined : req.user.userId;
    return this.partnerStudentsService.remove(id, partnerId);
  }
}
