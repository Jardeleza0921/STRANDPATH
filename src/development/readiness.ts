/**
 * Readiness and progression calculations.
 *
 * Two measurements are deliberately kept apart:
 *
 *  - Current readiness: the alignment index from the student's latest submitted
 *    assessment. It describes how their answers line up with the strand today.
 *  - Target readiness: the portion of the chosen pathway's defined requirements
 *    that is backed by evidence — assessment answers plus completed activities
 *    and knowledge-check scores.
 *
 * Completing an activity alone never awards an assessment score. A completed
 * activity with a knowledge check contributes that check's score, capped below
 * the top of the scale; an activity without a check contributes participation
 * evidence capped at 45%. The higher of assessment and practice evidence is
 * used per dimension, so practice can only fill a gap the assessment left, and
 * 100% additionally requires every stage checkpoint and a follow-up assessment.
 */
import { CATEGORIES, STRANDS } from '../../shared/content.js';
import { getPathway } from './pathways';
import type {
  DevelopmentInput,
  DevelopmentNextAction,
  DevelopmentView,
  RequirementProgress,
  StageProgress
} from './types';

const PRACTICE_WITH_CHECK_CAP = 90;
const PRACTICE_WITHOUT_CHECK = 45;
const MASTERY_EXEMPTION = 15;

type CategoryInfo = { label: string; developing?: string };

function categoryLabel(category: string): string {
  return (CATEGORIES as Record<string, CategoryInfo>)[category]?.label ?? category;
}

function categoryDeveloping(category: string): string {
  return (
    (CATEGORIES as Record<string, CategoryInfo>)[category]?.developing ??
    'practising this deliberately with short, finished work'
  );
}

function round(value: number): number {
  return Math.round(value);
}

/** Evidence for one dimension, from the assessment and from completed practice. */
export function evidenceFor(category: string, input: DevelopmentInput): number {
  const assessment = input.assessmentPercents[category] ?? 0;
  const completed = input.activities.filter((activity) => activity.completed && activity.category === category);
  const checked = completed.filter((activity) => typeof activity.checkScore === 'number');
  let practice = 0;
  if (checked.length) {
    const best = Math.max(...checked.map((activity) => activity.checkScore ?? 0));
    practice = Math.min(PRACTICE_WITH_CHECK_CAP, best + (checked.length >= 2 ? 3 : 0));
  } else if (completed.length) {
    practice = PRACTICE_WITHOUT_CHECK;
  }
  return round(Math.max(assessment, practice));
}

function strandWeights(slug: string): Record<string, number> {
  return STRANDS.find((strand) => strand.slug === slug)?.weights ?? {};
}

/** Weighted alignment of the assessment answers with the chosen strand. */
export function currentReadinessFor(slug: string, assessmentPercents: Record<string, number>): number {
  const weights = strandWeights(slug);
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (!total) return 0;
  const weighted = entries.reduce((sum, [category, weight]) => sum + (assessmentPercents[category] ?? 0) * weight, 0);
  return round(weighted / total);
}

