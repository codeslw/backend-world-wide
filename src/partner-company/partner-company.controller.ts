import {
  Controller, Get, Patch, Post, Body, Req,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PartnerCompanyService } from './partner-company.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CompanyProfileResponseDto } from './dto/company-profile-response.dto';

@ApiTags('partner-company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partner-company')
export class PartnerCompanyController {
  constructor(private readonly partnerCompanyService: PartnerCompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get company profile' })
  @ApiResponse({ status: 200, type: CompanyProfileResponseDto })
  getProfile(@Req() req) {
    return this.partnerCompanyService.getProfile(req.user.organizationId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update company profile (Owner or Manager only)' })
  @ApiResponse({ status: 200, type: CompanyProfileResponseDto })
  updateProfile(@Req() req, @Body() dto: UpdateCompanyProfileDto) {
    return this.partnerCompanyService.updateProfile(
      req.user.organizationId,
      req.user.partnerRole,
      dto,
    );
  }

  @Post('logo')
  @ApiOperation({ summary: 'Upload company logo (Owner or Manager only)' })
  @ApiConsumes('multipart/form-data')
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
  @UseInterceptors(FileInterceptor('file'))
  uploadRegistrationCertificate(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.partnerCompanyService.uploadRegistrationCertificate(
      req.user.organizationId,
      req.user.partnerRole,
      file,
    );
  }
}
