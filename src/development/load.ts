/**
 * Assembles the development view from the same API the rest of the student
 * application uses, so it works identically in static mode and against the
 * optional Node backend.
 */
import { api } from '../lib/api';
import { CATEGORIES } from '../../shared/content.js';
import type { Assessment, AssessmentSummary, DashboardData, Programme } from '../types/api';
import type { ActivityEvidence } from './types';
import { buildDevelopmentView } from './readiness';
import type { DevelopmentView } from './types';

interface ProgressActivity {
  programId: number;
  programName: string;
  title: string;
  category: string;
  completedAt: string;
  checkScore: number | null;
}

interface ProgressResponse {
  completedActivities: ProgressActivity[];
}

export interface DevelopmentBundle {
  dashboard: DashboardData;
  programme: Programme | null;
  latest: Assessment | null;
  baseline: Assessment | null;
  view: DevelopmentView | null;
}

function categoryKeyFromLabel(label: string): string {
  const entry = Object.entries(CATEGORIES as Record<string, { label: string }>).find(
    ([, value]) => value.label === label
  );
  return entry?.[0] ?? label.toLowerCase();
}

async function fetchAssessment(id: number): Promise<Assessment | null> {
  try {
    const data = await api.get<{ assessment: Assessment }>(`/assessments/${id}`);
    return data.assessment;
  } catch {
    return null;
  }
}

export async function loadDevelopment(): Promise<DevelopmentBundle> {
  const [dashboard, programData, list, progress] = await Promise.all([
    api.get<DashboardData>('/dashboard'),
    api.get<{ program: Programme | null }>('/programs/current').catch(() => ({ program: null })),
    api.get<{ assessments: AssessmentSummary[] }>('/assessments'),
    api.get<ProgressResponse>('/progress').catch(() => ({ completedActivities: [] as ProgressActivity[] }))
  ]);

  const programme = programData.program ?? dashboard.program ?? null;
  const submitted = list.assessments.filter((assessment) => assessment.status === 'submitted');
  const latestId = submitted[0]?.id;
  const preId = [...submitted].reverse().find((assessment) => assessment.type === 'pre')?.id;

  const [latest, baseline] = await Promise.all([
    latestId ? fetchAssessment(latestId) : Promise.resolve(null),
    preId && preId !== latestId ? fetchAssessment(preId) : Promise.resolve(null)
  ]);

  const assessmentPercents: Record<string, number> = {};
  for (const category of latest?.categoryScores ?? []) {
    assessmentPercents[category.key] = category.percent;
  }
  const baselinePercents: Record<string, number> = {};
  for (const category of baseline?.categoryScores ?? []) {
    baselinePercents[category.key] = category.percent;
  }

  const evidence = new Map<string, ActivityEvidence>();
  for (const activity of progress.completedActivities) {
    evidence.set(`${activity.title}::${activity.category}`, {
      title: activity.title,
      category: categoryKeyFromLabel(activity.category),
      completed: true,
      checkScore: activity.checkScore
    });
  }
  for (const activity of programme?.activities ?? []) {
    evidence.set(`${activity.title}::${activity.targetCategoryLabel}`, {
      title: activity.title,
      category: activity.targetCategory,
      completed: activity.status === 'completed',
      checkScore: activity.checkScore
    });
  }

  const hasPostAssessment = submitted.some((assessment) => assessment.type === 'post');
  const recommendedSlug =
    latest?.ranked?.[0]?.slug ?? dashboard.assessment.latestPre?.ranked?.[0]?.slug ?? null;
  const strandSlug = dashboard.selectedStrand ?? latest?.selectedStrand ?? null;

  const view = buildDevelopmentView({
    strandSlug,
    recommendedSlug,
    assessmentPercents,
    baselinePercents,
    activities: [...evidence.values()],
    hasPostAssessment,
    hasProgramme: Boolean(programme),
    programmeActivities: programme?.activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      category: activity.targetCategory,
      status: activity.status
    }))
  });

  return { dashboard, programme, latest, baseline, view };
}