export function buildDevelopmentView(input: DevelopmentInput): DevelopmentView | null {
  const pathway = getPathway(input.strandSlug);
  if (!pathway) return null;

  const hasPost = input.hasPostAssessment;
  const finalTarget = pathway.stages[pathway.stages.length - 1].target;
  const stages: StageProgress[] = pathway.stages.map((stage) => {
    const requirements: RequirementProgress[] = stage.requirements.map((requirement) => {
      const percent = evidenceFor(requirement.category, input);
      return { ...requirement, percent, met: percent >= requirement.target };
    });

    const completedActivities = input.activities.filter(
      (activity) =>
        activity.completed && stage.requirements.some((requirement) => requirement.category === activity.category)
    ).length;

    const allMet = requirements.every((requirement) => requirement.met);
    const demonstrated =
      stage.requirements.every((requirement) => evidenceFor(requirement.category, input) >= requirement.target + MASTERY_EXEMPTION);
    const practiceMet = completedActivities > 0 || demonstrated;
    const postMet = !stage.requiresPostAssessment || hasPost;

    // Partial credit is measured toward the final readiness threshold, not the
    // stage's own lower bar, so a 30% profile does not read as "80% through
    // Foundation". A completed stage always shows 100%.
    const earned = stage.requirements.reduce(
      (sum, requirement) =>
        sum + requirement.weight * Math.min(evidenceFor(requirement.category, input), finalTarget),
      0
    );
    const possible =
      stage.requirements.reduce((sum, requirement) => sum + requirement.weight * finalTarget, 0) || 1;
    const completed = allMet && practiceMet && postMet;
    let percent = (earned / possible) * 100;
    if (completed) percent = 100;
    else if (!practiceMet) percent = Math.min(percent, 90);
    else percent = Math.min(percent, 95);

    return {
      stage,
      status: completed ? 'completed' : 'upcoming',
      percent: round(Math.min(100, percent)),
      requirements,
      completedActivities,
      demonstrated
    };
  });

  const firstIncomplete = stages.findIndex((stage) => stage.status !== 'completed');
  stages.forEach((stage, index) => {
    if (stage.status === 'completed') return;
    stage.status = index === firstIncomplete ? 'current' : 'upcoming';
  });
  const current = stages[firstIncomplete === -1 ? stages.length - 1 : firstIncomplete];
  if (firstIncomplete === -1) stages[stages.length - 1].status = 'completed';

  const earnedOverall = stages.reduce((sum, stage) => sum + stage.percent, 0);
  const possibleOverall = (stages.length || 1) * 100;

  const completedActivities = input.activities.filter((activity) => activity.completed).length;
  const remainingActivities = input.programmeActivities
    ? input.programmeActivities.filter((activity) => activity.status !== 'completed').length
    : 0;

  const criteriaMet: string[] = [];
  const criteriaRemaining: string[] = [];
  for (const stage of stages) {
    const label = `${stage.stage.name} checkpoint`;
    if (stage.status === 'completed') criteriaMet.push(label);
    else criteriaRemaining.push(label);
  }
  if (hasPost) criteriaMet.push('A submitted follow-up assessment');
  else criteriaRemaining.push('A submitted follow-up assessment');

  const allComplete = stages.every((stage) => stage.status === 'completed');
  const progressPercent = allComplete && hasPost ? 100 : Math.min(99, round((earnedOverall / possibleOverall) * 100));

  // Competency view: best evidence for each dimension the pathway asks for.
  const seen = new Set<string>();
  const competencies: DevelopmentView['competencies'] = [];
  for (const stage of stages) {
    for (const requirement of stage.requirements) {
      if (seen.has(requirement.category)) continue;
      seen.add(requirement.category);
      competencies.push({
        key: requirement.category,
        label: categoryLabel(requirement.category),
        percent: evidenceFor(requirement.category, input),
        target: pathway.stages[2].requirements.find((row) => row.category === requirement.category)?.target ?? 65
      });
    }
  }
  competencies.sort((a, b) => b.percent - a.percent);

  // Pathway evidence is the strand-weighted average of the dimension evidence,
  // independent of stage completion. It answers "how much evidence exists?"
  // while progressPercent answers "how many defined checkpoints are met?".
  const weights = strandWeights(pathway.strandSlug);
  const weightTotal = competencies.reduce((sum, competency) => sum + (weights[competency.key] ?? 0), 0);
  const targetReadiness = weightTotal
    ? round(
        competencies.reduce(
          (sum, competency) => sum + competency.percent * (weights[competency.key] ?? 0),
          0
        ) / weightTotal
      )
    : round(competencies.reduce((sum, competency) => sum + competency.percent, 0) / (competencies.length || 1));

  // Only genuine gains are reported. A dimension at the same level as the
  // baseline (or as its own assessment evidence) is not an improvement.
  const improvedSkills = competencies
    .map((competency) => {
      const baseline = input.baselinePercents?.[competency.key];
      const gain =
        baseline !== undefined
          ? competency.percent - baseline
          : competency.percent - (input.assessmentPercents[competency.key] ?? 0);
      return { key: competency.key, label: competency.label, percent: round(gain) };
    })
    .filter((competency) => competency.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  const skillsToImprove = competencies
    .filter((competency) => competency.percent < competency.target)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3)
    .map((competency) => ({
      key: competency.key,
      label: competency.label,
      percent: competency.percent,
      target: competency.target,
      detail: categoryDeveloping(competency.key)
    }));

  const transferableSkills = [
    ...new Set(
      input.activities
        .filter((activity) => activity.completed)
        .filter((activity) => pathway.stages.some((stage) => stage.requirements.some((row) => row.category === activity.category)))
        .map((activity) => categoryLabel(activity.category))
    )
  ].slice(0, 4);

  let nextAction: DevelopmentNextAction | null = null;
  const nextProgrammeActivity = input.programmeActivities?.find(
    (activity) =>
      activity.status !== 'completed' &&
      (current.stage.requirements.some((requirement) => requirement.category === activity.category) ||
        current.status === 'current')
  );
  if (!hasPost && allComplete) {
    nextAction = {
      kind: 'post',
      label: 'Take the follow-up assessment',
      detail: 'Your pathway checkpoints are recorded. A follow-up assessment is the last piece of evidence and updates your readiness honestly.',
      to: '/app/post-assessment'
    };
  } else if (!input.hasProgramme) {
    nextAction = {
      kind: 'generate',
      label: `Build your ${pathway.code} development plan`,
      detail: 'Your plan is generated from this pathway and your assessment, starting at your current level rather than at lesson one.',
      to: '/app/program'
    };
  } else if (nextProgrammeActivity) {
    nextAction = {
      kind: 'activity',
      label: nextProgrammeActivity.title,
      detail: `${current.stage.name} · continue the next unfinished activity in your plan.`,
      to: `/app/program/activities/${nextProgrammeActivity.id}`
    };
  } else if (!hasPost) {
    nextAction = {
      kind: 'post',
      label: 'Reassess your progress',
      detail: 'All current activities are complete. A follow-up assessment compares your answers with your baseline; it cannot prove an activity caused a change.',
      to: '/app/post-assessment'
    };
  } else {
    nextAction = {
      kind: 'review',
      label: 'Review your pathway evidence',
      detail: 'Compare your baseline with your latest attempt and decide what to practise next.',
      to: '/app/progress'
    };
  }

  return {
    pathway,
    recommendedSlug: input.recommendedSlug,
    selectedStrand: pathway.strandSlug,
    currentReadiness: currentReadinessFor(pathway.strandSlug, input.assessmentPercents),
    targetReadiness,
    progressPercent,
    stage: current.stage,
    stages,
    competencies,
    improvedSkills,
    skillsToImprove,
    completedActivities,
    remainingActivities,
    criteriaMet,
    criteriaRemaining,
    nextAction,
    transferableSkills,
    activityEvidence: input.activities
  };
}

/** Human explanation of what 100% does and does not mean. */
export const READINESS_MEANING =
  '100% means every checkpoint in this pathway has evidence and you have submitted a follow-up assessment. It is not a guarantee of college admission, academic success or professional competence, and it is not a psychological classification of your ability.';

export const EVIDENCE_NOTE =
  'Evidence comes from two places: your assessment answers for each dimension, and completed activities with their knowledge-check scores. Finishing an activity without a check records participation only. Your scores are never increased just because you completed something.';
