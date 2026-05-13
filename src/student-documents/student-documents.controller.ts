import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
  create(@Req() req, @Body() dto: CreateStudentDocumentDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'List documents for a student' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  findByStudent(@Req() req, @Query('studentId') studentId: string) {
    return this.service.findByStudent(req.user.userId, studentId);
  }

  @Delete(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Delete a student document' })
  remove(@Req() req, @Param('id') id: string) {
    return this.service.remove(req.user.userId, id);
  }
}
