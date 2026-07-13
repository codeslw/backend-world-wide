import { PartialType } from '@nestjs/swagger';
import { CreateUniversityRankingDto } from './create-university-ranking.dto';

export class UpdateUniversityRankingDto extends PartialType(
  CreateUniversityRankingDto,
) {}
