import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateResponseDto } from './dto/certificate-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/roles.enum';

@ApiTags('About - Certificates')
@Controller('about/certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  @ApiOperation({ summary: 'List certificates (public)' })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter to only featured (true) or non-featured (false)',
  })
  @ApiResponse({ status: 200, type: [CertificateResponseDto] })
  findAll(@Query('featured') featured?: string) {
    const featuredFilter =
      featured === undefined ? undefined : featured === 'true';
    return this.certificatesService.findAll(featuredFilter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a certificate by id (public)' })
  @ApiResponse({ status: 200, type: CertificateResponseDto })
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a certificate (admin only)' })
  @ApiResponse({ status: 201, type: CertificateResponseDto })
  create(@Body() dto: CreateCertificateDto) {
    return this.certificatesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a certificate (admin only)' })
  @ApiResponse({ status: 200, type: CertificateResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) {
    return this.certificatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a certificate (admin only)' })
  @ApiResponse({ status: 200, type: CertificateResponseDto })
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }
}
