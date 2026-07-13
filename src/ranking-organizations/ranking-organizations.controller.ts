import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RankingOrganizationsService } from './ranking-organizations.service';
import { CreateRankingOrganizationDto } from './dto/create-ranking-organization.dto';
import { UpdateRankingOrganizationDto } from './dto/update-ranking-organization.dto';
import { RankingOrganizationResponseDto } from './dto/ranking-organization-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('Ranking Organizations')
@Controller('ranking-organizations')
export class RankingOrganizationsController {
  constructor(
    private readonly rankingOrganizationsService: RankingOrganizationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List ranking organizations (public)' })
  @ApiResponse({ status: 200, type: [RankingOrganizationResponseDto] })
  findAll() {
    return this.rankingOrganizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ranking organization by id (public)' })
  @ApiResponse({ status: 200, type: RankingOrganizationResponseDto })
  findOne(@Param('id') id: string) {
    return this.rankingOrganizationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a ranking organization (admin only)' })
  @ApiResponse({ status: 201, type: RankingOrganizationResponseDto })
  create(@Body() dto: CreateRankingOrganizationDto) {
    return this.rankingOrganizationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a ranking organization (admin only)' })
  @ApiResponse({ status: 200, type: RankingOrganizationResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRankingOrganizationDto,
  ) {
    return this.rankingOrganizationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a ranking organization (admin only)' })
  @ApiResponse({ status: 200, type: RankingOrganizationResponseDto })
  remove(@Param('id') id: string) {
    return this.rankingOrganizationsService.remove(id);
  }
}
