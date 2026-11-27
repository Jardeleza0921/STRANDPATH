import type { ThemeName } from '../../types/api';

export interface LocalUserRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student';
  status: 'active' | 'suspended';
  verifiedAt: string | null;
  theme: ThemeName;
  createdAt: string;
}

export interface LocalProfileRecord {
  gradeLevel: string | null;
  school: string | null;
  city: string | null;
  interests: string | null;
  strengths: string | null;
  goals: string | null;
  learningPreference: string | null;
  careerInterest: string | null;
  selectedStrand: string | null;
  consentAt: string | null;
  updatedAt: string | null;
}

/**
 * A stored result is the shared engine's output plus the assessment identity.
 * Types are intentionally structural so shared/engine.js stays the single
 * implementation of scoring.
 */
export interface LocalAssessmentResult {
  algorithmVersion: string;
  answeredCount: number;
  total: number;
  answers: Record<string, string[]>;
  categoryScores: {
    key: string;
    label: string;
    short: string;
    raw: number;
    maximum: number;
    normalized: number;
    percent: number;
    sources: { questionCode: string; optionCode: string; label: string; points: number }[];
  }[];
  ranked: {
    slug: string;
    code: string;
    name: string;
    track: string;
    score: number;
    level: string;
    levelLabel: string;
    rank: number;
    explanation: string;
    evidence: { category: string; label: string; normalised: number; percent: number; weight: number; answers: string[] }[];
    gaps: { key: string; label: string; description: string }[];
  }[];
  strengths: { key: string; label: string; percent: number; description: string }[];
  development: { key: string; label: string; percent: number; description: string; developing: string }[];
  warnings: { type: string; message: string }[];
  topStrand: unknown;
}

export interface LocalAssessmentRecord {
  id: number;
  userId: number;
  type: 'pre' | 'post';
  status: 'in_progress' | 'submitted';
  startedAt: string;
  submittedAt: string | null;
  algorithmVersion: string;
  questionnaireVersion: string;
  answers: Record<string, string[]>;
  selectedStrand: string | null;
  selectedAt: string | null;
  baselineAssessmentId: number | null;
  result: LocalAssessmentResult | null;
}

export interface LocalProgramActivityRecord {
  id: number;
  activitySlug: string;
  sequence: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  reflection: string | null;
  checkScore: number | null;
  responses: (number | null)[] | null;
}

export interface LocalProgramRecord {
  id: number;
  userId: number;
  assessmentId: number;
  name: string;
  goal: string;
  strandSlug: string;
  targetCategories: string[];
  status: 'active' | 'completed' | 'archived';
  reassessmentAfterDays: number;
  createdAt: string;
  updatedAt: string;
  activities: LocalProgramActivityRecord[];
}

export interface LocalTicketMessage {
  id: number;
  authorRole: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface LocalTicketRecord {
  id: number;
  userId: number;
  subject: string;
  category: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  updatedAt: string;
  messages: LocalTicketMessage[];
}

export interface LocalNotificationRecord {
  id: number;
  userId: number;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface LocalSession {
  userId: number;
  token: string;
  expiresAt: string;
}

export interface LocalDatabase {
  version: 1;
  nextId: number;
  users: LocalUserRecord[];
  profiles: Record<string, LocalProfileRecord>;
  assessments: LocalAssessmentRecord[];
  programs: LocalProgramRecord[];
  tickets: LocalTicketRecord[];
  notifications: LocalNotificationRecord[];
  session: LocalSession | null;
}
