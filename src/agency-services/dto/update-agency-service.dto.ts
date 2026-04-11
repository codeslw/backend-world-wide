import { PartialType } from '@nestjs/swagger';
import { CreateAgencyServiceDto } from './create-agency-service.dto';

export class UpdateAgencyServiceDto extends PartialType(CreateAgencyServiceDto) {}
