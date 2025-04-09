import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProfileResponseDto, PaginatedProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Profile created successfully', type: ProfileResponseDto })
  async create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(req.user.userId, createProfileDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all profiles (admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiResponse({ status: 200, description: 'List of profiles', type: PaginatedProfileResponseDto })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.profilesService.findAll(paginationDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile data', type: ProfileResponseDto })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async findMyProfile(@Request() req) {
    return this.profilesService.findByUserId(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get profile by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile data', type: ProfileResponseDto })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: ProfileResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // First, check if the profile belongs to the current user or the user is an admin
    const profile = await this.profilesService.findOne(id);
    
    if (profile.userId !== req.user.userId && req.user.role !== Role.ADMIN) {
      return { statusCode: 403, message: 'Forbidden resource' };
    }
    
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete profile by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
} 