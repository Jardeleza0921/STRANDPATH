/** Types for STRANDPATH's readiness and development-progression model. */

export type StageId = 'foundation' | 'developing' | 'competence' | 'advanced' | 'target';

export type StageStatus = 'completed' | 'current' | 'upcoming';

export interface StageModule {
  /** What the student actually does. */
  title: string;
  detail: string;
  /** Dimension the module develops. */
  category: string;
  minutes: number;
}

export interface StageRequirement {
  category: string;
  label: string;
  /** Percent of the dimension the stage expects. */
  target: number;
  /** Share of the stage this requirement carries. */
  weight: number;
}

export interface PathwayStage {
  id: StageId;
  name: string;
  summary: string;
  /** Typical point at which this stage is complete. */
  target: number;
  requirements: StageRequirement[];
  /** What the student must produce to show the stage is done. */
  checkpoint: string;
  modules: StageModule[];
  /** The final stage is only awarded after a follow-up assessment. */
  requiresPostAssessment?: boolean;
}

export interface Pathway {
  strandSlug: string;
  code: string;
  name: string;
  tagline: string;
  stages: PathwayStage[];
}

/** One completed or in-progress activity, reduced to what readiness needs. */
export interface ActivityEvidence {
  category: string;
  title: string;
  completed: boolean;
  /** Knowledge-check score out of 100, when the activity has a check. */
  checkScore: number | null;
}

export interface RequirementProgress extends StageRequirement {
  /** Evidence currently standing behind this requirement. */
  percent: number;
  met: boolean;
}

export interface StageProgress {
  stage: PathwayStage;
  status: StageStatus;
  /** Portion of this stage's requirements that are met. */
  percent: number;
  requirements: RequirementProgress[];
  completedActivities: number;
  /** True when assessment evidence alone justified skipping the stage. */
  demonstrated: boolean;
}

export interface DevelopmentNextAction {
  label: string;
  detail: string;
  to: string;
  kind: 'assess' | 'choose' | 'generate' | 'activity' | 'post' | 'review';
}

export interface DevelopmentView {
  pathway: Pathway;
  /** Strand the assessment ranked highest, if any. */
  recommendedSlug: string | null;
  selectedStrand: string;
  /** 0–100: how closely the student's current answers match the chosen strand. */
  currentReadiness: number;
  /** 0–100: how much of the chosen pathway's defined evidence is in place. */
  targetReadiness: number;
  /** The same number with the honest "criteria met" gate applied. */
  progressPercent: number;
  stage: PathwayStage;
  stages: StageProgress[];
  /** Every competency the pathway asks for, best evidence first. */
  competencies: { key: string; label: string; percent: number; target: number }[];
  improvedSkills: { key: string; label: string; percent: number }[];
  skillsToImprove: { key: string; label: string; percent: number; target: number; detail: string }[];
  completedActivities: number;
  remainingActivities: number;
  criteriaMet: string[];
  criteriaRemaining: string[];
  nextAction: DevelopmentNextAction | null;
  transferableSkills: string[];
  activityEvidence: ActivityEvidence[];
}

export interface DevelopmentInput {
  strandSlug: string | null;
  recommendedSlug: string | null;
  /** Category percent from the latest submitted assessment. */
  assessmentPercents: Record<string, number>;
  /** Category percent from the baseline assessment, for "improved" comparisons. */
  baselinePercents?: Record<string, number>;
  activities: ActivityEvidence[];
  hasPostAssessment: boolean;
  hasProgramme: boolean;
  programmeActivities?: { title: string; category: string; status: string; id: number }[];
}
