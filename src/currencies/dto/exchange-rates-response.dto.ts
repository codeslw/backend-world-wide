import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRatesResponseDto {
  @ApiProperty({
    description: 'Base currency of the rate table.',
    example: 'USD',
  })
  base: string;

  @ApiProperty({
    description:
      'Conversion rates keyed by ISO currency code, relative to the base. ' +
      'e.g. { "USD": 1, "EUR": 0.92, "UZS": 12650, "GBP": 0.79, "RUB": 90 }. ' +
      'Convert between any two currencies via the base: ' +
      'amountInTarget = amountInSource / rates[source] * rates[target].',
    example: { USD: 1, EUR: 0.92, GBP: 0.79, UZS: 12650, RUB: 90 },
    additionalProperties: { type: 'number' },
  })
  rates: Record<string, number>;

  @ApiProperty({
    description: 'When these rates were last fetched from the provider (ISO 8601).',
    example: '2026-07-03T00:00:01.000Z',
  })
  fetchedAt: string;

  @ApiProperty({
    description:
      'When the provider will next publish updated rates (ISO 8601). Clients can ' +
      'use this to decide when to re-fetch; the backend also uses it to avoid over-fetching.',
    example: '2026-07-04T00:00:01.000Z',
  })
  nextUpdateAt: string;
}
