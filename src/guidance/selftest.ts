/**
 * Self-test for the Strand Assistance engine.
 *
 * Run with `npm run test:guidance`. It builds a real assessment with the shared
 * scoring engine, then asks every documented question and checks the answer's
 * topic, grounding and content. It fails loudly if a supported question starts
 * falling through to the unsupported branch.
 */
import { QUESTIONNAIRE_V1, STRANDS } from '../../shared/content.js';
import { ALGORITHM_VERSION, scoreAssessment } from '../../shared/engine.js';
import { createGuidanceSession, DISCLAIMER, TOPICS } from './engine';
import type { GuidanceAnswer, GuidanceAssessmentSummary, GuidanceContext } from './types';
import { faqKnowledge } from './knowledge';

const answers: Record<string, string[]> = {};
for (const question of QUESTIONNAIRE_V1.questions) {
  answers[question.code] = [question.options[0].code];
}

const scored = scoreAssessment({
  questions: QUESTIONNAIRE_V1.questions,
  strands: STRANDS,
  answers
});

const summary: GuidanceAssessmentSummary = {
  id: 7,
  type: 'pre',
  submittedAt: '2026-11-20T09:00:00.000Z',
  algorithmVersion: ALGORITHM_VERSION,
  questionnaireVersion: QUESTIONNAIRE_V1.version,
  selectedStrand: null,
  topStrand: scored.topStrand
    ? {
        slug: scored.topStrand.slug,
        code: scored.topStrand.code,
        name: scored.topStrand.name,
        score: scored.topStrand.score,
        level: scored.topStrand.level,
        levelLabel: scored.topStrand.levelLabel
      }
    : null,
  ranked: scored.ranked.map((row) => ({
    slug: row.slug,
    code: row.code,
    name: row.name,
    score: row.score,
    level: row.level,
    levelLabel: row.levelLabel,
    rank: row.rank,
    explanation: row.explanation,
    evidence: row.evidence,
    gaps: row.gaps
  })),
  strengths: scored.strengths,
  development: scored.development,
  warnings: scored.warnings,
  categoryScores: scored.categoryScores.map((category) => ({
    key: category.key,
    label: category.label,
    percent: category.percent
  }))
};

const context: GuidanceContext = {
  latest: summary,
  pre: summary,
  post: null,
  selectedStrand: null,
  profile: { gradeLevel: 'Grade 10', school: 'Sample National High School' },
  programme: null,
  development: {
    strandCode: 'ICT',
    stageName: 'Developing',
    currentReadiness: 52,
    targetReadiness: 28,
    progressPercent: 28,
    completedActivities: 2,
    remainingActivities: 4,
    strongest: [{ label: 'Technology & Systems', percent: 72 }],
    weakest: [{ label: 'Numbers & Data', percent: 34, target: 50 }],
    nextAction: {
      label: 'Trace how a page loads',
      detail: 'Developing · continue the next unfinished activity in your plan.'
    },
    transferableSkills: ['Technology & Systems', 'Communication & Language']
  }
};

const failures: string[] = [];
let checks = 0;

function assert(condition: unknown, message: string): void {
  checks += 1;
  if (!condition) failures.push(message);
}

function answerText(answer: GuidanceAnswer): string {
  return [answer.title, ...answer.paragraphs, ...(answer.points ?? []).map((point) => `${point.label} ${point.text}`)]
    .join(' ')
    .toLowerCase();
}

