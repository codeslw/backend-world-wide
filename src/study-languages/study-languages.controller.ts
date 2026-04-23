import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudyLanguagesService } from './study-languages.service';
import { CreateStudyLanguageDto } from './dto/create-study-language.dto';
import { UpdateStudyLanguageDto } from './dto/update-study-language.dto';
import { StudyLanguageResponseDto } from './dto/study-language-response.dto';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { Role } from '@prisma/client';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('study-languages')
@Controller('study-languages')
export class StudyLanguagesController {
  constructor(private readonly studyLanguagesService: StudyLanguagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new study language' })
  @ApiResponse({ status: 201, type: StudyLanguageResponseDto })
  create(@Body() createStudyLanguageDto: CreateStudyLanguageDto) {
    return this.studyLanguagesService.create(createStudyLanguageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all study languages' })
  @ApiResponse({ status: 200, type: [StudyLanguageResponseDto] })
  findAll() {
    return this.studyLanguagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a study language by id' })
  @ApiResponse({ status: 200, type: StudyLanguageResponseDto })
  findOne(@Param('id') id: string) {
    return this.studyLanguagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a study language' })
  @ApiResponse({ status: 200, type: StudyLanguageResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateStudyLanguageDto: UpdateStudyLanguageDto,
  ) {
    return this.studyLanguagesService.update(id, updateStudyLanguageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a study language' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.studyLanguagesService.remove(id);
  }
}
