import { PartialType } from '@nestjs/swagger';
import { CreateRankingOrganizationDto } from './create-ranking-organization.dto';

export class UpdateRankingOrganizationDto extends PartialType(
  CreateRankingOrganizationDto,
) {}
