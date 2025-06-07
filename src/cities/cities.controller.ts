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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CityResponseDto,
  PaginatedCityResponseDto,
} from './dto/city-response.dto';
import { CreateManyCitiesDto } from './dto/create-many-cities.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new city (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'City successfully created',
    type: CityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - City with these details already exists',
    type: ErrorResponseDto,
  })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Post('create/many')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create multiple cities at once' })
  @ApiResponse({ status: 201, description: 'Cities successfully created' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - One or more cities already exist',
    type: ErrorResponseDto,
  })
  createMany(@Body() createManyCitiesDto: CreateManyCitiesDto) {
    return this.citiesService.createMany(createManyCitiesDto.cities);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cities with pagination and search' })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cities',
    type: PaginatedCityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
    type: ErrorResponseDto,
  })
  findAll(
    @Headers('Accept-Language') lang: string = 'uz',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('countryCode', new ParseIntPipe({ optional: true }))
    countryCode?: number,
  ) {
    return this.citiesService.findAll(lang, page, limit, countryCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a city by ID' })
  @ApiParam({ name: 'id', description: 'City ID' })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'City details',
    type: CityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @Headers('Accept-Language') lang: string = 'uz',
  ) {
    return this.citiesService.findOne(id, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a city (Admin only)' })
  @ApiParam({ name: 'id', description: 'City ID' })
  @ApiResponse({
    status: 200,
    description: 'City updated',
    type: CityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: ErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(id, updateCityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a city (Admin only)' })
  @ApiParam({ name: 'id', description: 'City ID' })
  @ApiResponse({
    status: 200,
    description: 'City deleted',
    type: CityResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
}
