import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DegreeType,
  DocumentRequirementKind,
  LanguageTestType,
  RequirementStatus,
  StandardizedTestType,
  StudyLevel,
  StudyMode,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared nested shapes
// ---------------------------------------------------------------------------

export class ProgramCountryDto {
  @ApiProperty({ description: 'Numeric country code' })
  code: number;

  @ApiProperty({ description: 'Localized country name' })
  name: string;

  @ApiProperty() nameEn: string;
  @ApiProperty() nameRu: string;
  @ApiProperty() nameUz: string;

  @ApiPropertyOptional({ nullable: true })
  photoUrl?: string;
}

export class ProgramCityDto {
  @ApiProperty() id: string;

  @ApiProperty({ description: 'Localized city name' })
  name: string;

  @ApiProperty() nameEn: string;
  @ApiProperty() nameRu: string;
  @ApiProperty() nameUz: string;
}

export class ProgramFacultyDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;

  @ApiProperty({ description: 'Localized faculty name' })
  name: string;

  @ApiProperty() nameEn: string;
  @ApiProperty() nameRu: string;
  @ApiProperty() nameUz: string;

  @ApiPropertyOptional({ nullable: true })
  iconKey?: string;
}

export class ProgramDepartmentDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() facultyId: string;

  @ApiProperty({ description: 'Localized department name' })
  name: string;

  @ApiProperty() nameEn: string;
  @ApiProperty() nameRu: string;
  @ApiProperty() nameUz: string;
}

export class ProgramStudyLanguageDto {
  @ApiProperty() id: string;

  @ApiProperty({ description: 'Localized language name' })
  name: string;

  @ApiProperty() nameEn: string;
  @ApiProperty() nameRu: string;
  @ApiProperty() nameUz: string;
}

export class ProgramIntakeDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'Intake season (FALL/WINTER/SPRING/SUMMER)' })
  season: string;
  @ApiProperty({ description: 'Numeric start month (1-12)' })
  startMonth: number;
  @ApiProperty({ description: 'Human-readable month name' })
  month: string;
  @ApiProperty() year: number;
  @ApiProperty({ description: 'Application deadline (ISO 8601)' })
  deadline: string;
}

export class ProgramAdditionalExpenseDto {
  @ApiProperty() label: string;
  @ApiProperty() amount: string;
  @ApiPropertyOptional() isMandatory?: boolean;
}

export class ProgramCampusDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) code?: string;
  @ApiProperty() address: string;
  @ApiPropertyOptional({ nullable: true }) latitude?: number;
  @ApiPropertyOptional({ nullable: true }) longitude?: number;
  @ApiProperty({ type: [String] }) photos: string[];
}

export class ProgramScholarshipDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() amount: string;
  @ApiProperty() isAutoApplied: boolean;
  @ApiProperty() isFullScholarship: boolean;
  @ApiProperty() isVisible: boolean;
  @ApiProperty({ type: [String] }) nationalities: string[];
  @ApiProperty({ type: [String] }) programLevels: string[];
  @ApiProperty() overview: string;
  @ApiPropertyOptional({ nullable: true }) howItWorks?: string;
  @ApiPropertyOptional({ nullable: true }) scholarshipValue?: string;
  @ApiPropertyOptional({ nullable: true }) importantNotes?: string;
  @ApiProperty() eligibilityCriteria: string;
  @ApiPropertyOptional({ nullable: true }) sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// University variants
// ---------------------------------------------------------------------------

export class ProgramUniversityBriefDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) logoUrl?: string;
  @ApiPropertyOptional({ nullable: true }) photoUrl?: string;
  @ApiPropertyOptional({ nullable: true, description: 'World ranking' })
  ranking?: number;

  @ApiPropertyOptional({ type: ProgramCityDto, nullable: true })
  city?: ProgramCityDto;

  @ApiPropertyOptional({ type: ProgramCountryDto, nullable: true })
  country?: ProgramCountryDto;
}

export class ProgramUniversityDetailDto extends ProgramUniversityBriefDto {
  @ApiProperty({ type: [String] }) additionalPhotoUrls: string[];
  @ApiPropertyOptional({ nullable: true }) youtubeVideoUrl?: string;
  @ApiPropertyOptional({ nullable: true }) type?: string;
  @ApiPropertyOptional({ nullable: true }) established?: number;
  @ApiPropertyOptional({ nullable: true }) website?: string;
  @ApiPropertyOptional({ nullable: true }) address?: string;
  @ApiPropertyOptional({ nullable: true }) studentsCount?: number;
  @ApiPropertyOptional({ nullable: true }) acceptanceRate?: number;
}

