import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PartnerAuditService } from './partner-audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('partner-audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PartnerAuditController {
  constructor(private readonly auditService: PartnerAuditService) {}

  /** Parse an ISO date string, returning undefined for missing/invalid values. */
  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List partner audit logs with filters (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Paginated partner audit logs' })
  @Get('partner-audit-logs')
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.find({
      organizationId: query.organizationId,
      actorId: query.actorId,
      action: query.action,
      from: this.parseDate(query.from),
      to: this.parseDate(query.to),
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List audit logs for a single partner organization (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Paginated partner audit logs' })
  @Get('partner-organizations/:id/audit-logs')
  findForOrganization(
    @Param('id') id: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return this.auditService.find({
      organizationId: id,
      actorId: query.actorId,
      action: query.action,
      from: this.parseDate(query.from),
      to: this.parseDate(query.to),
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }
}
