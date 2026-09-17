import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DegreeType } from '@prisma/client';
import { ProgramAdmissionRequirementDto } from './program-admission-requirement.dto';

async function errorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(ProgramAdmissionRequirementDto, payload);
  return validate(dto);
}

describe('ProgramAdmissionRequirementDto minEducationLevelNote', () => {
  it('accepts a custom note with OTHER', async () => {
    const errors = await errorsFor({
      minEducationLevel: DegreeType.OTHER,
      minEducationLevelNote: 'Foundation diploma in Art & Design',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects OTHER without a note', async () => {
    const errors = await errorsFor({ minEducationLevel: DegreeType.OTHER });
    expect(errors.some((e) => e.property === 'minEducationLevelNote')).toBe(
      true,
    );
  });

  it('rejects OTHER with a blank note', async () => {
    const errors = await errorsFor({
      minEducationLevel: DegreeType.OTHER,
      minEducationLevelNote: '   ',
    });
    expect(errors.some((e) => e.property === 'minEducationLevelNote')).toBe(
      true,
    );
  });

  it('does not require a note for standard levels', async () => {
    const errors = await errorsFor({
      minEducationLevel: DegreeType.BACHELOR,
    });
    expect(errors).toHaveLength(0);
  });

  it('still rejects an unknown level', async () => {
    const errors = await errorsFor({ minEducationLevel: 'NO_SUCH_LEVEL' });
    expect(errors.some((e) => e.property === 'minEducationLevel')).toBe(true);
  });
});
