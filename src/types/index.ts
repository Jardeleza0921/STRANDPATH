export type MatchLevel = 'strong' | 'good' | 'possible';

export interface Strand {
  slug: string;
  code: string;
  name: string;
  track: 'Academic' | 'TVL' | 'Arts & Design' | 'Sports';
  isSubTrack?: boolean;
  tagline: string;
  summary: string;
  interests: string[];
  skills: string[];
  learn: string[];
  suitedFor: string[];
  collegeFields: string[];
  careerAreas: string[];
  considerations: string[];
  subTracks?: {name: string;slug?: string;note: string;}[];
}

export type QuestionKind = 'multi' | 'single' | 'scale';

export interface QuestionOption {
  id: string;
  label: string;
  hint?: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  section: string;
  prompt: string;
  helper: string;
  options: QuestionOption[];
  maxChoices?: number;
}

export interface ResultMatch {
  slug: string;
  name: string;
  level: MatchLevel;
  percent: number;
  explanation: string;
  strengths: string[];
  interests: string[];
  explore: string[];
}