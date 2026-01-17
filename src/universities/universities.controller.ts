import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  UniversityResponseDto,
  PaginatedUniversityResponseDto,
} from './dto/university-response.dto';
import { PaginatedUniversityListItemResponseDto } from './dto/university-list-item.dto';
import { UniversityFilterDto } from './dto/university-filter.dto';
import { CreateManyUniversitiesDto } from './dto/create-many-universities.dto';
import { UniversitiesByProgramsFilterDto } from './dto/universities-by-programs-filter.dto';
import {
  PaginatedUniversityByProgramResponseDto,
  ProgramDetailsDto,
} from './dto/university-by-program-response.dto';
import { MainUniversityResponseDto } from './dto/main-university-response.dto';
import { ApiProgramsByUniversity } from './decorators/programs-by-university.swagger';
import { ApiUpdateUniversityPatch } from './decorators/update-university-patch.swagger';
import { ApiCreateUniversity } from './decorators/create-university.swagger';
import { ApiCreateManyUniversity } from './decorators/create-many-university.swagger';
import { ApiMainUniversity } from './decorators/main-university.swagger';
import { ApiUniversitiesByPrograms } from './decorators/universities-by-programs.swagger';
import { ApiUniversities } from './decorators/universities.swagger';
import { ApiUniversityById } from './decorators/university-by-id.swagger';
import { ApiDeleteUniversity } from './decorators/delete-university.swagger';
import { ApiDeleteProgram } from './decorators/delete-program.swagger';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) { }

  //POST /universities
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCreateUniversity()
  async create(
    @Body() createUniversityDto: CreateUniversityDto,
  ): Promise<UniversityResponseDto> {
    return this.universitiesService.create(createUniversityDto);
  }

  //POST /universities/create/many
  @Post('create/many')
  @ApiCreateManyUniversity()
  async createMany(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createManyDto: CreateManyUniversitiesDto,
  ): Promise<UniversityResponseDto[]> {
    return this.universitiesService.createMany(createManyDto.universities);
  }

  //GET /universities/main
  @Get('main')
  @ApiMainUniversity()
  async findMainUniversities(
    @Headers('Accept-Language') lang: string = 'uz',
  ): Promise<MainUniversityResponseDto[]> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findMainUniversities(effectiveLang);
  }

  //GET /universities/universities-by-programs
  @Get('universities-by-programs')
  @ApiUniversitiesByPrograms()
  async findUniversitiesByPrograms(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() filterDto: UniversitiesByProgramsFilterDto,
  ): Promise<PaginatedUniversityByProgramResponseDto> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findUniversitiesByPrograms(
      filterDto,
      effectiveLang,
    );
  }

  //GET /universities/programs-by-university/:universityId
  @Get('programs-by-university/:universityId')
  @ApiProgramsByUniversity()
  async findProgramsByUniversity(
    @Headers('Accept-Language') lang: string = 'uz',
    @Param('universityId') universityId: string,
  ): Promise<ProgramDetailsDto[]> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findProgramsByUniversity(
      universityId,
      effectiveLang,
    );
  }

  //GET /universities
  @Get()
  @ApiUniversities()
  async findAll(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query() filterDto: UniversityFilterDto,
  ): Promise<PaginatedUniversityListItemResponseDto> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findAll(filterDto, effectiveLang);
  }

  //GET /universities/:id
  @Get(':id')
  @ApiUniversityById()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ): Promise<UniversityResponseDto> {
    const validLangs = ['uz', 'ru', 'en'];
    const effectiveLang = validLangs.includes(lang) ? lang : 'uz';
    return this.universitiesService.findOne(id, effectiveLang);
  }

  //PATCH /universities/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiUpdateUniversityPatch()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUniversityDto: UpdateUniversityDto,
  ): Promise<UniversityResponseDto> {
    return this.universitiesService.update(id, updateUniversityDto);
  }

  //DELETE /universities/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteUniversity()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.universitiesService.remove(id);
  }

  //DELETE /universities/:id/programs/:programId
  @Delete(':id/programs/:programId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteProgram()
  async removeProgram(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('programId', ParseUUIDPipe) programId: string,
  ): Promise<void> {
    await this.universitiesService.removeUniversityProgram(id, programId);
  }
}
