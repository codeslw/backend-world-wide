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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('partner-students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-students')
export class PartnerStudentsController {
  constructor(private readonly partnerStudentsService: PartnerStudentsService) {}

  @Roles(Role.PARTNER)
  @Post()
  create(@Req() req, @Body() createPartnerStudentDto: CreatePartnerStudentDto) {
    return this.partnerStudentsService.create(req.user.id, createPartnerStudentDto);
  }

  @Roles(Role.PARTNER)
  @Get()
  findAllForPartner(@Req() req) {
    return this.partnerStudentsService.findAllByPartner(req.user.id);
  }

  @Roles(Role.ADMIN)
  @Get('all')
  findAll() {
    return this.partnerStudentsService.findAll();
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    const partnerId = req.user.role === Role.ADMIN ? undefined : req.user.id;
    return this.partnerStudentsService.findOne(id, partnerId);
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updatePartnerStudentDto: UpdatePartnerStudentDto,
  ) {
    const partnerId = req.user.role === Role.ADMIN ? undefined : req.user.id;
    return this.partnerStudentsService.update(id, updatePartnerStudentDto, partnerId);
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    const partnerId = req.user.role === Role.ADMIN ? undefined : req.user.id;
    return this.partnerStudentsService.remove(id, partnerId);
  }
}
