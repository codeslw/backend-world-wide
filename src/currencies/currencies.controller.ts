import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { ExchangeRatesResponseDto } from './dto/exchange-rates-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get('rates')
  @ApiOperation({
    summary: 'Get the cached exchange-rate table (public)',
    description:
      'Returns the latest cached conversion rates (base USD). Served from the ' +
      'DB cache; the backend refreshes at most a couple of times a day. The ' +
      'frontend uses this to convert any price to the user-selected currency.',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest cached exchange rates.',
    type: ExchangeRatesResponseDto,
  })
  @ApiResponse({
    status: 503,
    description:
      'Currency converter not configured (missing API key) or rates temporarily unavailable.',
    type: ErrorResponseDto,
  })
  getRates(): Promise<ExchangeRatesResponseDto> {
    return this.currenciesService.getRates();
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Force-refresh exchange rates from the provider (Admin only)',
    description:
      'Immediately re-fetches rates regardless of cache freshness. Counts ' +
      'against the monthly provider quota — use sparingly.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rates refreshed.',
    type: ExchangeRatesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Converter not configured or provider fetch failed.',
    type: ErrorResponseDto,
  })
  refresh(): Promise<ExchangeRatesResponseDto> {
    return this.currenciesService.forceRefresh();
  }
}
