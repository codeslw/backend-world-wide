import { PartialType } from '@nestjs/swagger';
import { CreateMiniApplicationDto } from './create-mini-application.dto';

export class UpdateMiniApplicationDto extends PartialType(
  CreateMiniApplicationDto,
) {} 