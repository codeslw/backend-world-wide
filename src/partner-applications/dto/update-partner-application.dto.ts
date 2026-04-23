import { PartialType } from '@nestjs/swagger';
import { CreatePartnerApplicationDto } from './create-partner-application.dto';

export class UpdatePartnerApplicationDto extends PartialType(
  CreatePartnerApplicationDto,
) {}
