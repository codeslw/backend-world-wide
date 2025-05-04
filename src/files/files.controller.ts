import { Controller, Delete, Get, Param, Post, Res, UploadedFile, UploadedFiles, UseInterceptors, Query, BadRequestException, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, UseGuards, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FileResponseDto } from './dto/file-response.dto';
import { DownloadFileByUrlDto } from './dto/download-file-by-url.dto';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard.mock';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully', 
    type: FileResponseDto 
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB limit
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
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
    description: 'List of files with pagination metadata', 
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/FileResponseDto' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    }
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

  @Get('download-by-url')
  @ApiOperation({ summary: 'Download file by URL' })
  @ApiQuery({ type: DownloadFileByUrlDto })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., invalid URL)' })
  @ApiResponse({ status: 404, description: 'File not found at URL' })
  async downloadFileByUrl(@Query() query: DownloadFileByUrlDto, @Res() res: Response) {
    return this.filesService.downloadFileByUrl(query.url, res);
  }
  
  @Delete('url')
  @ApiOperation({ summary: 'Delete file by URL' })
  @ApiBody({
    schema: {
      properties: {
        url: { type: 'string', description: 'File URL to delete' }
      },
      required: ['url']
    }
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFileByUrl(@Body('url') url: string) {
    return this.filesService.deleteFileByUrl(url);
  }
}