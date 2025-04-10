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
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
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
import {
  ApplicationResponseDto,
  PaginatedApplicationResponseDto,
} from './dto/application-response.dto';
import { ApplicationStatus } from './enums/application.enum';

@ApiTags('applications')
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Application created successfully',
    type: ApplicationResponseDto,
  })
  create(@Request() req, @Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(req.user.id, createApplicationDto);
  }

  @Get()
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Find all applications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all applications',
    type: PaginatedApplicationResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ApplicationStatus,
    description: 'Filter by application status',
  })
  async findAll(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ApplicationStatus,
  ) {
    // Convert page and limit to numbers and ensure they're valid
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};

    // If CLIENT role, only show their applications
    if (req.user.role === Role.CLIENT) {
      // Get the profile for this user
      const applications = await this.applicationsService.findAllByUserId(
        req.user.id,
      );

      const total = applications.length;
      const data = applications.slice(skip, skip + limitNum);

      return {
        data,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }

    // For ADMIN role, potentially filter by status
    if (status) {
      where.applicationStatus = status;
    }

    // Get paginated results
    const [data, total] = await Promise.all([
      this.applicationsService.findAll({
        skip,
        take: limitNum,
        where,
        orderBy: { createdAt: 'desc' },
        includeProfile: true,
      }),
      this.applicationsService.count(where),
    ]);

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Find application by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the application',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  async findOne(@Request() req, @Param('id') id: string) {
    const application = await this.applicationsService.findOne(id);

    // If CLIENT role, check if application belongs to them
    if (req.user.role === Role.CLIENT) {
      const userApplications = await this.applicationsService.findAllByUserId(
        req.user.id,
      );
      const isOwner = userApplications.some((app) => app.id === id);

      if (!isOwner) {
        return {
          message: 'You do not have permission to view this application',
        };
      }
    }

    return application;
  }

  @Patch(':id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Update application by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application updated successfully',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    // If admin, can update any application
    if (req.user.role === Role.ADMIN) {
      return this.applicationsService.update(
        id,
        req.user.id,
        updateApplicationDto,
      );
    }

    // For clients, check if they own the application
    return this.applicationsService.update(
      id,
      req.user.id,
      updateApplicationDto,
    );
  }

  @Delete(':id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Delete application by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  remove(@Request() req, @Param('id') id: string) {
    // If admin, can delete any application
    if (req.user.role === Role.ADMIN) {
      return this.applicationsService.remove(id, req.user.id);
    }

    // For clients, check if they own the application
    return this.applicationsService.remove(id, req.user.id);
  }

  @Post(':id/submit')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Submit an application' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application submitted successfully',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only draft applications can be submitted',
  })
  submit(@Request() req, @Param('id') id: string) {
    return this.applicationsService.submit(id, req.user.id);
  }
}
