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
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneResponseDto } from './dto/milestone-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/roles.enum';

@ApiTags('About - Milestones')
@Controller('about/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  @ApiOperation({ summary: 'List all milestones (public)' })
  @ApiResponse({ status: 200, type: [MilestoneResponseDto] })
  findAll() {
    return this.milestonesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a milestone by id (public)' })
  @ApiResponse({ status: 200, type: MilestoneResponseDto })
  findOne(@Param('id') id: string) {
    return this.milestonesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a milestone (admin only)' })
  @ApiResponse({ status: 201, type: MilestoneResponseDto })
  create(@Body() dto: CreateMilestoneDto) {
    return this.milestonesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a milestone (admin only)' })
  @ApiResponse({ status: 200, type: MilestoneResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestonesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a milestone (admin only)' })
  @ApiResponse({ status: 200, type: MilestoneResponseDto })
  remove(@Param('id') id: string) {
    return this.milestonesService.remove(id);
  }
}
