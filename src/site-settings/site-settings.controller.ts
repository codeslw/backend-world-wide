import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { FilesService } from '../files/files.service';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { SiteSettingResponseDto } from './dto/site-setting-response.dto';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(
    private readonly siteSettingsService: SiteSettingsService,
    private readonly filesService: FilesService,
    private readonly digitalOceanService: DigitalOceanService,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public site settings' })
  @ApiResponse({ status: 200, type: SiteSettingResponseDto })
  async getPublicSettings() {
    return this.siteSettingsService.getPublicSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        appTitle: { type: 'string' },
        logoFile: { type: 'string', format: 'binary' },
        consultingLogoFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logoFile', maxCount: 1 },
      { name: 'consultingLogoFile', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Update application title and brand logos' })
  @ApiResponse({ status: 200, type: SiteSettingResponseDto })
  async updateSettings(
    @Body() dto: UpdateSiteSettingDto,
    @UploadedFiles()
    files?: {
      logoFile?: Express.Multer.File[];
      consultingLogoFile?: Express.Multer.File[];
    },
  ) {
    const logoFile = files?.logoFile?.[0];
    const consultingLogoFile = files?.consultingLogoFile?.[0];

    const logoUrl = await this.uploadLogo(logoFile);
    const consultingLogoUrl = await this.uploadLogo(consultingLogoFile);

    const updated = await this.siteSettingsService.updateSettings({
      ...dto,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(consultingLogoUrl !== undefined ? { consultingLogoUrl } : {}),
    });

    return {
      appTitle: updated.appTitle,
      logoUrl: updated.logoUrl,
      consultingLogoUrl: updated.consultingLogoUrl,
      updatedAt: updated.updatedAt,
    };
  }

  private async uploadLogo(
    file?: Express.Multer.File,
  ): Promise<string | undefined> {
    if (!file) return undefined;

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Logo must be 5MB or smaller');
    }
    // Accept common raster/vector image mimetypes (e.g. image/png,
    // image/jpeg, image/svg+xml, image/webp).
    if (!/(jpe?g|png|svg|webp)/i.test(file.mimetype)) {
      throw new BadRequestException(
        'Logo must be a JPG, PNG, SVG or WEBP image',
      );
    }

    const uploaded = await this.filesService.uploadFile(file);
    return this.digitalOceanService.getPublicUrl(uploaded.storageKey);
  }
}
