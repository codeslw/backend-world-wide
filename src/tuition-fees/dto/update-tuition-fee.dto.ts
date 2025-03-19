import { PartialType } from '@nestjs/swagger';
import { CreateTuitionFeeDto } from './create-tuition-fee.dto';

export class UpdateTuitionFeeDto extends PartialType(CreateTuitionFeeDto) {} 