function expect(
  session: ReturnType<typeof createGuidanceSession>,
  question: string,
  topic: string,
  options: { includes?: string[]; grounded?: boolean; unsupported?: boolean } = {}
): GuidanceAnswer {
  const answer = session.ask(question);
  assert(answer.topic === topic, `"${question}" → expected topic ${topic}, got ${answer.topic}`);
  assert(answer.paragraphs.length > 0, `"${question}" returned no paragraphs`);
  assert(answer.suggestions.length > 0, `"${question}" returned no suggestions`);
  const text = answerText(answer);
  for (const phrase of options.includes ?? []) {
    assert(text.includes(phrase.toLowerCase()), `"${question}" did not mention ${phrase}`);
  }
  if (options.grounded !== undefined) {
    assert(answer.groundedOnAssessment === options.grounded, `"${question}" grounding expected ${options.grounded}`);
  }
  if (options.unsupported !== undefined) {
    assert(Boolean(answer.unsupported) === options.unsupported, `"${question}" unsupported flag expected ${options.unsupported}`);
  }
  assert(!text.includes('undefined'), `"${question}" leaked "undefined"`);
  return answer;
}

/* ---- every documented question --------------------------------------- */

{
  const session = createGuidanceSession(context);
  expect(session, 'What strand is suitable for me?', 'fit', { grounded: true });
  const why = session.ask('Why was this strand recommended to me?');
  assert(why.topic === 'why', `why question → ${why.topic}`);
  assert(why.groundedOnAssessment, 'why question is not grounded on the assessment');
  assert(
    answerText(why).includes((summary.topStrand?.code ?? '').toLowerCase()),
    'why question did not name the top strand'
  );

  expect(session, 'What is the difference between STEM and ICT?', 'compare', { includes: ['STEM', 'ICT'] });
  expect(session, 'What college courses can I take after ICT?', 'programs', {
    includes: ['Information Technology']
  });
  expect(session, 'What careers are related to HUMSS?', 'careers', { includes: ['HUMSS'] });
  expect(session, 'What skills should I improve?', 'skills', { grounded: true });
  expect(session, 'I am still undecided. Can you help me?', 'faq-undecided');
  expect(session, 'What other options do I have?', 'alternatives', { grounded: true });
  expect(session, 'What should I do next?', 'next');
  expect(session, 'What is in my improvement plan?', 'plan');
  expect(session, 'How does STRANDPATH compute my recommendation?', 'faq-how-recommendation-works');
  expect(session, 'What specialisations does TVL have?', 'faq-tvl-specialisations');
  expect(session, 'What is the difference between a track and a strand?', 'faq-strand-vs-track', {
    includes: ['track', 'strand']
  });
  expect(session, 'Where is my data stored?', 'faq-privacy');
  expect(session, 'Does every school offer every strand?', 'faq-school-offerings');
  expect(session, 'Should I go to college or start working after Grade 12?', 'faq-college-vs-work');
  expect(session, 'What can I do after HUMSS?', 'careers', { includes: ['HUMSS'] });
  expect(session, 'I feel overwhelmed by this decision.', 'faq-emotional-support');
  expect(session, 'What is the weather tomorrow?', 'unsupported', { unsupported: true });
}

/* ---- adaptive development answers -------------------------------------- */

{
  const session = createGuidanceSession(context);
  const readiness = expect(session, 'How ready am I for my chosen strand?', 'readiness', {
    includes: ['Developing', 'ICT']
  });
  assert(answerText(readiness).includes('100%'), 'readiness answer should explain what 100% means');

  const stuck = expect(session, 'I am stuck on this topic. Can you explain it more simply?', 'struggle', {
    includes: ['Numbers & Data']
  });
  assert(answerText(stuck).includes('step'), 'struggle answer should break the topic into steps');

  const different = session.ask('Explain it in a different way');
  assert(different.topic === 'struggle', `repeated struggle answer got topic ${different.topic}`);
  assert(
    different.title !== stuck.title,
    'the second struggle answer repeated the same explanation instead of changing approach'
  );

  const challenge = expect(session, 'This is too easy for me. Can you give me a harder challenge?', 'challenge', {
    includes: ['technology']
  });
  assert(answerText(challenge).includes('constraint'), 'challenge answer should raise a constraint');

  const discouraged = expect(session, 'I give up. I am not smart enough for this.', 'discouraged');
  assert(
    !answerText(discouraged).includes('everything is easy'),
    'discouraged answer should not falsely claim the work is easy'
  );
  assert(answerText(discouraged).includes('guidance office'), 'discouraged answer should point to a person');

  const switching = createGuidanceSession({ ...context, selectedStrand: 'ict' });
  expect(switching, 'I want to switch to HUMSS', 'switch', { includes: ['ICT', 'HUMSS'] });
  expect(switching, 'What is transferable if I change strand?', 'switch', { includes: ['Technology & Systems'] });
}

