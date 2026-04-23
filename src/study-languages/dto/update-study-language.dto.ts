import { PartialType } from '@nestjs/swagger';
import { CreateStudyLanguageDto } from './create-study-language.dto';

export class UpdateStudyLanguageDto extends PartialType(CreateStudyLanguageDto) {}
