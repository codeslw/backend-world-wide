import { Injectable } from '@nestjs/common';
import {
  University,
  Country,
  City,
  Program,
  UniversityProgram,
  Intake,
  UniversityRequirements,
  Scholarship,
} from '@prisma/client';
import { UniversityResponseDto } from './dto/university-response.dto';
import { UniversityListItemDto } from './dto/university-list-item.dto';
import { MainUniversityResponseDto } from './dto/main-university-response.dto';
import { UniversityByProgramResponseDto } from './dto/university-by-program-response.dto';
import { ProgramDetailsDto } from './dto/university-by-program-response.dto';
import { Currency } from 'src/common/enum/currency.enum';
import { StudyLevel } from 'src/common/enum/study-level.enum';
import { UniversityType } from 'src/common/enum/university-type.enum';

type UniversityWithRelations = University & {
  country?: Country;
  city?: City;
  universityPrograms?: (UniversityProgram & {
    program?: Program;
    intakes?: { intake: Intake }[];
    scholarships?: Scholarship[];
  })[];
  requirements?: UniversityRequirements | null;
  scholarships?: Scholarship[];
  _count?: {
    universityPrograms: number;
  };
};

type UniversityProgramWithRelations = UniversityProgram & {
  university: University & {
    country: Country;
    city: City;
  };
  program: Program;
  intakes?: { intake: Intake }[];
  scholarships?: Scholarship[];
  logo?: string;
  studyLanguage?: string;
};

@Injectable()
export class UniversitiesMapper {
  toResponseDto(
    university: UniversityWithRelations,
    lang: string = 'uz',
  ): UniversityResponseDto {
    const langSuffix = this.getLangSuffix(lang);

    return {
      id: university.id,
      name: university.name,
      established: university.established,
      type: university.type as unknown as UniversityType,
      avgApplicationFee: university.avgApplicationFee,
      applicationFeeCurrency: university.applicationFeeCurrency as Currency,
      countryCode: university.countryCode,
      cityId: university.cityId,
      descriptionUz: university.descriptionUz,
      descriptionRu: university.descriptionRu,
      descriptionEn: university.descriptionEn,
      winterIntakeDeadline: this.formatDate(university.winterIntakeDeadline),
      autumnIntakeDeadline: this.formatDate(university.autumnIntakeDeadline),
      ranking: university.ranking,
      studentsCount: university.studentsCount,
      acceptanceRate: university.acceptanceRate,
      website: university.website,
      email: university.email,
      phone: university.phone,
      address: university.address,
      photoUrl: university.photoUrl,
      additionalPhotoUrls: university.additionalPhotoUrls,
      isMain: university.isMain,
      createdAt: university.createdAt.toISOString(),
      updatedAt: university.updatedAt.toISOString(),
      universityPrograms:
        university.universityPrograms?.map((up) => ({
          programId: up.programId,
          titleUz: up.program?.titleUz,
          titleRu: up.program?.titleRu,
          titleEn: up.program?.titleEn,
          tuitionFee: up.tuitionFee,
          tuitionFeeCurrency: up.tuitionFeeCurrency as Currency,
          studyLevel: up.studyLevel as StudyLevel,
          duration: up.duration,
          intakes:
            up.intakes?.map((api) => ({
              id: api.intake.id,
              month: api.intake.month,
              year: api.intake.year,
              deadline: api.intake.deadline.toISOString(),
            })) || [],
          hasScholarship: up.scholarships && up.scholarships.length > 0,
        })) || [],
      country: this.localizeCountry(university.country, langSuffix),
      city: this.localizeCity(university.city, langSuffix),
      scholarships:
        university.scholarships?.map((s) => ({
          id: s.id,
          title: s.title,
          amount: s.amount,
          isAutoApplied: s.isAutoApplied,
          nationalities: s.nationalities,
          programLevels: s.programLevels,
          overview: s.overview,
          howItWorks: s.howItWorks,
          scholarshipValue: s.scholarshipValue,
          importantNotes: s.importantNotes,
          eligibilityCriteria: s.eligibilityCriteria,
          sourceUrl: s.sourceUrl,
          universityId: s.universityId,
          createdAt: s.createdAt,
          lastUpdated: s.lastUpdated,
        })) || [],
      hasScholarship: university.hasScholarship ?? false,
      requirements: university.requirements,
      scholarshipRequirements: [],
    };
  }

  toListItemDto(
    university: UniversityWithRelations,
    lang: string = 'uz',
  ): UniversityListItemDto {
    const langSuffix = this.getLangSuffix(lang);
    const countryName = this.getLocalizedField(
      university.country,
      'name',
      langSuffix,
    );
    const cityName = this.getLocalizedField(
      university.city,
      'name',
      langSuffix,
    );

    const programs = university.universityPrograms || [];

    let minTuitionFee = 0;
    let maxTuitionFee = 0;
    let tuitionFeeCurrency = Currency.USD;

    if (programs.length > 0) {
      const fees = programs.map((p) => Number(p.tuitionFee));
      minTuitionFee = Math.min(...fees);
      maxTuitionFee = Math.max(...fees);
      if (programs[0].tuitionFeeCurrency) {
        tuitionFeeCurrency = programs[0].tuitionFeeCurrency as Currency;
      }
    }

    const bachelorCount = programs.filter(
      (p) => p.studyLevel === StudyLevel.BACHELOR,
    ).length;
    const masterCount = programs.filter(
      (p) => p.studyLevel === StudyLevel.MASTER,
    ).length;
    const phdCount = programs.filter(
      (p) => p.studyLevel === StudyLevel.PHD,
    ).length;

    return {
      id: university.id,
      name: university.name,
      established: university.established,
      type: university.type as unknown as UniversityType,
      avgApplicationFee: university.avgApplicationFee,
      applicationFeeCurrency: university.applicationFeeCurrency as Currency,
      ranking: university.ranking,
      photoUrl: university.photoUrl,
      isMain: university.isMain,
      countryName: countryName || '',
      cityName: cityName || '',
      minTuitionFee,
      maxTuitionFee,
      tuitionFeeCurrency,
      bachelorCount,
      masterCount,
      phdCount,
      hasScholarship: university.hasScholarship ?? false,
    };
  }

