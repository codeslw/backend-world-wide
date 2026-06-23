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
import { TeamMembersService } from './team-members.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamMemberResponseDto } from './dto/team-member-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/roles.enum';

@ApiTags('About - Team Members')
@Controller('about/team-members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Get()
  @ApiOperation({ summary: 'List all team members (public)' })
  @ApiResponse({ status: 200, type: [TeamMemberResponseDto] })
  findAll() {
    return this.teamMembersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team member by id (public)' })
  @ApiResponse({ status: 200, type: TeamMemberResponseDto })
  findOne(@Param('id') id: string) {
    return this.teamMembersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a team member (admin only)' })
  @ApiResponse({ status: 201, type: TeamMemberResponseDto })
  create(@Body() dto: CreateTeamMemberDto) {
    return this.teamMembersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a team member (admin only)' })
  @ApiResponse({ status: 200, type: TeamMemberResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamMembersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a team member (admin only)' })
  @ApiResponse({ status: 200, type: TeamMemberResponseDto })
  remove(@Param('id') id: string) {
    return this.teamMembersService.remove(id);
  }
}
