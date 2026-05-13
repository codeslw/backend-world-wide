import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { StudentDocumentsService } from './student-documents.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';

@ApiTags('student-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student-documents')
export class StudentDocumentsController {
  constructor(private readonly service: StudentDocumentsService) {}

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Save a document record for a student' })
  @ApiResponse({ status: 201, description: 'Document successfully created' })
  create(@Req() req, @Body() dto: CreateStudentDocumentDto): Promise<any> {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'List documents for a student' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'List of student documents' })
  findByStudent(@Req() req, @Query('studentId') studentId: string): Promise<any[]> {
    return this.service.findByStudent(req.user.userId, studentId);
  }

  @Delete(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Delete a student document' })
  @ApiResponse({ status: 200, description: 'Document successfully deleted' })
  remove(@Req() req, @Param('id') id: string): Promise<any> {
    return this.service.remove(req.user.userId, id);
  }
}
