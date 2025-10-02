import { PartialType } from '@nestjs/swagger';
import { CreateIntakeDto } from './create-intake.dto';

export class UpdateIntakeDto extends PartialType(CreateIntakeDto) {}
