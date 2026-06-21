import {
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PartnerOrganizationsService } from './partner-organizations.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { SetPartnerOrgActiveDto } from './dto/set-partner-org-active.dto';
import { SetMemberPermissionsDto } from './dto/set-member-permissions.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('partner-organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-organizations')
export class PartnerOrganizationsController {
  constructor(
    private readonly partnerOrgsService: PartnerOrganizationsService,
    private readonly audit: PartnerAuditService,
  ) {}

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all partner organizations (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of partner organizations' })
  @Get()
  findAll() {
    return this.partnerOrgsService.findAllForAdmin();
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Get a partner organization with members & permissions (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Partner organization details' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnerOrgsService.findOneForAdmin(id);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Enable or disable a partner organization platform access (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Updated partner organization' })
  @Patch(':id/access')
  async setActive(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: SetPartnerOrgActiveDto,
  ) {
    const org = await this.partnerOrgsService.setActive(id, dto.isActive);
    await this.audit.log({
      action: dto.isActive ? 'ACCESS_ENABLED' : 'ACCESS_DISABLED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: id,
      ipAddress: req.ip,
      targetType: 'PartnerOrganization',
      targetId: id,
      targetLabel: org?.name ?? undefined,
    });
    return org;
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Set a member's permissions (Admin only)",
  })
  @ApiResponse({ status: 200, description: 'Updated member permissions' })
  @Put(':id/members/:memberId/permissions')
  async setMemberPermissions(
    @Req() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: SetMemberPermissionsDto,
  ) {
    const permissions = await this.partnerOrgsService.setMemberPermissions(
      id,
      memberId,
      dto,
    );
    await this.audit.log({
      action: 'MEMBER_PERMISSIONS_UPDATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: id,
      ipAddress: req.ip,
      targetType: 'PartnerMember',
      targetId: memberId,
      metadata: {
        permissions: dto.permissions.map((p) => ({
          action: p.action,
          granted: p.granted,
        })),
      },
    });
    return permissions;
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Change a member's role (Admin only)",
  })
  @ApiResponse({ status: 200, description: 'Updated member' })
  @Patch(':id/members/:memberId/role')
  async updateMemberRole(
    @Req() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const member = await this.partnerOrgsService.updateMemberRole(
      id,
      memberId,
      dto,
    );
    await this.audit.log({
      action: 'MEMBER_PERMISSIONS_UPDATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: id,
      ipAddress: req.ip,
      targetType: 'PartnerMember',
      targetId: memberId,
      metadata: { roleChangedTo: dto.role },
    });
    return member;
  }
}
