/**
 * Types for the shared content module used by both the optional Node API and
 * the static browser build. Keep this in step with shared/content.js.
 */

export interface ContentCategory {
  label: string;
  short: string;
  description: string;
  developing: string;
}

export interface ContentQuestionOption {
  code: string;
  label: string;
  hint?: string;
  scores: Record<string, number>;
}

export interface ContentQuestion {
  code: string;
  section: string;
  dimension?: string;
  kind: 'single' | 'multi' | 'scale';
  prompt: string;
  helper?: string;
  maxChoices?: number;
  weight?: number;
  validationStatus?: string;
  options: ContentQuestionOption[];
}

export interface StrandSeed {
  slug: string;
  code: string;
  name: string;
  track: string;
  tagline: string;
  summary: string;
  interests: string[];
  skills: string[];
  learn: string[];
  suited: string[];
  college: string[];
  careers: string[];
  considerations: string[];
  weights: Record<string, number>;
}

export interface ActivityCheckQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ActivitySeed {
  slug: string;
  title: string;
  type: string;
  targetCategory: string;
  tier: 'foundation' | 'core' | string;
  difficulty: number;
  minutes: number;
  objectives: string[];
  instructions: string;
  completionCriteria: string;
  check: ActivityCheckQuestion[] | null;
}

export const CATEGORIES: Record<string, ContentCategory>;
export const CATEGORY_KEYS: string[];
export const QUESTIONNAIRE_V1: {
  version: string;
  title: string;
  notes: string;
  questions: ContentQuestion[];
};
export const STRANDS: StrandSeed[];
export const ACTIVITIES: ActivitySeed[];