// ---------------------------------------------------------------------------
// Admission requirement
// ---------------------------------------------------------------------------

export class ProgramLanguageTestRequirementResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: LanguageTestType }) test: LanguageTestType;
  @ApiPropertyOptional({ nullable: true }) minTotal?: number;
  @ApiPropertyOptional({ nullable: true }) minListening?: number;
  @ApiPropertyOptional({ nullable: true }) minReading?: number;
  @ApiPropertyOptional({ nullable: true }) minWriting?: number;
  @ApiPropertyOptional({ nullable: true }) minSpeaking?: number;
}

export class ProgramStandardizedTestRequirementResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: StandardizedTestType }) test: StandardizedTestType;
  @ApiPropertyOptional({ nullable: true }) minScore?: number;
  @ApiProperty({ enum: RequirementStatus }) status: RequirementStatus;
}

export class ProgramDocumentRequirementResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: DocumentRequirementKind }) kind: DocumentRequirementKind;
  @ApiProperty({ enum: RequirementStatus }) status: RequirementStatus;
  @ApiPropertyOptional({ nullable: true }) quantity?: number;

  @ApiProperty({ description: 'Localized label (falls back to the kind)' })
  label: string;

  @ApiPropertyOptional({ nullable: true }) labelEn?: string;
  @ApiPropertyOptional({ nullable: true }) labelRu?: string;
  @ApiPropertyOptional({ nullable: true }) labelUz?: string;

  @ApiProperty({ description: 'Localized notes' })
  notes: string;

  @ApiPropertyOptional({ nullable: true }) notesEn?: string;
  @ApiPropertyOptional({ nullable: true }) notesRu?: string;
  @ApiPropertyOptional({ nullable: true }) notesUz?: string;

  @ApiProperty() sortOrder: number;
}

export class ProgramAdmissionRequirementResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() universityProgramId: string;

  @ApiPropertyOptional({ enum: DegreeType, nullable: true })
  minEducationLevel?: DegreeType;

  @ApiPropertyOptional({ nullable: true }) minGpa?: number;
  @ApiPropertyOptional({ nullable: true }) gpaScale?: number;
  @ApiProperty({ type: [String] }) requiredSubjects: string[];
  @ApiPropertyOptional({ nullable: true }) minWorkExperienceYears?: number;
  @ApiPropertyOptional({ nullable: true }) minAge?: number;
  @ApiPropertyOptional({ nullable: true }) maxAge?: number;
  @ApiProperty() requiresInterview: boolean;
  @ApiProperty() requiresPortfolio: boolean;
  @ApiProperty() englishRequirementWaivable: boolean;

  @ApiProperty({ description: 'Localized english waiver note' })
  englishWaiverNote: string;

  @ApiPropertyOptional({ nullable: true }) englishWaiverNoteEn?: string;
  @ApiPropertyOptional({ nullable: true }) englishWaiverNoteRu?: string;
  @ApiPropertyOptional({ nullable: true }) englishWaiverNoteUz?: string;

  @ApiProperty({ description: 'Localized additional notes' })
  additionalNotes: string;

  @ApiPropertyOptional({ nullable: true }) additionalNotesEn?: string;
  @ApiPropertyOptional({ nullable: true }) additionalNotesRu?: string;
  @ApiPropertyOptional({ nullable: true }) additionalNotesUz?: string;

  @ApiProperty({ type: [ProgramLanguageTestRequirementResponseDto] })
  languageTests: ProgramLanguageTestRequirementResponseDto[];

  @ApiProperty({ type: [ProgramStandardizedTestRequirementResponseDto] })
  standardizedTests: ProgramStandardizedTestRequirementResponseDto[];

  @ApiProperty({ type: [ProgramDocumentRequirementResponseDto] })
  documents: ProgramDocumentRequirementResponseDto[];
}

// ---------------------------------------------------------------------------
// Program: list item + detail
// ---------------------------------------------------------------------------

