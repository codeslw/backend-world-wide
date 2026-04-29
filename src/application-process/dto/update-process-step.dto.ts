import { PartialType } from '@nestjs/swagger';
import { CreateProcessStepDto } from './create-process-step.dto';

export class UpdateProcessStepDto extends PartialType(CreateProcessStepDto) {}