  toMainUniversityDto(
    university: UniversityWithRelations,
    lang: string = 'uz',
  ): MainUniversityResponseDto {
    const langSuffix = this.getLangSuffix(lang);

    return {
      id: university.id,
      name: university.name,
      country: this.localizeCountry(university.country, langSuffix),
      city: this.localizeCity(university.city, langSuffix),
      programs:
        university.universityPrograms?.map((up) => ({
          programId: up.programId,
          title: this.getLocalizedField(up.program, 'title', langSuffix),
          tuitionFee: up.tuitionFee,
          tuitionFeeCurrency: up.tuitionFeeCurrency as Currency,
          studyLevel: up.studyLevel as StudyLevel,
          intakes:
            up.intakes?.map((api) => ({
              id: api.intake.id,
              month: api.intake.month,
              year: api.intake.year,
              deadline: api.intake.deadline.toISOString(),
            })) || [],
        })) || [],
      ranking: university.ranking,
      established: university.established,
      photoUrl: university.photoUrl,
    };
  }

  toUniversityByProgramDto(
    up: UniversityProgramWithRelations,
    lang: string = 'uz',
  ): UniversityByProgramResponseDto {
    const langSuffix = this.getLangSuffix(lang);
    const university = up.university;
    const program = up.program;

    return {
      universityId: university.id,
      universityName: university.name,
      established: university.established,
      type: university.type as any,
      descriptionUz: university.descriptionUz,
      descriptionRu: university.descriptionRu,
      descriptionEn: university.descriptionEn,
      ranking: university.ranking,
      studentsCount: university.studentsCount,
      acceptanceRate: university.acceptanceRate,
      website: university.website,
      email: university.email,
      phone: university.phone,
      address: university.address,
      photoUrl: university.photoUrl,
      winterIntakeDeadline: this.formatDate(university.winterIntakeDeadline),
      autumnIntakeDeadline: this.formatDate(university.autumnIntakeDeadline),
      country: this.localizeCountry(university.country, langSuffix),
      city: this.localizeCity(university.city, langSuffix),
      program: {
        id: up.id,
        programId: program.id,
        title: this.getLocalizedField(program, 'title', langSuffix),
        description: this.getLocalizedField(program, 'description', langSuffix),
        tuitionFee: up.tuitionFee,
        tuitionFeeCurrency: up.tuitionFeeCurrency as Currency,
        studyLevel: up.studyLevel as StudyLevel,
        duration: up.duration,
        logo: up.logo,
        studyLanguage: up.studyLanguage,
        intakes:
          up.intakes?.map((api) => ({
            id: api.intake.id,
            month: api.intake.month,
            year: api.intake.year,
            deadline: api.intake.deadline.toISOString(),
          })) || [],
        hasScholarship: up.scholarships && up.scholarships.length > 0,
      },
      createdAt: university.createdAt.toISOString(),
      updatedAt: university.updatedAt.toISOString(),
    };
  }

  toProgramDetailsDto(
    up: UniversityProgram & { program: Program; scholarships?: Scholarship[] },
    lang: string = 'uz',
  ): ProgramDetailsDto {
    const langSuffix = this.getLangSuffix(lang);
    const program = up.program;

    return {
      id: up.id,
      programId: program.id,
      title: this.getLocalizedField(program, 'title', langSuffix),
      description: this.getLocalizedField(program, 'description', langSuffix),
      tuitionFee: up.tuitionFee,
      tuitionFeeCurrency: up.tuitionFeeCurrency as Currency,
      studyLevel: up.studyLevel as StudyLevel,
      duration: up.duration,
      scholarships:
        up.scholarships?.map((s) => ({
          id: s.id,
          title: s.title,
          amount: s.amount,
          isAutoApplied: s.isAutoApplied,
          nationalities: s.nationalities,
          programLevels: s.programLevels,
          overview: s.overview,
          howItWorks: s.howItWorks,
          scholarshipValue: s.scholarshipValue,
          importantNotes: s.importantNotes,
          eligibilityCriteria: s.eligibilityCriteria,
          sourceUrl: s.sourceUrl,
          universityId: s.universityId,
          createdAt: s.createdAt,
          lastUpdated: s.lastUpdated,
        })) || [],
      hasScholarship: up.scholarships && up.scholarships.length > 0,
    };
  }

  private getLangSuffix(lang: string): string {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  private getLocalizedField(
    entity: any,
    fieldPrefix: string,
    langSuffix: string,
  ): string {
    if (!entity) return '';
    return (
      entity[`${fieldPrefix}${langSuffix}`] || entity[`${fieldPrefix}Uz`] || ''
    );
  }

  private localizeCountry(country: any, langSuffix: string) {
    if (!country) return null;
    return {
      ...country,
      name: this.getLocalizedField(country, 'name', langSuffix),
    };
  }

  private localizeCity(city: any, langSuffix: string) {
    if (!city) return null;
    return {
      ...city,
      name: this.getLocalizedField(city, 'name', langSuffix),
      description: this.getLocalizedField(city, 'description', langSuffix),
    };
  }

  private formatDate(date: Date | null): string | null {
    return date ? date.toISOString().split('T')[0] : null;
  }
}
