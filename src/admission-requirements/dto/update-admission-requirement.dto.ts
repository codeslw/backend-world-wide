import { PartialType } from '@nestjs/swagger';
import { CreateAdmissionRequirementDto } from './create-admission-requirement.dto';

export class UpdateAdmissionRequirementDto extends PartialType(
  CreateAdmissionRequirementDto,
) {}
