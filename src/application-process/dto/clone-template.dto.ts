import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CloneTemplateDto {
  @ApiProperty({ description: 'The program ID to clone the template for' })
  @IsUUID()
  programId: string;
}
