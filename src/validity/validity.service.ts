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

    if (!university.requirements) {
      return {
        isValid: true,
        details: { message: 'No specific requirements for this university.' },
      };
    }

    const requirements = university.requirements;
    const details: Record<string, string> = {};
    let isValid = true;

    // Check degree requirement
    if (requirements.requiredDegree) {
      const hasRequiredDegree = this.checkDegree(
        profile.educationHistory,
        requirements.requiredDegree,
      );
      if (!hasRequiredDegree) {
        isValid = false;
        details.degree = `Required degree: ${requirements.requiredDegree}, but the user does not have it.`;
      }
    }

    // Check GPA
    if (requirements.minGpa) {
      const hasValidGpa = this.checkGpa(
        profile.educationHistory,
        requirements.minGpa,
      );
      if (!hasValidGpa) {
        isValid = false;
        details.gpa = `Required minimum GPA: ${requirements.minGpa}, but the user's GPA is lower or not specified.`;
      }
    }

    // Check language scores
    this.checkLanguageScore(
      profile.languageCertificates,
      'IELTS',
      requirements.minIeltsScore,
      details,
    );
    this.checkLanguageScore(
      profile.languageCertificates,
      'TOEFL',
      requirements.minToeflScore,
      details,
    );
    this.checkLanguageScore(
      profile.languageCertificates,
      'DUOLINGO',
      requirements.minDuolingoScore,
      details,
    );

    // Check standardized tests
    this.checkStandardizedTestScore(
      profile.standardizedTests,
      'GMAT',
      requirements.minGmatScore,
      details,
    );
    this.checkStandardizedTestScore(
      profile.standardizedTests,
      'CAT',
      requirements.minCatScore,
      details,
    );

    // Check recommendation letters
    if (requirements.requiredRecommendationLetters) {
      const hasEnoughLetters =
        (profile.recommendationLetterGuids?.length || 0) >=
        requirements.requiredRecommendationLetters;
      if (!hasEnoughLetters) {
        isValid = false;
        details.recommendationLetters = `Required recommendation letters: ${
          requirements.requiredRecommendationLetters
        }, but the user has ${profile.recommendationLetterGuids?.length || 0}.`;
      }
    }

    if (Object.keys(details).length > 0) {
      isValid = false;
    }

    return { isValid, details };
  }

  private checkDegree(
    educationHistory: EducationDto[],
    requiredDegree: DegreeType,
  ): boolean {
    const degreeLevels = {
      [DegreeType.HIGH_SCHOOL]: 1,
      [DegreeType.BACHELOR]: 2,
      [DegreeType.MASTER]: 3,
      [DegreeType.PHD]: 4,
    };

    const requiredLevel = degreeLevels[requiredDegree];
    return educationHistory.some(
      (edu) => degreeLevels[edu.degree] >= requiredLevel,
    );
  }

  private checkGpa(educationHistory: EducationDto[], minGpa: number): boolean {
    return educationHistory.some((edu) => (edu.gpa || 0) >= minGpa);
  }

  private checkLanguageScore(
    certificates: LanguageCertificateDto[],
    testType: LanguageTest,
    requiredScore: number | null | undefined,
    details: Record<string, string>,
  ) {
    if (requiredScore === null || requiredScore === undefined) {
      return;
    }

    const certificate = certificates.find((cert) => cert.testType === testType);
    if (!certificate || certificate.score < requiredScore) {
      details[testType.toLowerCase()] =
        `Required ${testType} score: ${requiredScore}, but the user's score is ${
          certificate?.score || 'not available'
        }.`;
    }
  }

  private checkStandardizedTestScore(
    tests: StandardizedTestDto[],
    testType: StandardizedTestType,
    requiredScore: number | null | undefined,
    details: Record<string, string>,
  ) {
    if (requiredScore === null || requiredScore === undefined) {
      return;
    }

    const test = tests.find((t) => t.testType === testType);
    if (!test || test.score < requiredScore) {
      details[testType.toLowerCase()] =
        `Required ${testType} score: ${requiredScore}, but the user's score is ${
          test?.score || 'not available'
        }.`;
    }
  }
}
