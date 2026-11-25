export type Role = 'student' | 'guidance' | 'admin';
export type ThemeName = 'green' | 'blue' | 'red' | 'violet';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  mustChangePassword: boolean;
  theme: ThemeName;
}

export interface Profile {
  gradeLevel: string | null;
  school: string | null;
  city: string | null;
  interests: string | null;
  strengths: string | null;
  goals: string | null;
  learningPreference: string | null;
  careerInterest: string | null;
  selectedStrand: string | null;
  theme?: ThemeName;
  consentAt: string | null;
  updatedAt: string | null;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface EmailStatus {
  configured: boolean;
  transport: string;
  from: string | null;
  host: string | null;
  note: string;
}

export interface AuthConfig {
  google: { configured: boolean; clientId: string | null; note: string };
  email: EmailStatus;
  otpTtlMinutes: number;
  passwordRule: string;
  registration: string;
}

export interface VerificationState {
  emailSent: boolean;
  emailDelivery: string;
  emailError?: string;
  expiresAt?: string;
  note?: string;
}

export interface QuestionOption {
  id: number;
  code: string;
  label: string;
  hint: string | null;
  scores: Record<string, number>;
  orderIndex: number;
}

export interface Question {
  id: number;
  code: string;
  section: string;
  dimension: string | null;
  prompt: string;
  helper: string | null;
  kind: 'single' | 'multi' | 'scale';
  maxChoices: number | null;
  weight: number;
  validationStatus: string;
  options: QuestionOption[];
}

export interface QuestionnaireMeta {
  version: string;
  title: string;
  notes: string;
  algorithmVersion: string;
  validationNotice: string;
  categories: { key: string; label: string; description: string; developing?: string }[];
  sections: string[];
  questions: Question[];
}

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

export interface StrandEvidence {
  category: string;
  label: string;
  normalised: number;
  percent: number;
  weight: number;
  answers: string[];
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
  evidence: StrandEvidence[];
  gaps: { key: string; label: string; description: string }[];
}

export interface AssessmentResult {
  algorithmVersion: string;
  answeredCount: number;
  total: number;
  categoryScores: CategoryScore[];
  ranked: RankedStrand[];
  strengths: { key: string; label: string; percent: number; description: string }[];
  development: { key: string; label: string; percent: number; description: string; developing: string }[];
  warnings: { type: string; message: string }[];
  topStrand: RankedStrand | null;
}

export interface ComparisonCategory {
  key: string;
  label: string;
  before: number | null;
  after: number;
  delta: number | null;
}

export interface Comparison {
  previousAssessmentId: number | null;
  currentAssessmentId: number | null;
  previousDate: string | null;
  currentDate: string | null;
  categories: ComparisonCategory[];
  strands: { slug: string; code: string; name: string; before: number | null; after: number; delta: number | null; rankBefore: number | null; rankAfter: number }[];
  improved: ComparisonCategory[];
  declined: ComparisonCategory[];
  note: string;
}

export interface Assessment {
  id: number;
  type: 'pre' | 'post';
  status: 'in_progress' | 'submitted';
  startedAt: string;
  submittedAt: string | null;
  algorithmVersion: string;
  questionnaireVersion: string | null;
  questionnaireTitle: string | null;
  answers: Record<string, string[]>;
  selectedStrand: string | null;
  selectedAt: string | null;
  baselineAssessmentId: number | null;
  answeredCount?: number;
  total?: number;
  comparison?: Comparison;
  categoryScores?: CategoryScore[];
  ranked?: RankedStrand[];
  strengths?: AssessmentResult['strengths'];
  development?: AssessmentResult['development'];
  warnings?: AssessmentResult['warnings'];
}

export interface AssessmentSummary {
  id: number;
  type: 'pre' | 'post';
  status: 'in_progress' | 'submitted';
  startedAt: string;
  submittedAt: string | null;
  questionnaireVersion: string | null;
  algorithmVersion: string;
  selectedStrand: string | null;
  topStrand: { slug: string; code: string; name: string; score: number; level: string } | null;
  ranked: { rank: number; slug: string; code: string; score: number }[];
  answeredCount: number | null;
  total: number | null;
  hasResult: boolean;
}

export interface Strand {
  slug: string;
  code: string;
  name: string;
  track: string;
  tagline: string;
  summary: string;
  interests: string[];
  skills: string[];
  learn: string[];
  suitedFor: string[];
  collegeFields: string[];
  careerAreas: string[];
  considerations: string[];
  weights: Record<string, number>;
  active: boolean;
}

export interface ProgrammeActivity {
  id: number;
  activityId: number;
  slug: string;
  title: string;
  type: string;
  targetCategory: string;
  targetCategoryLabel: string;
  tier: string;
  difficulty: number;
  minutes: number;
  objectives: string[];
  instructions: string;
  completionCriteria: string;
  check: { prompt: string; options: string[]; answer: number; explanation: string }[] | null;
  sequence: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  checkScore: number | null;
  reflection: string | null;
}

export interface Programme {
  id: number;
  name: string;
  goal: string;
  strandSlug: string;
  targetCategories: { key: string; label: string; description: string }[];
  status: 'active' | 'completed' | 'archived';
  reassessmentAfterDays: number;
  createdAt: string;
  updatedAt: string;
  assessmentId: number;
  activities: ProgrammeActivity[];
  progress: { total: number; completed: number; inProgress: number; percent: number };
}

export interface DashboardData {
  user: User;
  profile: Profile | null;
  assessment: {
    preSubmitted: number;
    postSubmitted: number;
    latestPre: AssessmentSummary | null;
    latestPost: AssessmentSummary | null;
    inProgress: AssessmentSummary | null;
  };
  selectedStrand: string | null;
  program: Programme | null;
  reassessment: { recommendedAt: string; due: boolean; completed: boolean } | null;
  openTickets: number;
  ai: { configured: boolean; available: boolean; model: string; provider: string; enabled: boolean; note: string };
}

export interface AiStatus {
  configured: boolean;
  available: boolean;
  enabled: boolean;
  model: string;
  provider: string;
  note: string;
  keySource: string | null;
  grounding?: Record<string, boolean>;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SupportMessage {
  id: number;
  body: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  updatedAt: string;
  assignedTo: number | null;
  messages: SupportMessage[];
}
