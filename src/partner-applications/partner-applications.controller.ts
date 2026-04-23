import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { PartnerApplicationsService } from './partner-applications.service';
import { CreatePartnerApplicationDto } from './dto/create-partner-application.dto';
import { UpdatePartnerApplicationDto } from './dto/update-partner-application.dto';
import { UpdatePartnerApplicationStatusDto } from './dto/update-partner-application-status.dto';
import {
  PartnerApplicationResponseDto,
  PaginatedPartnerApplicationResponseDto,
} from './dto/partner-application-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PartnerApplicationStatus } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: Role;
    [key: string]: any;
  };
}

@ApiTags('partner-applications')
@Controller('partner-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class PartnerApplicationsController {
  constructor(
    private readonly partnerApplicationsService: PartnerApplicationsService,
  ) {}

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Create a partner application for a student' })
  @ApiResponse({ status: 201, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePartnerApplicationDto,
  ) {
    return this.partnerApplicationsService.create(req.user.userId, dto);
  }

  @Get('my')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Get all applications submitted by the current partner' })
  @ApiResponse({ status: 200, type: PaginatedPartnerApplicationResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMyApplications(
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const skip = ((page || 1) - 1) * (limit || 50);
    return this.partnerApplicationsService.findAllByPartner(req.user.userId, {
      skip,
      take: limit || 50,
    });
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all partner applications (Admin only)' })
  @ApiResponse({ status: 200, type: PaginatedPartnerApplicationResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PartnerApplicationStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PartnerApplicationStatus,
    @Query('search') search?: string,
  ) {
    const skip = ((page || 1) - 1) * (limit || 50);
    return this.partnerApplicationsService.findAll({
      skip,
      take: limit || 50,
      status,
      search,
    });
  }

  @Get(':id')
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get a partner application by ID' })
  @ApiResponse({ status: 200, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const partnerId =
      req.user.role === Role.PARTNER ? req.user.userId : undefined;
    return this.partnerApplicationsService.findOne(id, partnerId);
  }

  @Patch(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Update a partner application (DRAFT only)' })
  @ApiResponse({ status: 200, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.partnerApplicationsService.update(id, req.user.userId, dto);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update partner application status (Admin only)' })
  @ApiResponse({ status: 200, type: PartnerApplicationResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerApplicationStatusDto,
  ) {
    return this.partnerApplicationsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a partner application (DRAFT/WITHDRAWN only)' })
  @ApiResponse({ status: 204, description: 'Application deleted' })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const partnerId =
      req.user.role === Role.PARTNER ? req.user.userId : undefined;
    return this.partnerApplicationsService.remove(id, partnerId);
  }
}
