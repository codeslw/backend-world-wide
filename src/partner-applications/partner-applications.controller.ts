import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { PartnerApplicationsService } from './partner-applications.service';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { CreatePartnerApplicationDto } from './dto/create-partner-application.dto';
import { UpdatePartnerApplicationDto } from './dto/update-partner-application.dto';
import { UpdatePartnerApplicationStatusDto } from './dto/update-partner-application-status.dto';
import {
  PartnerApplicationResponseDto,
  PaginatedPartnerApplicationResponseDto,
} from './dto/partner-application-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PartnerApplicationStatus } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: Role;
    [key: string]: any;
  };
}

@ApiTags('partner-applications')
@Controller('partner-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class PartnerApplicationsController {
  constructor(
    private readonly partnerApplicationsService: PartnerApplicationsService,
    private readonly partnerOrgs: PartnerOrganizationsService,
    private readonly audit: PartnerAuditService,
  ) {}

  private applicationLabel(app: any): string | undefined {
    if (!app) return undefined;
    const student = app.partnerStudent;
    const studentName = student
      ? [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
      : '';
    return studentName || app.id;
  }

  /** Visible partner User ids for a partner request; undefined for admins. */
  private async visiblePartnerIds(
    req: RequestWithUser,
  ): Promise<string[] | undefined> {
    if (req.user.role !== Role.PARTNER) return undefined;
    return this.partnerOrgs.resolveVisiblePartnerIds(req.user.userId);
  }

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Create a partner application for a student' })
  @ApiResponse({ status: 201, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePartnerApplicationDto,
  ) {
    const app = await this.partnerApplicationsService.create(
      req.user.userId,
      dto,
    );
    await this.audit.log({
      action: 'APPLICATION_CREATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'PartnerApplication',
      targetId: app?.id,
      targetLabel: this.applicationLabel(app),
      metadata: { status: app?.status },
    });
    return app;
  }

  @Get('my')
  @Roles(Role.PARTNER)
  @ApiOperation({
    summary: 'Get all applications submitted by the current partner',
  })
  @ApiResponse({ status: 200, type: PaginatedPartnerApplicationResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  findMyApplications(
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('studentId') studentId?: string,
  ) {
    const skip = ((page || 1) - 1) * (limit || 50);
    return this.partnerApplicationsService.findAllByPartner(req.user.userId, {
      skip,
      take: limit || 50,
      studentId,
    });
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all partner applications (Admin only)' })
  @ApiResponse({ status: 200, type: PaginatedPartnerApplicationResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PartnerApplicationStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PartnerApplicationStatus,
    @Query('search') search?: string,
  ) {
    const skip = ((page || 1) - 1) * (limit || 50);
    return this.partnerApplicationsService.findAll({
      skip,
      take: limit || 50,
      status:
        (status as any) === 'undefined' || status === ('' as any)
          ? undefined
          : status,
      search: search === 'undefined' || search === '' ? undefined : search,
    });
  }

  @Get(':id')
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get a partner application by ID' })
  @ApiResponse({ status: 200, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const partnerIds = await this.visiblePartnerIds(req);
    return this.partnerApplicationsService.findOne(id, partnerIds);
  }

  @Patch(':id')
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({
    summary: 'Update a partner application (partner: DRAFT only; admin: any)',
  })
  @ApiResponse({ status: 200, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role === Role.ADMIN) {
      return this.partnerApplicationsService.adminUpdate(id, dto);
    }
    const partnerIds = await this.visiblePartnerIds(req);
    return this.partnerApplicationsService.update(id, partnerIds!, dto);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update partner application status (Admin only)' })
  @ApiResponse({ status: 200, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerApplicationStatusDto,
    @Req() req: RequestWithUser,
  ) {
    const before = await this.partnerApplicationsService
      .findOne(id)
      .catch(() => null);
    const updated = await this.partnerApplicationsService.updateStatus(id, dto);
    await this.audit.log({
      action: 'APPLICATION_STATUS_CHANGED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'PartnerApplication',
      targetId: id,
      targetLabel: this.applicationLabel(updated ?? before),
      metadata: {
        from: (before as any)?.status,
        to: dto.status,
        ...(dto.reason && { reason: dto.reason }),
      },
    });
    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({
    summary: 'Delete a partner application (DRAFT/WITHDRAWN only)',
  })
  @ApiResponse({ status: 204, description: 'Application deleted' })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const partnerIds = await this.visiblePartnerIds(req);
    const before = await this.partnerApplicationsService
      .findOne(id, partnerIds)
      .catch(() => null);
    const result = await this.partnerApplicationsService.remove(id, partnerIds);
    await this.audit.log({
      action: 'APPLICATION_DELETED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
      targetType: 'PartnerApplication',
      targetId: id,
      targetLabel: this.applicationLabel(before),
      metadata: { status: (before as any)?.status },
    });
    return result;
  }
}
