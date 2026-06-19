import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { StudentDocumentsService } from './student-documents.service';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';

@ApiTags('student-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student-documents')
export class StudentDocumentsController {
  constructor(
    private readonly service: StudentDocumentsService,
    private readonly partnerOrgs: PartnerOrganizationsService,
    private readonly audit: PartnerAuditService,
  ) {}

  /** Visible partner User ids for a partner request; undefined for admins. */
  private async visiblePartnerIds(req): Promise<string[] | undefined> {
    if (req.user.role === Role.ADMIN) return undefined;
    return this.partnerOrgs.resolveVisiblePartnerIds(req.user.userId);
  }

  @Post()
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Save a document record for a student' })
  @ApiResponse({ status: 201, description: 'Document successfully created' })
  async create(
    @Req() req,
    @Body() dto: CreateStudentDocumentDto,
  ): Promise<any> {
    const partnerIds = await this.visiblePartnerIds(req);
    const doc = await this.service.create(partnerIds, dto);
    await this.audit.log({
      action: 'DOCUMENT_UPLOADED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'StudentDocument',
      targetId: (doc as any)?.id,
      targetLabel: (doc as any)?.name ?? (dto as any)?.name,
      metadata: {
        studentId: (dto as any)?.studentId,
        type: (dto as any)?.type,
      },
    });
    return doc;
  }

  @Get()
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'List documents for a student' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'List of student documents' })
  async findByStudent(
    @Req() req,
    @Query('studentId') studentId: string,
  ): Promise<any[]> {
    const partnerIds = await this.visiblePartnerIds(req);
    return this.service.findByStudent(partnerIds, studentId);
  }

  @Delete(':id')
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a student document' })
  @ApiResponse({ status: 200, description: 'Document successfully deleted' })
  async remove(@Req() req, @Param('id') id: string): Promise<any> {
    const partnerIds = await this.visiblePartnerIds(req);
    const result = await this.service.remove(partnerIds, id);
    await this.audit.log({
      action: 'DOCUMENT_DELETED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'StudentDocument',
      targetId: id,
    });
    return result;
  }
}
