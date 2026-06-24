import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChatDto {
  @ApiPropertyOptional({ description: 'Optional initial message' })
  @IsOptional()
  @IsString()
  initialMessage?: string;

  @ApiPropertyOptional({ description: 'Optional: link chat to a partner application' })
  @IsOptional()
  @IsUUID()
  partnerApplicationId?: string;

  @ApiPropertyOptional({
    description: 'Optional: link chat to a user-submitted application',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}
