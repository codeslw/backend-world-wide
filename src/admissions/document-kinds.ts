import { DocumentRequirementKind } from '@prisma/client';

/**
 * One vocabulary for documents. A program asks for kinds
 * (ProgramDocumentRequirement.kind), the process template's document types name
 * a kind, and what an applicant keeps on the profile maps to a kind here, so
 * one passport answers every "passport" requirement.
 */
export interface LocalizedLabel {
  en: string;
  ru: string;
  uz: string;
}

export const DOCUMENT_KIND_LABELS: Record<
  DocumentRequirementKind,
  LocalizedLabel
> = {
  PASSPORT: { en: 'Passport', ru: 'Паспорт', uz: 'Pasport' },
  TRANSCRIPT: { en: 'Transcript', ru: 'Табель оценок', uz: 'Baholar tabeli' },
  DIPLOMA: {
    en: 'Diploma or certificate',
    ru: 'Аттестат или диплом',
    uz: 'Attestat yoki diplom',
  },
  RECOMMENDATION_LETTER: {
    en: 'Recommendation letter',
    ru: 'Рекомендательное письмо',
    uz: 'Tavsiyanoma',
  },
  MOTIVATION_LETTER: {
    en: 'Motivation letter',
    ru: 'Мотивационное письмо',
    uz: 'Motivatsion xat',
  },
  CV: { en: 'CV', ru: 'Резюме', uz: 'Rezyume' },
  PORTFOLIO: { en: 'Portfolio', ru: 'Портфолио', uz: 'Portfolio' },
  RESEARCH_PROPOSAL: {
    en: 'Research proposal',
    ru: 'План исследования',
    uz: 'Tadqiqot rejasi',
  },
  FINANCIAL_PROOF: {
    en: 'Proof of funds',
    ru: 'Справка о финансах',
    uz: 'Moliyaviy ma’lumotnoma',
  },
  MEDICAL_CERTIFICATE: {
    en: 'Medical certificate',
    ru: 'Медицинская справка',
    uz: 'Tibbiy ma’lumotnoma',
  },
  PHOTO: { en: 'Photo', ru: 'Фото', uz: 'Foto' },
  ENGLISH_CERTIFICATE: {
    en: 'Language certificate',
    ru: 'Языковой сертификат',
    uz: 'Til sertifikati',
  },
  STANDARDIZED_TEST_SCORE: {
    en: 'Test score (SAT, GRE, GMAT)',
    ru: 'Результат теста (SAT, GRE, GMAT)',
    uz: 'Test natijasi (SAT, GRE, GMAT)',
  },
  INTERVIEW: { en: 'Interview', ru: 'Собеседование', uz: 'Suhbat' },
  OTHER: {
    en: 'Other documents',
    ru: 'Другие документы',
    uz: 'Boshqa hujjatlar',
  },
};

/** Kinds of document kept on a partner student's profile (student_documents.type). */
const STUDENT_DOCUMENT_KIND: Record<string, DocumentRequirementKind> = {
  passport: 'PASSPORT',
  transcript: 'TRANSCRIPT',
  highschool_diploma: 'DIPLOMA',
  bachelors_diploma: 'DIPLOMA',
  diploma: 'DIPLOMA',
  letter_of_referral: 'RECOMMENDATION_LETTER',
  motivation_letter: 'MOTIVATION_LETTER',
  cv: 'CV',
  portfolio: 'PORTFOLIO',
  research_proposal: 'RESEARCH_PROPOSAL',
  bank_statement: 'FINANCIAL_PROOF',
  medical_certificate: 'MEDICAL_CERTIFICATE',
  photo: 'PHOTO',
  english_certificate: 'ENGLISH_CERTIFICATE',
  ielts: 'ENGLISH_CERTIFICATE',
  toefl: 'ENGLISH_CERTIFICATE',
  duolingo: 'ENGLISH_CERTIFICATE',
  gmat: 'STANDARDIZED_TEST_SCORE',
  gre: 'STANDARDIZED_TEST_SCORE',
  sat: 'STANDARDIZED_TEST_SCORE',
};

export function kindOfStudentDocument(
  type: string | null | undefined,
): DocumentRequirementKind {
  return STUDENT_DOCUMENT_KIND[(type ?? '').trim().toLowerCase()] ?? 'OTHER';
}

const KINDS = new Set<string>(Object.values(DocumentRequirementKind));

export function isDocumentKind(
  value: unknown,
): value is DocumentRequirementKind {
  return typeof value === 'string' && KINDS.has(value);
}
