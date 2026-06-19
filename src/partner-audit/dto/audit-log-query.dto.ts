import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PartnerAuditAction } from '@prisma/client';

/**
 * Query-string clients (axios, fetch) often serialize absent filters as the
 * literal strings "undefined"/"null"/"" instead of omitting them. Coerce those
 * to a real `undefined` so `@IsOptional()` skips validation rather than failing
 * a UUID/enum check.
 */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === 'undefined' || value === 'null' || value === ''
    ? undefined
    : value;

export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: 'Filter by partner organization id' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID('4')
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Filter by actor (partner user) id' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID('4')
  actorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    enum: PartnerAuditAction,
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnerAuditAction)
  action?: PartnerAuditAction;

  @ApiPropertyOptional({
    description: 'Only entries on/after this ISO date',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Only entries on/before this ISO date',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Search actor name or target label',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
