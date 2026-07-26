import { Injectable } from '@nestjs/common';
import {
  Campus,
  City,
  Country,
  Department,
  Faculty,
  Intake,
  ProgramAdmissionRequirement,
  ProgramDocumentRequirement,
  ProgramLanguageTestRequirement,
  ProgramStandardizedTestRequirement,
  Scholarship,
  StudyLanguage,
  University,
  UniversityProgram,
} from '@prisma/client';
import {
  ProgramAdditionalExpenseDto,
  ProgramAdmissionRequirementResponseDto,
  ProgramCampusDto,
  ProgramCityDto,
  ProgramCountryDto,
  ProgramDepartmentDto,
  ProgramDocumentRequirementResponseDto,
  ProgramFacultyDto,
  ProgramIntakeDto,
  ProgramLanguageTestRequirementResponseDto,
  ProgramScholarshipDto,
  ProgramStandardizedTestRequirementResponseDto,
  ProgramStudyLanguageDto,
  ProgramUniversityBriefDto,
  ProgramUniversityDetailDto,
  UniversityProgramDetailDto,
  UniversityProgramListItemDto,
} from './dto/university-program-response.dto';

const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const;
const DEFAULT_LANGUAGE = 'uz';

type UniversityBrief = Pick<
  University,
  'id' | 'name' | 'logoUrl' | 'photoUrl' | 'ranking'
> & {
  city?: City | null;
  country?: Country | null;
};

export type UniversityProgramListRow = UniversityProgram & {
  university: UniversityBrief;
  faculty?: Faculty | null;
  department?: Department | null;
  studyLanguage?: StudyLanguage | null;
  intakes?: { intake: Intake }[];
  scholarships?: { id: string }[];
};

export type UniversityProgramDetailRow = UniversityProgram & {
  university: University & { city?: City | null; country?: Country | null };
  faculty?: Faculty | null;
  department?: Department | null;
  studyLanguage?: StudyLanguage | null;
  intakes?: { intake: Intake }[];
  campuses?: Campus[];
  scholarships?: Scholarship[];
  admissionRequirement?:
    | (ProgramAdmissionRequirement & {
        languageTests?: ProgramLanguageTestRequirement[];
        standardizedTests?: ProgramStandardizedTestRequirement[];
        documents?: ProgramDocumentRequirement[];
      })
    | null;
};

@Injectable()
export class UniversityProgramsMapper {
  /** Normalises the raw `accept-language` header to a supported locale. */
  resolveLang(lang?: string): string {
    const normalized = (lang || '').split(',')[0]?.trim().toLowerCase();
    return SUPPORTED_LANGUAGES.includes(normalized as any)
      ? normalized
      : DEFAULT_LANGUAGE;
  }

