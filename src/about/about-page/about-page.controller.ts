import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AboutPageService } from './about-page.service';
import { UpdateAboutPageDto } from './dto/update-about-page.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/roles.enum';

@ApiTags('About - Page Content')
@Controller('about/page')
export class AboutPageController {
  constructor(private readonly aboutPageService: AboutPageService) {}

  @Get()
  @ApiOperation({ summary: 'Get the raw About page content (admin editing)' })
  @ApiResponse({ status: 200 })
  get() {
    return this.aboutPageService.ensure();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the About page content (admin only)' })
  @ApiResponse({ status: 200 })
  update(@Body() dto: UpdateAboutPageDto) {
    return this.aboutPageService.update(dto);
  }
}
