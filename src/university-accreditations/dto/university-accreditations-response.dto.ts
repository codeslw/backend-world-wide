import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccreditationResponseDto } from '../../accreditations/dto/accreditation-response.dto';
import { RankingOrganizationResponseDto } from '../../ranking-organizations/dto/ranking-organization-response.dto';

export class UniversityAccreditationItemDto {
  @ApiProperty({ description: 'Join row id' })
  id: string;

  @ApiProperty()
  accreditationId: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: AccreditationResponseDto })
  accreditation: AccreditationResponseDto;
}

export class UniversityRankingItemDto {
  @ApiProperty({ description: 'Ranking row id' })
  id: string;

  @ApiProperty()
  rankingOrganizationId: string;

  @ApiProperty()
  rank: number;

  @ApiPropertyOptional()
  score?: number | null;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  year?: number | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: RankingOrganizationResponseDto })
  organization: RankingOrganizationResponseDto;
}

export class UniversityAccreditationsResponseDto {
  @ApiProperty({ type: [UniversityAccreditationItemDto] })
  accreditations: UniversityAccreditationItemDto[];

  @ApiProperty({ type: [UniversityRankingItemDto] })
  rankings: UniversityRankingItemDto[];
}
