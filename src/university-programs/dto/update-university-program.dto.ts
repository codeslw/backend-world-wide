import { PartialType } from '@nestjs/swagger';
import { CreateUniversityProgramDto } from './create-university-program.dto';

/**
 * Partial update. `campusIds`, `intakeIds` and `admissionRequirement` are
 * replaced wholesale when present and left untouched when absent.
 * Changing `title` does NOT regenerate the slug (slugs are public URLs);
 * pass `slug` explicitly to change it.
 */
export class UpdateUniversityProgramDto extends PartialType(
  CreateUniversityProgramDto,
) {}
