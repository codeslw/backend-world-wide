import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { UniversitiesService } from '../universities/universities.service';
import { DegreeType, LanguageTest, StandardizedTestType } from '@prisma/client';
import { ValidityCheckResponseDto } from './dto/validity-check-response.dto';
import { EducationDto } from '../profiles/dto/education.dto';
import { LanguageCertificateDto } from '../profiles/dto/language-certificate.dto';
import { StandardizedTestDto } from '../profiles/dto/standardized-test.dto';

@Injectable()
export class ValidityService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly universitiesService: UniversitiesService,
  ) {}

  async check(
    userId: string,
    universityId: string,
  ): Promise<ValidityCheckResponseDto> {
    const profile = await this.profilesService.findByUserId(userId);
    const university = await this.universitiesService.findOne(universityId);

    // General admission requirements have been removed.
    // Program-level requirements should be checked separately based on the specific program.
    return {
      isValid: true,
      details: {
        message: 'General admission requirements are no longer applicable.',
      },
    };
  }
}
