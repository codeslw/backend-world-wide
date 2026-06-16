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
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { CreatePartnerStudentDto } from './dto/create-partner-student.dto';
import { UpdatePartnerStudentDto } from './dto/update-partner-student.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('partner-students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-students')
export class PartnerStudentsController {
  constructor(
    private readonly partnerStudentsService: PartnerStudentsService,
    private readonly partnerOrgs: PartnerOrganizationsService,
  ) {}

  /**
   * For a partner request, the set of partner User ids whose students this user
   * may act on (org-wide subject to VIEW_STUDENTS). Admins get `undefined`
   * (unrestricted).
   */
  private async visiblePartnerIds(req): Promise<string[] | undefined> {
    if (req.user.role === Role.ADMIN) return undefined;
    return this.partnerOrgs.resolveVisiblePartnerIds(req.user.userId);
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Create a new partner student' })
  @ApiResponse({ status: 201, description: 'Student successfully created' })
  @Post()
  create(@Req() req, @Body() createPartnerStudentDto: CreatePartnerStudentDto) {
    return this.partnerStudentsService.create(
      req.user.userId,
      createPartnerStudentDto,
    );
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
  async findOne(@Req() req, @Param('id') id: string) {
    const partnerIds = await this.visiblePartnerIds(req);
    return this.partnerStudentsService.findOne(id, partnerIds);
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a partner student' })
  @ApiResponse({ status: 200, description: 'Student successfully updated' })
  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updatePartnerStudentDto: UpdatePartnerStudentDto,
  ) {
    const partnerIds = await this.visiblePartnerIds(req);
    return this.partnerStudentsService.update(
      id,
      updatePartnerStudentDto,
      partnerIds,
    );
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a partner student' })
  @ApiResponse({ status: 200, description: 'Student successfully removed' })
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const partnerIds = await this.visiblePartnerIds(req);
    return this.partnerStudentsService.remove(id, partnerIds);
  }
}
