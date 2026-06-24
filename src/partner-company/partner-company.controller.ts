import {
  Controller, Get, Patch, Post, Body, Req,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PartnerCompanyService } from './partner-company.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CompanyProfileResponseDto } from './dto/company-profile-response.dto';

@ApiTags('partner-company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partner-company')
export class PartnerCompanyController {
  constructor(
    private readonly partnerCompanyService: PartnerCompanyService,
    private readonly audit: PartnerAuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get company profile' })
  @ApiResponse({ status: 200, type: CompanyProfileResponseDto })
  getProfile(@Req() req) {
    return this.partnerCompanyService.getProfile(req.user.organizationId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update company profile (Owner or Manager only)' })
  @ApiResponse({ status: 200, type: CompanyProfileResponseDto })
  async updateProfile(@Req() req, @Body() dto: UpdateCompanyProfileDto) {
    const result = await this.partnerCompanyService.updateProfile(
      req.user.organizationId,
      req.user.partnerRole,
      dto,
    );
    await this.audit.log({
      action: 'COMPANY_UPDATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
      targetType: 'PartnerOrganization',
      targetId: req.user.organizationId,
      metadata: { fields: Object.keys(dto || {}) },
    });
    return result;
  }

  @Post('logo')
  @ApiOperation({ summary: 'Upload company logo (Owner or Manager only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.partnerCompanyService.uploadLogo(
      req.user.organizationId,
      req.user.partnerRole,
      file,
    );
  }

  @Post('registration-certificate')
  @ApiOperation({ summary: 'Upload company registration certificate (Owner or Manager only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadRegistrationCertificate(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.partnerCompanyService.uploadRegistrationCertificate(
      req.user.organizationId,
      req.user.partnerRole,
      file,
    );
  }
}
