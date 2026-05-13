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
import { CreatePartnerMemberDto } from './dto/create-partner-member.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { PartnerMemberResponseDto } from './dto/partner-member-response.dto';

@ApiTags('partner-members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-members')
export class PartnerMembersController {
  constructor(private readonly partnerMembersService: PartnerMembersService) {}

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
  create(@Req() req, @Body() dto: CreatePartnerMemberDto) {
    return this.partnerMembersService.create(req.user.organizationId, dto);
  }

  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Remove a team member' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.partnerMembersService.remove(req.user.organizationId, id);
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
  setPermissions(@Req() req, @Param('id') id: string, @Body() dto: SetPermissionsDto) {
    return this.partnerMembersService.setPermissions(req.user.organizationId, id, dto);
  }
}
