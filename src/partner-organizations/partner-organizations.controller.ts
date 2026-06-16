import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PartnerOrganizationsService } from './partner-organizations.service';
import { SetPartnerOrgActiveDto } from './dto/set-partner-org-active.dto';
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
  setActive(@Param('id') id: string, @Body() dto: SetPartnerOrgActiveDto) {
    return this.partnerOrgsService.setActive(id, dto.isActive);
  }
}
