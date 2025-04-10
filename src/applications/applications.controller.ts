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
import { Request } from 'express';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApplicationResponseDto, PaginatedApplicationResponseDto } from './dto/application-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ForbiddenActionException } from '../common/exceptions/app.exceptions';

// Define a custom request interface that includes the user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    role: Role;
    [key: string]: any;
  };
}

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create a new application' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 201,
    description: 'The application has been successfully created.',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
    type: ErrorResponseDto,
  })
  create(
    @Req() req: RequestWithUser,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(req.user.id, createApplicationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get all applications' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Return all applications',
    type: PaginatedApplicationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDir', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Req() req: RequestWithUser,
    @Query() queryDto: PaginationDto,
  ) {
    // If user is CLIENT, only return their applications
    if (req.user.role === Role.CLIENT) {
      return this.applicationsService.findAllByUserId(req.user.id);
    }

    // For other roles or if no role, get all applications with pagination
    const {
      page = 1,
      limit = 10,
    } = queryDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const [applications, total] = await Promise.all([
      this.applicationsService.findAll({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        includeProfile: true,
      }),
      this.applicationsService.count(),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get application by id' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Return the application',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const application = await this.applicationsService.findOne(id);

    // If user is CLIENT, ensure they can only access their own applications
    if (
      req.user.role === Role.CLIENT &&
      application.profile.userId !== req.user.id
    ) {
      throw new ForbiddenActionException(
        'You do not have permission to access this application',
      );
    }

    return application;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Update an application' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'The application has been successfully updated.',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application or Profile not found',
    type: ErrorResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    // Check if admin is trying to update status or assigned to
    if (req.user.role === Role.ADMIN) {
      // Extract only the fields that an admin can update
      const adminUpdates = {};
      const allowedFields = [
        'applicationStatus',
        'assignedTo',
        'adminNotes',
        'reviewedAt',
      ];
      
      for (const field of allowedFields) {
        if (updateApplicationDto[field] !== undefined) {
          adminUpdates[field] = updateApplicationDto[field];
        }
      }
      
      // If there are admin updates, apply them
      if (Object.keys(adminUpdates).length > 0) {
        return this.applicationsService.update(id, req.user.id, adminUpdates);
      }
    }

    // For all other users, use their user ID to verify ownership
    return this.applicationsService.update(id, req.user.id, updateApplicationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Delete an application' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 204,
    description: 'The application has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application or Profile not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.applicationsService.remove(id, req.user.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Submit an application' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'The application has been successfully submitted.',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application or Profile not found',
    type: ErrorResponseDto,
  })
  submit(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.applicationsService.submit(id, req.user.id);
  }
}
