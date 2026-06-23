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
import { FoundersService } from './founders.service';
import { CreateFounderDto } from './dto/create-founder.dto';
import { UpdateFounderDto } from './dto/update-founder.dto';
import { FounderResponseDto } from './dto/founder-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/roles.enum';

@ApiTags('About - Founders')
@Controller('about/founders')
export class FoundersController {
  constructor(private readonly foundersService: FoundersService) {}

  @Get()
  @ApiOperation({ summary: 'List all founders (public)' })
  @ApiResponse({ status: 200, type: [FounderResponseDto] })
  findAll() {
    return this.foundersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a founder by id (public)' })
  @ApiResponse({ status: 200, type: FounderResponseDto })
  findOne(@Param('id') id: string) {
    return this.foundersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a founder (admin only)' })
  @ApiResponse({ status: 201, type: FounderResponseDto })
  create(@Body() dto: CreateFounderDto) {
    return this.foundersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a founder (admin only)' })
  @ApiResponse({ status: 200, type: FounderResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateFounderDto) {
    return this.foundersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a founder (admin only)' })
  @ApiResponse({ status: 200, type: FounderResponseDto })
  remove(@Param('id') id: string) {
    return this.foundersService.remove(id);
  }
}
