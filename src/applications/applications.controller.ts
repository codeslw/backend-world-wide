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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
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
import {
  ApplicationResponseDto,
  PaginatedApplicationResponseDto,
} from './dto/application-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ForbiddenActionException } from '../common/exceptions/app.exceptions';

// Define a custom request interface that includes the user property
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
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
    return this.applicationsService.create(
      req.user.userId,
      createApplicationDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get all applications (Admin only)' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Return all applications (for Admin)',
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
  async findAll(@Req() req: RequestWithUser, @Query() queryDto: PaginationDto) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenActionException(
        'Access denied. Use /applications/my to retrieve your applications.',
      );
    }

    const { page = 1, limit = 10 } = queryDto;
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

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({
    summary: 'Get all applications submitted by the current client',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Return applications submitted by the client.',
    type: [ApplicationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a Client',
    type: ErrorResponseDto,
  })
  async getMyApplications(@Req() req: RequestWithUser) {
    return this.applicationsService.findAllByUserId(req.user.userId);
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

    if (
      req.user.role === Role.CLIENT &&
      application.profileId !== req.user.userId
    ) {

      // Check if profileId on the DTO matches the user ID.
      // The service layer might need adjustment if profile details aren't mapped directly.
      // Let's refine this check based on the actual ApplicationResponseDto structure.
      // Need to confirm `application.profileId` holds the user ID or if we need profile lookup.
      // FOR NOW: Assuming `findOne` returns enough info or handles auth implicitly.
      // Revisit this check if `findOne` doesn't guarantee ownership check for clients.
      // A safer approach might be to pass userId to findOne for client role.
       throw new ForbiddenActionException('You do not have permission to access this application');
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
    return this.applicationsService.update(
      id,
      req.user.userId,
      updateApplicationDto,
      req.user.role === Role.ADMIN,
    );
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
    description: 'Application not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.applicationsService.remove(id, req.user.userId, req.user.role);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update application status (Admin only)' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'The application status has been successfully updated.',
    type: ApplicationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid status',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found',
    type: ErrorResponseDto,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/submit')
  @HttpCode(HttpStatus.OK)
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
    status: 400,
    description:
      'Bad Request - Application already submitted or cannot be submitted',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only the owner can submit',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found',
    type: ErrorResponseDto,
  })
  submit(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.applicationsService.submit(id, req.user.userId);
  }
}
