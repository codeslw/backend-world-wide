import { PartialType } from '@nestjs/swagger';
import { CreatePartnerStudentDto } from './create-partner-student.dto';

export class UpdatePartnerStudentDto extends PartialType(CreatePartnerStudentDto) {}
