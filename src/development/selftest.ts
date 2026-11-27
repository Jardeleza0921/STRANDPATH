/**
 * Self-test for the development pathway, readiness and progression model.
 *
 * Run with `npm run test:development`. It exercises the assessment→development
 * transition, choosing a strand outside the top recommendation, evidence-based
 * progress, mastery skipping, post-assessment gating and strand changes.
 */
import { buildDevelopmentView } from './readiness';
import { getPathway, PATHWAYS } from './pathways';
import type { ActivityEvidence, DevelopmentInput } from './types';
import { STRANDS } from '../../shared/content.js';

const failures: string[] = [];
let checks = 0;

function assert(condition: unknown, message: string): void {
  checks += 1;
  if (!condition) failures.push(message);
}

const allCategories = [
  'scientific',
  'analytical',
  'numerical',
  'technical',
  'creative',
  'communication',
  'social',
  'enterprise',
  'practical',
  'persistence'
];

function flat(percent: number): Record<string, number> {
  return Object.fromEntries(allCategories.map((key) => [key, percent]));
}

function baseInput(overrides: Partial<DevelopmentInput> = {}): DevelopmentInput {
  return {
    strandSlug: 'ict',
    recommendedSlug: 'humss',
    assessmentPercents: flat(30),
    baselinePercents: flat(20),
    activities: [],
    hasPostAssessment: false,
    hasProgramme: false,
    programmeActivities: [],
    ...overrides
  };
}

/* ---- every strand has a complete five-stage pathway ------------------- */

for (const pathway of PATHWAYS) {
  assert(pathway.stages.length === 5, `${pathway.code} does not have five stages`);
  assert(
    pathway.stages.map((stage) => stage.id).join(',') === 'foundation,developing,competence,advanced,target',
    `${pathway.code} has the wrong stage order`
  );
  for (const stage of pathway.stages) {
    assert(stage.requirements.length > 0, `${pathway.code} ${stage.name} has no requirements`);
    assert(stage.modules.length > 0, `${pathway.code} ${stage.name} has no modules`);
    for (const requirement of stage.requirements) {
      assert(
        typeof requirement.target === 'number' && requirement.target > 0 && requirement.target <= 100,
        `${pathway.code} ${stage.name} has an invalid target`
      );
    }
  }
  assert(pathway.stages[4].requiresPostAssessment === true, `${pathway.code} final stage is not gated on a post-assessment`);
}

/* ---- a low match does not reject the student -------------------------- */

{
  const view = buildDevelopmentView(baseInput());
  assert(view !== null, 'a selected strand did not produce a development view');
  if (view) {
    assert(view.stage.id === 'foundation', `low evidence should start at Foundation, got ${view.stage.id}`);
    assert(view.currentReadiness < 40, 'current readiness did not reflect low assessment answers');
    assert(view.progressPercent <= 40, `pathway progress was inflated for an empty pathway (${view.progressPercent}%)`);
    assert(view.progressPercent > 0, 'pathway progress ignored baseline evidence entirely');
    assert(view.nextAction?.kind === 'generate', 'a student without a plan should be offered plan generation');
    assert(view.selectedStrand === 'ict', 'selected strand was not kept');
    assert(view.recommendedSlug === 'humss', 'recommended strand was not kept separate');
    assert(view.skillsToImprove.length > 0, 'a low-evidence pathway should name skills to improve');
  }
}

/* ---- choosing a strand outside the top recommendation is supported ---- */

{
  const view = buildDevelopmentView(baseInput({ strandSlug: 'stem', recommendedSlug: 'abm', assessmentPercents: flat(25) }));
  assert(view !== null, 'choosing a non-top strand returned no view');
  if (view) {
    assert(view.pathway.strandSlug === 'stem', 'the chosen strand was replaced by the recommendation');
    assert(view.recommendedSlug === 'abm', 'the original recommendation was lost');
    assert(view.transferableSkills.length === 0, 'empty activity history should not claim transferable skills');
  }
}

/* ---- activity evidence raises readiness only through check scores ----- */

{
  const withoutCheck: ActivityEvidence = { title: 'Practice', category: 'technical', completed: true, checkScore: null };
  const withCheck: ActivityEvidence = { title: 'Checked practice', category: 'technical', completed: true, checkScore: 82 };
  const participation = buildDevelopmentView(baseInput({ activities: [withoutCheck] }));
  const demonstrated = buildDevelopmentView(baseInput({ activities: [withCheck] }));
  assert(participation && demonstrated, 'activity evidence did not produce views');
  if (participation && demonstrated) {
    const participationStage = participation.stages[0].requirements.find((row) => row.category === 'technical');
    const demonstratedStage = demonstrated.stages[0].requirements.find((row) => row.category === 'technical');
    assert(
      (participationStage?.percent ?? 0) < (demonstratedStage?.percent ?? 0),
      'a knowledge-check score should count for more than participation alone'
    );
    assert((demonstratedStage?.percent ?? 0) <= 90, 'a check score should not exceed the practice evidence cap');
  }
  const assessmentHigh = buildDevelopmentView(
    baseInput({ assessmentPercents: { ...flat(30), technical: 75 }, activities: [withoutCheck] })
  );
  const technical = assessmentHigh?.stages[0].requirements.find((row) => row.category === 'technical');
  assert((technical?.percent ?? 0) >= 75, 'practice evidence must not lower assessment evidence');
}

