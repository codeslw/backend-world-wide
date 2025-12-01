import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpStatus,
} from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { ScholarshipProgramFilterDto } from './dto/scholarship-program-filter.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ScholarshipResponseDto } from './dto/scholarship-response.dto';

@ApiTags('Scholarships')
@Controller('scholarships')
export class ScholarshipsController {
    constructor(private readonly scholarshipsService: ScholarshipsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new scholarship (Admin only)' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Scholarship successfully created',
        type: ScholarshipResponseDto,
    })
    create(@Body() createScholarshipDto: CreateScholarshipDto) {
        return this.scholarshipsService.create(createScholarshipDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all scholarships' })
    findAll() {
        return this.scholarshipsService.findAll();
    }

    @Get('programs')
    @ApiOperation({ summary: 'Get university programs that have scholarships' })
    @ApiQuery({ type: ScholarshipProgramFilterDto })
    findProgramsWithScholarships(
        @Query() filterDto: ScholarshipProgramFilterDto,
    ) {
        return this.scholarshipsService.findProgramsWithScholarships(filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a scholarship by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.scholarshipsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a scholarship (Admin only)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateScholarshipDto: UpdateScholarshipDto,
    ) {
        return this.scholarshipsService.update(id, updateScholarshipDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a scholarship (Admin only)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.scholarshipsService.remove(id);
    }
}
