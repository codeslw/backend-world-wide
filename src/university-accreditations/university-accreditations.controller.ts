import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UniversityAccreditationsService } from './university-accreditations.service';
import { SetUniversityAccreditationsDto } from './dto/set-university-accreditations.dto';
import { CreateUniversityRankingDto } from './dto/create-university-ranking.dto';
import { UpdateUniversityRankingDto } from './dto/update-university-ranking.dto';
import {
  UniversityAccreditationsResponseDto,
  UniversityRankingItemDto,
} from './dto/university-accreditations-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiTags('University Accreditations & Rankings')
@Controller('universities/:universityId')
export class UniversityAccreditationsController {
  constructor(
    private readonly service: UniversityAccreditationsService,
  ) {}

  @Get('accreditations')
  @ApiOperation({
    summary:
      'Get a university accreditations and rankings by organization (public)',
  })
  @ApiResponse({ status: 200, type: UniversityAccreditationsResponseDto })
  getForUniversity(@Param('universityId') universityId: string) {
    return this.service.getForUniversity(universityId);
  }

  @Put('accreditations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Replace the full set of accreditations attached to a university (admin only)',
  })
  @ApiResponse({ status: 200, type: UniversityAccreditationsResponseDto })
  setAccreditations(
    @Param('universityId') universityId: string,
    @Body() dto: SetUniversityAccreditationsDto,
  ) {
    return this.service.setAccreditations(universityId, dto);
  }

  @Post('rankings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Add a ranking for a university from an organization (admin only)',
  })
  @ApiResponse({ status: 201, type: UniversityRankingItemDto })
  createRanking(
    @Param('universityId') universityId: string,
    @Body() dto: CreateUniversityRankingDto,
  ) {
    return this.service.createRanking(universityId, dto);
  }

  @Patch('rankings/:rankingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a university ranking (admin only)' })
  @ApiResponse({ status: 200, type: UniversityRankingItemDto })
  updateRanking(
    @Param('universityId') universityId: string,
    @Param('rankingId') rankingId: string,
    @Body() dto: UpdateUniversityRankingDto,
  ) {
    return this.service.updateRanking(universityId, rankingId, dto);
  }

  @Delete('rankings/:rankingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a university ranking (admin only)' })
  @ApiResponse({ status: 200, type: UniversityRankingItemDto })
  removeRanking(
    @Param('universityId') universityId: string,
    @Param('rankingId') rankingId: string,
  ) {
    return this.service.removeRanking(universityId, rankingId);
  }
}
