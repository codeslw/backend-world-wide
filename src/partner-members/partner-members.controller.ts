import {
  Controller, Get, Post, Delete, Put, Body, Param,
  UseGuards, Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PartnerMembersService } from './partner-members.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { CreatePartnerMemberDto } from './dto/create-partner-member.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { PartnerMemberResponseDto } from './dto/partner-member-response.dto';

@ApiTags('partner-members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-members')
export class PartnerMembersController {
  constructor(
    private readonly partnerMembersService: PartnerMembersService,
    private readonly audit: PartnerAuditService,
  ) {}

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'List all members in the organization' })
  @ApiResponse({ status: 200, type: [PartnerMemberResponseDto] })
  @Get()
  findAll(@Req() req) {
    return this.partnerMembersService.findAll(req.user.organizationId);
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Add a new team member' })
  @ApiResponse({ status: 201, type: PartnerMemberResponseDto })
  @Post()
  async create(@Req() req, @Body() dto: CreatePartnerMemberDto) {
    const member = await this.partnerMembersService.create(
      req.user.organizationId,
      dto,
    );
    await this.audit.log({
      action: 'MEMBER_INVITED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
      targetType: 'PartnerMember',
      targetId: (member as any)?.id,
      targetLabel:
        [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim() ||
        dto.email,
      metadata: { email: dto.email, role: (dto as any).role },
    });
    return member;
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Remove a team member' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const members = await this.partnerMembersService
      .findAll(req.user.organizationId)
      .catch(() => [] as any[]);
    const target = (members as any[]).find((m) => m.id === id);
    const result = await this.partnerMembersService.remove(
      req.user.organizationId,
      id,
    );
    await this.audit.log({
      action: 'MEMBER_REMOVED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
      targetType: 'PartnerMember',
      targetId: id,
      targetLabel:
        [target?.firstName, target?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        target?.email ||
        id,
    });
    return result;
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Get permissions for a member' })
  @Get(':id/permissions')
  getPermissions(@Req() req, @Param('id') id: string) {
    return this.partnerMembersService.getPermissions(req.user.organizationId, id);
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Set permissions for a MEMBER (Owner only)' })
  @Put(':id/permissions')
  async setPermissions(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    const result = await this.partnerMembersService.setPermissions(
      req.user.organizationId,
      id,
      dto,
    );
    await this.audit.log({
      action: 'MEMBER_PERMISSIONS_UPDATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
      targetType: 'PartnerMember',
      targetId: id,
      metadata: { permissions: (dto as any).permissions ?? dto },
    });
    return result;
  }
}
