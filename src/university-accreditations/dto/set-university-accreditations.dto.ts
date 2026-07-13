import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetUniversityAccreditationsDto {
  @ApiProperty({
    description:
      'Full set of accreditation ids attached to this university. This replaces the current set (idempotent).',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  accreditationIds: string[];
}
