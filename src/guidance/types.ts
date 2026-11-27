/** Types shared by the Strand Assistance knowledge base and engine. */

export interface StrandKnowledge {
  slug: string;
  code: string;
  name: string;
  track: string;
  tagline: string;
  summary: string;
  subjects: string[];
  skills: string[];
  interests: string[];
  suitedFor: string[];
  collegeFields: string[];
  careers: string[];
  considerations: string[];
  aliases: string[];
  isSubTrack: boolean;
  parentSlug?: string;
}

export interface ProgramKnowledge {
  slug: string;
  name: string;
  aliases: string[];
  strands: string[];
  preparation: string[];
  skills: string[];
  careers: string[];
  notes: string;
}

export interface CareerKnowledge {
  slug: string;
  name: string;
  aliases: string[];
  strands: string[];
  programs: string[];
  skills: string[];
  dayToDay: string;
  nextStep: string;
}

export interface FaqKnowledge {
  id: string;
  question: string;
  paragraphs: string[];
  points?: { label: string; text: string }[];
  suggestions?: string[];
}

export interface GuidanceSource {
  label: string;
  detail: string;
}

export interface GuidancePoint {
  label: string;
  text: string;
}

/** One answer from the Strand Assistance engine. */
export interface GuidanceAnswer {
  topic: string;
  title: string;
  paragraphs: string[];
  points?: GuidancePoint[];
  suggestions: string[];
  followUp?: string;
  sources: GuidanceSource[];
  groundedOnAssessment: boolean;
  /** True when the question could not be handled from the knowledge base. */
  unsupported?: boolean;
}

export interface GuidanceAssessmentSummary {
  id: number;
  type: 'pre' | 'post';
  submittedAt: string | null;
  algorithmVersion: string;
  questionnaireVersion: string | null;
  selectedStrand: string | null;
  topStrand: { slug: string; code: string; name: string; score: number; level: string; levelLabel: string } | null;
  ranked: {
    slug: string;
    code: string;
    name: string;
    score: number;
    level: string;
    levelLabel: string;
    rank: number;
    explanation: string;
    evidence: { category: string; label: string; percent: number; weight: number; answers: string[] }[];
    gaps: { key: string; label: string; description: string }[];
  }[];
  strengths: { key: string; label: string; percent: number; description: string }[];
  development: { key: string; label: string; percent: number; description: string; developing: string }[];
  warnings: { type: string; message: string }[];
  categoryScores: { key: string; label: string; percent: number }[];
}

export interface GuidanceProfile {
  gradeLevel?: string | null;
  school?: string | null;
  interests?: string | null;
  strengths?: string | null;
  goals?: string | null;
  learningPreference?: string | null;
  careerInterest?: string | null;
}

export interface GuidanceProgramme {
  name: string;
  strandSlug: string;
  status: string;
  progress: { completed: number; total: number; percent: number };
  activities: { title: string; status: string; category: string; minutes: number }[];
}

/** The student's development pathway, reduced to what answers need. */
export interface GuidanceDevelopment {
  strandCode: string;
  stageName: string;
  currentReadiness: number;
  targetReadiness: number;
  progressPercent: number;
  completedActivities: number;
  remainingActivities: number;
  strongest: { label: string; percent: number }[];
  weakest: { label: string; percent: number; target: number }[];
  nextAction?: { label: string; detail: string } | null;
  transferableSkills: string[];
}

/** Everything the engine is allowed to know about the student. */
export interface GuidanceContext {
  latest?: GuidanceAssessmentSummary | null;
  pre?: GuidanceAssessmentSummary | null;
  post?: GuidanceAssessmentSummary | null;
  selectedStrand?: string | null;
  profile?: GuidanceProfile | null;
  programme?: GuidanceProgramme | null;
  development?: GuidanceDevelopment | null;
}