  toListItemDto(
    program: UniversityProgramListRow,
    lang: string = DEFAULT_LANGUAGE,
  ): UniversityProgramListItemDto {
    const suffix = this.getLangSuffix(this.resolveLang(lang));

    return {
      id: program.id,
      universityId: program.universityId,
      title: program.title,
      slug: program.slug,
      facultyId: program.facultyId,
      departmentId: program.departmentId,

      tuitionFee: program.tuitionFee,
      tuitionFeeType: program.tuitionFeeType,
      tuitionFeeCurrency: program.tuitionFeeCurrency,
      scholarshipAppliedTutionFee: program.scholarshipAppliedTutionFee,

      studyLevel: program.studyLevel,
      studyMode: program.studyMode,
      duration: program.duration,
      credits: program.credits,

      applicationFee: program.applicationFee,
      applicationFeeCurrency: program.applicationFeeCurrency,
      isApplicationFeeRefundable: program.isApplicationFeeRefundable,

      description: this.getLocalizedField(program, 'description', suffix),
      descriptionEn: program.descriptionEn,
      descriptionRu: program.descriptionRu,
      descriptionUz: program.descriptionUz,

      isActive: program.isActive,
      isFeatured: program.isFeatured,
      hasScholarship: (program.scholarships?.length ?? 0) > 0,

      studyLanguageId: program.studyLanguageId,
      studyLanguage: this.toStudyLanguageDto(program.studyLanguage, suffix),
      faculty: this.toFacultyDto(program.faculty, suffix),
      department: this.toDepartmentDto(program.department, suffix),
      university: this.toUniversityBriefDto(program.university, suffix),
      intakes: this.toIntakeDtos(program.intakes),

      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  }

  toDetailDto(
    program: UniversityProgramDetailRow,
    lang: string = DEFAULT_LANGUAGE,
  ): UniversityProgramDetailDto {
    const suffix = this.getLangSuffix(this.resolveLang(lang));
    const base = this.toListItemDto(
      program as unknown as UniversityProgramListRow,
      lang,
    );

    return {
      ...base,
      hasScholarship: (program.scholarships?.length ?? 0) > 0,

      careerOutcomes: this.getLocalizedField(program, 'careerOutcomes', suffix),
      careerOutcomesEn: program.careerOutcomesEn,
      careerOutcomesRu: program.careerOutcomesRu,
      careerOutcomesUz: program.careerOutcomesUz,

      curriculum: this.getLocalizedField(program, 'curriculum', suffix),
      curriculumEn: program.curriculumEn,
      curriculumRu: program.curriculumRu,
      curriculumUz: program.curriculumUz,

      additionalExpenses: this.toAdditionalExpenses(program.additionalExpenses),

      university: this.toUniversityDetailDto(program.university, suffix),
      campuses: this.toCampusDtos(program.campuses),
      scholarships: this.toScholarshipDtos(program.scholarships),
      admissionRequirement: this.toAdmissionRequirementDto(
        program.admissionRequirement,
        suffix,
      ),
    };
  }

  // -------------------------------------------------------------------------
  // Nested shapes
  // -------------------------------------------------------------------------

  toFacultyDto(faculty: Faculty | null, suffix: string): ProgramFacultyDto {
    if (!faculty) return undefined;
    return {
      id: faculty.id,
      slug: faculty.slug,
      name: this.getLocalizedField(faculty, 'name', suffix),
      nameEn: faculty.nameEn,
      nameRu: faculty.nameRu,
      nameUz: faculty.nameUz,
      iconKey: faculty.iconKey,
    };
  }

  toDepartmentDto(
    department: Department | null,
    suffix: string,
  ): ProgramDepartmentDto {
    if (!department) return undefined;
    return {
      id: department.id,
      slug: department.slug,
      facultyId: department.facultyId,
      name: this.getLocalizedField(department, 'name', suffix),
      nameEn: department.nameEn,
      nameRu: department.nameRu,
      nameUz: department.nameUz,
    };
  }

  private toStudyLanguageDto(
    studyLanguage: StudyLanguage | null,
    suffix: string,
  ): ProgramStudyLanguageDto {
    if (!studyLanguage) return undefined;
    return {
      id: studyLanguage.id,
      name: this.getLocalizedField(studyLanguage, 'name', suffix),
      nameEn: studyLanguage.nameEn,
      nameRu: studyLanguage.nameRu,
      nameUz: studyLanguage.nameUz,
    };
  }

  private toUniversityBriefDto(
    university: UniversityBrief,
    suffix: string,
  ): ProgramUniversityBriefDto {
    if (!university) return undefined;
    return {
      id: university.id,
      name: university.name,
      logoUrl: university.logoUrl,
      photoUrl: university.photoUrl,
      ranking: university.ranking,
      city: this.toCityDto(university.city, suffix),
      country: this.toCountryDto(university.country, suffix),
    };
  }

  private toUniversityDetailDto(
    university: University & { city?: City | null; country?: Country | null },
    suffix: string,
  ): ProgramUniversityDetailDto {
    if (!university) return undefined;
    return {
      ...this.toUniversityBriefDto(university, suffix),
      additionalPhotoUrls: university.additionalPhotoUrls || [],
      youtubeVideoUrl: university.youtubeVideoUrl,
      type: university.type,
      established: university.established,
      website: university.website,
      address: university.address,
      studentsCount: university.studentsCount,
      acceptanceRate: university.acceptanceRate,
    };
  }

  private toCityDto(city: City | null, suffix: string): ProgramCityDto {
    if (!city) return undefined;
    return {
      id: city.id,
      name: this.getLocalizedField(city, 'name', suffix),
      nameEn: city.nameEn,
      nameRu: city.nameRu,
      nameUz: city.nameUz,
    };
  }

  private toCountryDto(
    country: Country | null,
    suffix: string,
  ): ProgramCountryDto {
    if (!country) return undefined;
    return {
      code: country.code,
      name: this.getLocalizedField(country, 'name', suffix),
      nameEn: country.nameEn,
      nameRu: country.nameRu,
      nameUz: country.nameUz,
      photoUrl: country.photoUrl,
    };
  }

  private toIntakeDtos(intakes?: { intake: Intake }[]): ProgramIntakeDto[] {
    return (intakes || [])
      .filter((entry) => !!entry?.intake)
      .map((entry) => ({
        id: entry.intake.id,
        season: entry.intake.season,
        startMonth: entry.intake.startMonth,
        month: entry.intake.month,
        year: entry.intake.year,
        deadline: entry.intake.deadline.toISOString(),
      }));
  }

  private toCampusDtos(campuses?: Campus[]): ProgramCampusDto[] {
    return (campuses || []).map((campus) => ({
      id: campus.id,
      name: campus.name,
      code: campus.code,
      address: campus.address,
      latitude: campus.latitude,
      longitude: campus.longitude,
      photos: campus.photos || [],
    }));
  }

  private toScholarshipDtos(
    scholarships?: Scholarship[],
  ): ProgramScholarshipDto[] {
    return (scholarships || [])
      .filter((s): s is Scholarship => !!s && 'title' in s)
      .map((s) => ({
        id: s.id,
        title: s.title,
        amount: s.amount,
        isAutoApplied: s.isAutoApplied,
        isFullScholarship: s.isFullScholarship,
        isVisible: s.isVisible,
        nationalities: s.nationalities,
        programLevels: s.programLevels,
        overview: s.overview,
        howItWorks: s.howItWorks,
        scholarshipValue: s.scholarshipValue,
        importantNotes: s.importantNotes,
        eligibilityCriteria: s.eligibilityCriteria,
        sourceUrl: s.sourceUrl,
      }));
  }

  private toAdditionalExpenses(value: unknown): ProgramAdditionalExpenseDto[] {
    if (!Array.isArray(value)) return [];
    return value as ProgramAdditionalExpenseDto[];
  }

  toAdmissionRequirementDto(
    requirement: UniversityProgramDetailRow['admissionRequirement'],
    suffix: string,
  ): ProgramAdmissionRequirementResponseDto {
    if (!requirement) return undefined;

    return {
      id: requirement.id,
      universityProgramId: requirement.universityProgramId,
      minEducationLevel: requirement.minEducationLevel,
      minGpa: requirement.minGpa,
      gpaScale: requirement.gpaScale,
      requiredSubjects: requirement.requiredSubjects || [],
      minWorkExperienceYears: requirement.minWorkExperienceYears,
      minAge: requirement.minAge,
      maxAge: requirement.maxAge,
      requiresInterview: requirement.requiresInterview,
      requiresPortfolio: requirement.requiresPortfolio,
      englishRequirementWaivable: requirement.englishRequirementWaivable,

      englishWaiverNote: this.getLocalizedField(
        requirement,
        'englishWaiverNote',
        suffix,
      ),
      englishWaiverNoteEn: requirement.englishWaiverNoteEn,
      englishWaiverNoteRu: requirement.englishWaiverNoteRu,
      englishWaiverNoteUz: requirement.englishWaiverNoteUz,

      additionalNotes: this.getLocalizedField(
        requirement,
        'additionalNotes',
        suffix,
      ),
      additionalNotesEn: requirement.additionalNotesEn,
      additionalNotesRu: requirement.additionalNotesRu,
      additionalNotesUz: requirement.additionalNotesUz,

      languageTests: (requirement.languageTests || []).map(
        (test): ProgramLanguageTestRequirementResponseDto => ({
          id: test.id,
          test: test.test,
          minTotal: test.minTotal,
          minListening: test.minListening,
          minReading: test.minReading,
          minWriting: test.minWriting,
          minSpeaking: test.minSpeaking,
        }),
      ),
      standardizedTests: (requirement.standardizedTests || []).map(
        (test): ProgramStandardizedTestRequirementResponseDto => ({
          id: test.id,
          test: test.test,
          minScore: test.minScore,
          status: test.status,
        }),
      ),
      documents: (requirement.documents || [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(
          (doc): ProgramDocumentRequirementResponseDto => ({
            id: doc.id,
            kind: doc.kind,
            status: doc.status,
            quantity: doc.quantity,
            // Deliberately NOT falling back to `kind`: a raw enum name like
            // RECOMMENDATION_LETTER is not a label. Leaving this empty lets the
            // client render its own localized name for `kind`, and reserves
            // `label` for the admin's custom override.
            label: this.getLocalizedField(doc, 'label', suffix) || undefined,
            labelEn: doc.labelEn,
            labelRu: doc.labelRu,
            labelUz: doc.labelUz,
            notes: this.getLocalizedField(doc, 'notes', suffix),
            notesEn: doc.notesEn,
            notesRu: doc.notesRu,
            notesUz: doc.notesUz,
            sortOrder: doc.sortOrder,
          }),
        ),
    };
  }

  // -------------------------------------------------------------------------
  // Localization helpers (mirrors UniversitiesMapper)
  // -------------------------------------------------------------------------

  getLangSuffix(lang: string): string {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  getLocalizedField(
    entity: any,
    fieldPrefix: string,
    langSuffix: string,
  ): string {
    if (!entity) return '';
    // Program content is authored per-university and is very often written in
    // only one language, so fall through every locale rather than returning an
    // empty string and rendering a blank section on the program page.
    return (
      entity[`${fieldPrefix}${langSuffix}`] ||
      entity[`${fieldPrefix}Uz`] ||
      entity[`${fieldPrefix}Ru`] ||
      entity[`${fieldPrefix}En`] ||
      ''
    );
  }
}
