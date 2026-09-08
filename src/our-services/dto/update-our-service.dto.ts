import { PartialType } from '@nestjs/swagger';
import { CreateOurServiceDto } from './create-our-service.dto';

export class UpdateOurServiceDto extends PartialType(CreateOurServiceDto) {}
