import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TariffDto } from './create-agency-service.dto';

export class AgencyServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: TariffDto })
  basic?: TariffDto;

  @ApiPropertyOptional({ type: TariffDto })
  standard?: TariffDto;

  @ApiPropertyOptional({ type: TariffDto })
  premium?: TariffDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
