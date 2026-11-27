/** Types for the deterministic scoring engine in shared/engine.js. */
import type { ContentQuestion, StrandSeed } from './content.js';

export interface CategoryScore {
  key: string;
  label: string;
  short: string;
  raw: number;
  maximum: number;
  normalized: number;
  percent: number;
  sources: { questionCode: string; optionCode: string; label: string; points: number }[];
}

export interface RankedStrand {
  slug: string;
  code: string;
  name: string;
  track: string;
  score: number;
  level: 'strong' | 'good' | 'possible' | 'exploratory';
  levelLabel: string;
  rank: number;
  explanation: string;
  evidence: {
    category: string;
    label: string;
    normalised: number;
    percent: number;
    weight: number;
    answers: string[];
  }[];
  gaps: { key: string; label: string; description: string }[];
}

export interface ScoredAssessment {
  algorithmVersion: string;
  answeredCount: number;
  total: number;
  answers: Record<string, string[]>;
  categoryScores: CategoryScore[];
  ranked: RankedStrand[];
  strengths: { key: string; label: string; percent: number; description: string }[];
  development: {
    key: string;
    label: string;
    percent: number;
    description: string;
    developing: string;
  }[];
  warnings: { type: string; message: string }[];
  topStrand: RankedStrand | null;
}

export interface StoredResult extends ScoredAssessment {
  assessmentId?: number;
  submittedAt?: string;
}

export interface ResultComparison {
  previousAssessmentId: number | null;
  currentAssessmentId: number | null;
  previousDate: string | null;
  currentDate: string | null;
  categories: {
    key: string;
    label: string;
    before: number | null;
    after: number;
    delta: number | null;
  }[];
  strands: {
    slug: string;
    code: string;
    name: string;
    before: number | null;
    after: number;
    delta: number | null;
    rankBefore: number | null;
    rankAfter: number;
  }[];
  improved: { key: string; label: string; delta: number | null; before: number | null; after: number }[];
  declined: { key: string; label: string; delta: number | null; before: number | null; after: number }[];
  note: string;
}

export const ALGORITHM_VERSION: string;
export const MATCH_LEVELS: { level: string; min: number; label: string }[];
export function levelFor(score: number): { level: string; min: number; label: string };
export function labelFor(category: string): string;
export function validateAnswers(
  questions: ContentQuestion[],
  answers: Record<string, string[]>
): {
  ok: boolean;
  complete: boolean;
  errors: string[];
  missing: string[];
  answers: Record<string, string[]>;
  answeredCount: number;
  total: number;
};
export function scoreCategories(
  questions: ContentQuestion[],
  answers: Record<string, string[]>
): CategoryScore[];
export function scoreAssessment(input: {
  questions: ContentQuestion[];
  strands: StrandSeed[];
  answers: Record<string, string[]>;
}): ScoredAssessment;
export function compareResults(
  previous: StoredResult | null,
  current: StoredResult | null
): ResultComparison | null;