/* ---- mastery lets a student skip redundant stages ---------------------- */

{
  const view = buildDevelopmentView(
    baseInput({ strandSlug: 'ict', assessmentPercents: flat(95), hasProgramme: true, activities: [] })
  );
  assert(view !== null, 'mastery case produced no view');
  if (view) {
    const foundation = view.stages[0];
    assert(foundation.status === 'completed', 'mastery did not complete the Foundation stage');
    assert(foundation.demonstrated, 'mastery completion was not marked as demonstrated');
    assert(view.stage.id !== 'foundation', 'a mastered student was placed back at Foundation');
    assert(view.progressPercent <= 99, 'pathway progress reached 100 without a post-assessment');
    assert(view.criteriaRemaining.some((item) => item.toLowerCase().includes('follow-up')), 'missing post-assessment was not listed');
  }
}

/* ---- a complete pathway reaches 100% only with every checkpoint -------- */

{
  const activities: ActivityEvidence[] = allCategories.map((category) => ({
    title: `${category} checkpoint`,
    category,
    completed: true,
    checkScore: 95
  }));
  const input = baseInput({
    strandSlug: 'humss',
    assessmentPercents: flat(85),
    activities,
    hasPostAssessment: true,
    hasProgramme: true,
    programmeActivities: [{ id: 1, title: 'Done', category: 'communication', status: 'completed' }]
  });
  const view = buildDevelopmentView(input);
  assert(view !== null, 'complete case produced no view');
  if (view) {
    assert(view.stages.every((stage) => stage.status === 'completed'), 'not every stage completed with full evidence');
    assert(view.progressPercent === 100, `complete evidence should reach 100, got ${view.progressPercent}`);
    assert(view.criteriaRemaining.length === 0, 'criteria remaining should be empty at 100%');
    assert(view.nextAction?.kind === 'review', 'a complete pathway should offer a review step');
  }
}

/* ---- progress cannot reach 100% without a post-assessment -------------- */

{
  const activities: ActivityEvidence[] = allCategories.map((category) => ({
    title: `${category} checkpoint`,
    category,
    completed: true,
    checkScore: 95
  }));
  const view = buildDevelopmentView(baseInput({ assessmentPercents: flat(85), activities, hasProgramme: true }));
  assert(view !== null, 'no view without post-assessment');
  if (view) {
    assert(view.progressPercent <= 99, 'progress reached 100 without a follow-up assessment');
    assert(!view.stages.every((stage) => stage.status === 'completed'), 'final stage completed without a follow-up');
    assert(view.nextAction?.kind === 'post', 'the next action should be the follow-up assessment');
  }
}

/* ---- plans start at the right activity and keep counting -------------- */

{
  const view = buildDevelopmentView(
    baseInput({
      strandSlug: 'abm',
      assessmentPercents: { ...flat(40), enterprise: 62, numerical: 58 },
      hasProgramme: true,
      activities: [{ title: 'Budget', category: 'numerical', completed: false, checkScore: null }],
      programmeActivities: [
        { id: 11, title: 'Budget a school week', category: 'numerical', status: 'not_started' },
        { id: 12, title: 'Cost it out', category: 'enterprise', status: 'completed' }
      ]
    })
  );
  assert(view !== null, 'plan case produced no view');
  if (view) {
    assert(view.nextAction?.kind === 'activity', 'an unfinished activity should be the next action');
    assert(view.nextAction?.to === '/app/program/activities/11', 'next action did not link to the activity');
    assert(view.remainingActivities === 1, `remaining activities should be 1, got ${view.remainingActivities}`);
  }
}

/* ---- strand changes reuse transferable evidence ----------------------- */

{
  const activities: ActivityEvidence[] = [
    { title: 'Debug routine', category: 'persistence', completed: true, checkScore: 70 },
    { title: 'Budget', category: 'numerical', completed: true, checkScore: 75 }
  ];
  const ict = buildDevelopmentView(baseInput({ strandSlug: 'ict', activities }));
  const abm = buildDevelopmentView(baseInput({ strandSlug: 'abm', activities }));
  assert(ict && abm, 'strand change produced no views');
  if (ict && abm) {
    assert(abm.transferableSkills.some((skill) => skill.toLowerCase().includes('number')), 'ABM did not reuse the numeric practice');
    const abmNumeric = abm.competencies.find((row) => row.key === 'numerical');
    assert((abmNumeric?.percent ?? 0) >= 70, 'transferable evidence was not used in the new pathway');
  }
}

/* ---- no strand means no fabricated pathway ---------------------------- */

assert(buildDevelopmentView(baseInput({ strandSlug: null })) === null, 'a missing strand produced a pathway');
assert(getPathway('unknown-strand') === null, 'an unknown strand resolved to a pathway');
assert(STRANDS.length === PATHWAYS.length, 'not every strand has a pathway');
assert(new Set(PATHWAYS.map((pathway) => pathway.strandSlug)).size === PATHWAYS.length, 'duplicate pathway definitions');

if (failures.length) {
  console.error(`Development self-test failed (${failures.length} of ${checks} checks):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Development self-test passed: ${checks} checks across ${PATHWAYS.length} strand pathways.`);
}
