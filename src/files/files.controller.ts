import { Controller, Delete, Get, Param, Post, Res, UploadedFile, UploadedFiles, UseInterceptors, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FileResponseDto } from './dto/file-response.dto';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
  ) {}

  @Post('upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully', 
    type: FileResponseDto 
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.filesService.uploadFile(file);
  }

  @Post('upload/multiple')
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple files (max 10) (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Files to upload (max 10)',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Files uploaded successfully', 
    type: [FileResponseDto] 
  })
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.filesService.uploadMultipleFiles(files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of files', 
    type: [FileResponseDto] 
  })
  async getAllFiles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.filesService.getAllFiles(pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'File details', 
    type: FileResponseDto 
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('id') id: string) {
    return this.filesService.getFile(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.getFile(id);
    return this.filesService.downloadFile(file, res);
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('id') id: string) {
    return this.filesService.deleteFile(id);
  }
}