export class UniversityProgramListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() universityId: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ nullable: true }) slug?: string;
  @ApiPropertyOptional({ nullable: true }) facultyId?: string;
  @ApiPropertyOptional({ nullable: true }) departmentId?: string;

  @ApiProperty() tuitionFee: number;
  @ApiProperty() tuitionFeeType: string;
  @ApiProperty() tuitionFeeCurrency: string;
  @ApiPropertyOptional({ nullable: true }) scholarshipAppliedTutionFee?: number;

  @ApiProperty({ enum: StudyLevel }) studyLevel: StudyLevel;
  @ApiProperty({ enum: StudyMode }) studyMode: StudyMode;
  @ApiPropertyOptional({ nullable: true, description: 'Duration in years' })
  duration?: number;
  @ApiPropertyOptional({ nullable: true }) credits?: number;

  @ApiPropertyOptional({ nullable: true }) applicationFee?: number;
  @ApiPropertyOptional({ nullable: true }) applicationFeeCurrency?: string;
  @ApiProperty() isApplicationFeeRefundable: boolean;

  @ApiProperty({
    description: 'Description localized to the Accept-Language header',
  })
  description: string;

  @ApiPropertyOptional({ nullable: true }) descriptionEn?: string;
  @ApiPropertyOptional({ nullable: true }) descriptionRu?: string;
  @ApiPropertyOptional({ nullable: true }) descriptionUz?: string;

  @ApiProperty() isActive: boolean;
  @ApiProperty() isFeatured: boolean;

  @ApiProperty({ description: 'At least one visible scholarship is attached' })
  hasScholarship: boolean;

  @ApiPropertyOptional({ nullable: true }) studyLanguageId?: string;

  @ApiPropertyOptional({ type: ProgramStudyLanguageDto, nullable: true })
  studyLanguage?: ProgramStudyLanguageDto;

  @ApiPropertyOptional({ type: ProgramFacultyDto, nullable: true })
  faculty?: ProgramFacultyDto;

  @ApiPropertyOptional({ type: ProgramDepartmentDto, nullable: true })
  department?: ProgramDepartmentDto;

  @ApiProperty({ type: ProgramUniversityBriefDto })
  university: ProgramUniversityBriefDto;

  @ApiProperty({ type: [ProgramIntakeDto] })
  intakes: ProgramIntakeDto[];

  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class UniversityProgramDetailDto extends UniversityProgramListItemDto {
  @ApiProperty({ description: 'Career outcomes localized to Accept-Language' })
  careerOutcomes: string;

  @ApiPropertyOptional({ nullable: true }) careerOutcomesEn?: string;
  @ApiPropertyOptional({ nullable: true }) careerOutcomesRu?: string;
  @ApiPropertyOptional({ nullable: true }) careerOutcomesUz?: string;

  @ApiProperty({ description: 'Curriculum localized to Accept-Language' })
  curriculum: string;

  @ApiPropertyOptional({ nullable: true }) curriculumEn?: string;
  @ApiPropertyOptional({ nullable: true }) curriculumRu?: string;
  @ApiPropertyOptional({ nullable: true }) curriculumUz?: string;

  @ApiProperty({ type: [ProgramAdditionalExpenseDto] })
  additionalExpenses: ProgramAdditionalExpenseDto[];

  @ApiProperty({ type: ProgramUniversityDetailDto })
  university: ProgramUniversityDetailDto;

  @ApiProperty({ type: [ProgramCampusDto] })
  campuses: ProgramCampusDto[];

  @ApiProperty({ type: [ProgramScholarshipDto] })
  scholarships: ProgramScholarshipDto[];

  @ApiPropertyOptional({
    type: ProgramAdmissionRequirementResponseDto,
    nullable: true,
  })
  admissionRequirement?: ProgramAdmissionRequirementResponseDto;
}

// ---------------------------------------------------------------------------
// Facets
// ---------------------------------------------------------------------------

export class UniversityProgramFacetBucketDto {
  @ApiProperty({
    description: 'Bucket key (faculty/department id or enum value)',
  })
  value: string;

  @ApiProperty({ description: 'Localized display label' })
  label: string;

  @ApiProperty({ description: 'Number of active programs in this bucket' })
  count: number;
}

export class UniversityProgramFacetsDto {
  @ApiProperty({ type: [UniversityProgramFacetBucketDto] })
  faculties: UniversityProgramFacetBucketDto[];

  @ApiProperty({ type: [UniversityProgramFacetBucketDto] })
  departments: UniversityProgramFacetBucketDto[];

  @ApiProperty({ type: [UniversityProgramFacetBucketDto] })
  studyLevels: UniversityProgramFacetBucketDto[];

  @ApiProperty({ description: 'Total programs matching the current filters' })
  total: number;
}
