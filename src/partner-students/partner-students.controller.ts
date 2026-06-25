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
  Query,
} from '@nestjs/common';
import { PartnerStudentsService } from './partner-students.service';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { CreatePartnerStudentDto } from './dto/create-partner-student.dto';
import { UpdatePartnerStudentDto } from './dto/update-partner-student.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
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
    private readonly audit: PartnerAuditService,
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

  private studentLabel(student: any): string | undefined {
    if (!student) return undefined;
    const name = [student.firstName, student.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name || student.email || undefined;
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Create a new partner student' })
  @ApiResponse({ status: 201, description: 'Student successfully created' })
  @Post()
  async create(
    @Req() req,
    @Body() createPartnerStudentDto: CreatePartnerStudentDto,
  ) {
    const student = await this.partnerStudentsService.create(
      req.user.userId,
      createPartnerStudentDto,
    );
    await this.audit.log({
      action: 'STUDENT_CREATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'PartnerStudent',
      targetId: student?.id,
      targetLabel: this.studentLabel(student),
    });
    return student;
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by student name, partner, citizenship',
  })
  @Get('all')
  findAll(@Query('search') search?: string) {
    return this.partnerStudentsService.findAll(
      search === 'undefined' || search === '' ? undefined : search,
    );
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
    const student = await this.partnerStudentsService.update(
      id,
      updatePartnerStudentDto,
      partnerIds,
    );
    await this.audit.log({
      action: 'STUDENT_UPDATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'PartnerStudent',
      targetId: id,
      targetLabel: this.studentLabel(student),
    });
    return student;
  }

  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a partner student' })
  @ApiResponse({ status: 200, description: 'Student successfully removed' })
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const partnerIds = await this.visiblePartnerIds(req);
    const existing = await this.partnerStudentsService
      .findOne(id, partnerIds)
      .catch(() => null);
    const result = await this.partnerStudentsService.remove(id, partnerIds);
    await this.audit.log({
      action: 'STUDENT_DELETED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'PartnerStudent',
      targetId: id,
      targetLabel: this.studentLabel(existing),
    });
    return result;
  }
}
