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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationProcessService } from './application-process.service';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { CreateProcessStepDto } from './dto/create-process-step.dto';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import { UpdateProcessStepDto } from './dto/update-process-step.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { CloneTemplateDto } from './dto/clone-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('application-process')
@Controller('application-process')
@ApiBearerAuth('access-token')
export class ApplicationProcessController {
  constructor(
    private readonly applicationProcessService: ApplicationProcessService,
  ) {}

  // ── Templates ─────────────────────────────────────────────────────────────

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a process template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  createTemplate(@Body() dto: CreateProcessTemplateDto) {
    return this.applicationProcessService.createTemplate(dto);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all process templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  findAllTemplates() {
    return this.applicationProcessService.findAllTemplates();
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a process template by ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  findTemplateById(@Param('id') id: string) {
    return this.applicationProcessService.findTemplateById(id);
  }

  @Get('templates/program/:programId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get process template for a specific program (falls back to default)' })
  @ApiResponse({ status: 200, description: 'Template for program' })
  findTemplateForProgram(@Param('programId') programId: string) {
    return this.applicationProcessService.findTemplateForProgram(programId);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a process template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateProcessTemplateDto,
  ) {
    return this.applicationProcessService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a process template (non-default only)' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  deleteTemplate(@Param('id') id: string) {
    return this.applicationProcessService.deleteTemplate(id);
  }

  @Post('templates/:id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Clone a template for a specific program' })
  @ApiResponse({ status: 201, description: 'Template cloned for program' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  cloneTemplate(
    @Param('id') id: string,
    @Body() dto: CloneTemplateDto,
  ) {
    return this.applicationProcessService.cloneTemplateForProgram(id, dto.programId);
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  @Post('steps')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a process step' })
  @ApiResponse({ status: 201, description: 'Step created' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  createStep(@Body() dto: CreateProcessStepDto) {
    return this.applicationProcessService.createStep(dto);
  }

  @Patch('steps/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a process step' })
  @ApiResponse({ status: 200, description: 'Step updated' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  updateStep(
    @Param('id') id: string,
    @Body() dto: UpdateProcessStepDto,
  ) {
    return this.applicationProcessService.updateStep(id, dto);
  }

  @Delete('steps/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a process step' })
  @ApiResponse({ status: 204, description: 'Step deleted' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  deleteStep(@Param('id') id: string) {
    return this.applicationProcessService.deleteStep(id);
  }

  // ── Document Types ────────────────────────────────────────────────────────

  @Post('document-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a document type for a step' })
  @ApiResponse({ status: 201, description: 'Document type created' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  createDocumentType(@Body() dto: CreateDocumentTypeDto) {
    return this.applicationProcessService.createDocumentType(dto);
  }

  @Patch('document-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a document type' })
  @ApiResponse({ status: 200, description: 'Document type updated' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  updateDocumentType(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTypeDto,
  ) {
    return this.applicationProcessService.updateDocumentType(id, dto);
  }

  @Delete('document-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a document type' })
  @ApiResponse({ status: 204, description: 'Document type deleted' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  deleteDocumentType(@Param('id') id: string) {
    return this.applicationProcessService.deleteDocumentType(id);
  }
}
