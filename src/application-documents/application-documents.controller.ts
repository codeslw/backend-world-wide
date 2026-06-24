import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  ApplicationDocumentsService,
  ApplicationRef,
  Requester,
} from './application-documents.service';
import { CreateApplicationDocumentDto } from './dto/create-application-document.dto';
import { UpdateApplicationDocumentStatusDto } from './dto/update-application-document-status.dto';
import { ApplicationDocumentResponseDto } from './dto/application-document-response.dto';
import { ApplicationRequirementsResponseDto } from './dto/application-requirements-response.dto';
import { InvalidDataException } from '../common/exceptions/app.exceptions';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: Role; [key: string]: any };
}

@ApiTags('application-documents')
@Controller('application-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ApplicationDocumentsController {
  constructor(private readonly service: ApplicationDocumentsService) {}

  private requester(req: RequestWithUser): Requester {
    return { userId: req.user.userId, role: req.user.role as Role };
  }

  private refFromQuery(
    partnerApplicationId?: string,
    applicationId?: string,
  ): ApplicationRef {
    if (partnerApplicationId && applicationId) {
      throw new InvalidDataException(
        'Provide exactly one of partnerApplicationId or applicationId',
      );
    }
    if (partnerApplicationId) {
      return { type: 'partner', id: partnerApplicationId };
    }
    if (applicationId) {
      return { type: 'user', id: applicationId };
    }
    throw new InvalidDataException(
      'partnerApplicationId or applicationId is required',
    );
  }

  @Post()
  @Roles(Role.PARTNER, Role.ADMIN, Role.CLIENT)
  @ApiOperation({ summary: 'Attach a document to an application' })
  @ApiResponse({ status: 201, type: ApplicationDocumentResponseDto })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateApplicationDocumentDto,
  ) {
    return this.service.create(this.requester(req), dto);
  }

  @Get()
  @Roles(Role.PARTNER, Role.ADMIN, Role.CLIENT)
  @ApiOperation({ summary: 'List documents for an application' })
  @ApiQuery({ name: 'partnerApplicationId', required: false })
  @ApiQuery({ name: 'applicationId', required: false })
  @ApiResponse({ status: 200, type: [ApplicationDocumentResponseDto] })
  findForApplication(
    @Req() req: RequestWithUser,
    @Query('partnerApplicationId') partnerApplicationId?: string,
    @Query('applicationId') applicationId?: string,
  ) {
    const ref = this.refFromQuery(partnerApplicationId, applicationId);
    return this.service.findForApplication(this.requester(req), ref);
  }

  @Get('requirements')
  @Roles(Role.PARTNER, Role.ADMIN, Role.CLIENT)
  @ApiOperation({
    summary:
      'Resolved requirements checklist for an application (template + uploads)',
  })
  @ApiQuery({ name: 'partnerApplicationId', required: false })
  @ApiQuery({ name: 'applicationId', required: false })
  @ApiResponse({ status: 200, type: ApplicationRequirementsResponseDto })
  getRequirements(
    @Req() req: RequestWithUser,
    @Query('partnerApplicationId') partnerApplicationId?: string,
    @Query('applicationId') applicationId?: string,
  ) {
    const ref = this.refFromQuery(partnerApplicationId, applicationId);
    return this.service.getRequirements(this.requester(req), ref);
  }

  @Patch(':id/status')
  @Roles(Role.PARTNER, Role.ADMIN)
  @ApiOperation({ summary: 'Review (approve/reject) an application document' })
  @ApiResponse({ status: 200, type: ApplicationDocumentResponseDto })
  updateStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDocumentStatusDto,
  ) {
    return this.service.updateStatus(this.requester(req), id, dto);
  }

  @Delete(':id')
  @Roles(Role.PARTNER, Role.ADMIN, Role.CLIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application document' })
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.service.remove(this.requester(req), id);
  }
}
