import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
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
      },
    },
  })
  @UseInterceptors(FileInterceptor('logoFile'))
  @ApiOperation({ summary: 'Update application title and logo' })
  @ApiResponse({ status: 200, type: SiteSettingResponseDto })
  async updateSettings(
    @Body() dto: UpdateSiteSettingDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|svg|webp)$/i }),
        ],
      }),
    )
    logoFile?: Express.Multer.File,
  ) {
    let logoUrl = undefined;
    if (logoFile) {
      const uploaded = await this.filesService.uploadFile(logoFile);
      logoUrl = this.digitalOceanService.getPublicUrl(uploaded.storageKey);
    }

    const updated = await this.siteSettingsService.updateSettings({
      ...dto,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
    });

    return {
      appTitle: updated.appTitle,
      logoUrl: updated.logoUrl,
      updatedAt: updated.updatedAt,
    };
  }
}