/* ---- the "computers but not maths" case ------------------------------ */

{
  const session = createGuidanceSession(context);
  const answer = expect(
    session,
    'I like computers, but I am not good at mathematics. What should I consider?',
    'fit',
    { includes: ['ICT', 'mathematics'] }
  );
  assert(answer.title.length > 0, 'fit answer has no title');
}

/* ---- alternatives when a strand is selected -------------------------- */

{
  const selected = createGuidanceSession({ ...context, selectedStrand: 'ict' });
  expect(selected, 'What careers fit my strand?', 'careers');
  expect(selected, 'What should I do next?', 'next');
  const fit = selected.ask('What strand is suitable for me?');
  assert(fit.groundedOnAssessment, 'fit answer should use the assessment');
}

/* ---- no assessment: honest, still useful ----------------------------- */

{
  const fresh = createGuidanceSession({ latest: null, profile: null, programme: null });
  const fit = expect(fresh, 'What strand is suitable for me?', 'fit', { grounded: false });
  assert(
    answerText(fit).includes('interest') || answerText(fit).includes('enjoy'),
    'no-assessment fit answer should ask about interests'
  );
  expect(fresh, 'Why was my top strand recommended?', 'why', { grounded: false });
  expect(fresh, 'What careers are related to ICT?', 'careers');
  const help = fresh.ask('What skills should I improve?');
  assert(!help.groundedOnAssessment, 'skills answer should not claim assessment grounding when none exists');
}

/* ---- follow-up context ----------------------------------------------- */

{
  const session = createGuidanceSession(context);
  session.ask('Compare STEM');
  const second = session.ask('ICT');
  assert(second.topic === 'compare', `follow-up comparison answered with ${second.topic}`);
  const third = session.ask('What careers are related to it?');
  assert(third.topic === 'careers', 'follow-up careers question should use context');
}

/* ---- every shortcut chip resolves ------------------------------------ */

for (const topic of TOPICS) {
  const session = createGuidanceSession(context);
  const answer = session.ask(topic.prompt);
  assert(answer.topic !== 'unsupported', `shortcut "${topic.label}" fell through to unsupported`);
}

/* ---- every FAQ entry is reachable directly --------------------------- */

for (const faq of faqKnowledge) {
  const session = createGuidanceSession(context);
  const answer = session.ask(faq.question);
  assert(answer.topic !== 'unsupported', `FAQ "${faq.question}" fell through to unsupported`);
  assert(answer.paragraphs.length > 0, `FAQ "${faq.question}" has no paragraphs`);
}

/* ---- transparency ----------------------------------------------------- */

{
  const session = createGuidanceSession(context);
  const why = session.ask('Why was my top strand recommended?');
  assert(why.sources.length >= 2, 'why answer should cite the assessment and the knowledge base');
  assert(why.sources.some((source) => source.label.toLowerCase().includes('assessment')), 'why answer lacks an assessment source');
}

assert(DISCLAIMER.toLowerCase().includes('not a psychological assessment'), 'disclaimer is missing its limits');
assert(scored.ranked.length === STRANDS.length, 'scoring did not rank every strand');

if (failures.length) {
  console.error(`Guidance self-test failed (${failures.length} of ${checks} checks):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Guidance self-test passed: ${checks} checks across ${TOPICS.length} topics, ${faqKnowledge.length} FAQ entries and ${STRANDS.length} strands.`);
}
