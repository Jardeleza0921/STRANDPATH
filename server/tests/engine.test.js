import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONNAIRE_V1, STRANDS } from '../content.js';
import { scoreAssessment, validateAnswers, scoreCategories, compareResults, ALGORITHM_VERSION } from '../engine.js';

const questions = QUESTIONNAIRE_V1.questions.map((q, i) => ({
  code: q.code,
  kind: q.kind,
  max_choices: q.maxChoices ?? null,
  weight: q.weight ?? 1,
  section: q.section,
  prompt: q.prompt,
  enabled: 1,
  order_index: i,
  options: q.options.map((o) => ({ code: o.code, label: o.label, scores: o.scores }))
}));

const strands = STRANDS.map((s) => ({
  slug: s.slug,
  code: s.code,
  name: s.name,
  track: s.track,
  weights: s.weights,
  active: 1
}));

export function answerAll(questionsIn, pick = (q, i) => q.options[0].code) {
  const answers = {};
  questionsIn.forEach((q, i) => {
    if (q.kind === 'multi') {
      const max = q.max_choices ?? q.maxChoices ?? 2;
      answers[q.code] = q.options.slice(0, Math.min(max, 2)).map((o) => o.code);
    } else {
      answers[q.code] = [pick(q, i)];
    }
  });
  return answers;
}

test('identical answers produce identical scores and ranking', () => {
  const answers = answerAll(questions);
  const a = scoreAssessment({ questions, strands, answers });
  const b = scoreAssessment({ questions, strands, answers });
  assert.deepEqual(a.categoryScores, b.categoryScores);
  assert.deepEqual(a.ranked.map((r) => [r.slug, r.score]), b.ranked.map((r) => [r.slug, r.score]));
  assert.equal(a.algorithmVersion, ALGORITHM_VERSION);
});

test('all seven strands are ranked exactly once and sorted descending', () => {
  const result = scoreAssessment({ questions, strands, answers: answerAll(questions) });
  assert.equal(result.ranked.length, 7);
  assert.deepEqual([...new Set(result.ranked.map((r) => r.slug))].length, 7);
  for (let i = 1; i < result.ranked.length; i += 1) {
    assert.ok(result.ranked[i - 1].score >= result.ranked[i].score, 'ranking must be descending');
  }
  assert.deepEqual(result.ranked.map((r) => r.rank), [1, 2, 3, 4, 5, 6, 7]);
});

test('scores stay within 0–100 and dimensions stay within 0–1', () => {
  const result = scoreAssessment({ questions, strands, answers: answerAll(questions) });
  for (const category of result.categoryScores) {
    assert.ok(category.normalized >= 0 && category.normalized <= 1, category.key);
    assert.ok(category.percent >= 0 && category.percent <= 100, category.key);
    assert.ok(category.raw <= category.maximum + 1e-9, `${category.key} raw cannot exceed maximum`);
  }
  for (const strand of result.ranked) {
    assert.ok(strand.score >= 0 && strand.score <= 100, strand.slug);
  }
});

test('a technology-heavy profile ranks ICT first; a people-heavy profile ranks HUMSS first', () => {
  const tech = {
    q1: ['build-tech'], q2: ['logic'], q3: ['computer'], q4: ['screen'], q5: ['5'], q6: ['software'],
    q7: ['doing'], q8: ['2'], q9: ['code'], q10: ['employable'], q11: ['5'], q12: ['tech-help'],
    q13: ['high'], q14: ['problem'], q15: ['yes-tech'], q16: ['3'], q17: ['5'], q18: ['2'], q19: ['sub-ict'], q20: ['ready']
  };
  const people = {
    q1: ['write'], q2: ['people'], q3: ['english'], q4: ['community'], q5: ['4'], q6: ['society'],
    q7: ['group'], q8: ['5'], q9: ['volunteer'], q10: ['college'], q11: ['2'], q12: ['talk-help'],
    q13: ['low'], q14: ['help'], q15: ['yes-other'], q16: ['5'], q17: ['4'], q18: ['5'], q19: ['sub-eng'], q20: ['comparing']
  };
  const techResult = scoreAssessment({ questions, strands, answers: tech });
  const peopleResult = scoreAssessment({ questions, strands, answers: people });
  assert.equal(techResult.ranked[0].slug, 'ict');
  assert.equal(peopleResult.ranked[0].slug, 'humss');
  assert.notEqual(techResult.ranked[0].score, peopleResult.ranked[0].score);
});

test('missing and invalid answers are rejected consistently', () => {
  const answers = answerAll(questions);
  delete answers.q3;
  const missing = validateAnswers(questions, answers);
  assert.equal(missing.complete, false);
  assert.deepEqual(missing.missing, ['q3']);
  assert.throws(() => scoreAssessment({ questions, strands, answers }), /Missing responses/);

  const tooMany = { ...answerAll(questions), q1: ['build-tech', 'experiment', 'organise', 'write'] };
  const invalid = validateAnswers(questions, tooMany);
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(' '), /at most 3/);

  const unknown = { ...answerAll(questions), q3: ['not-an-option'] };
  assert.equal(validateAnswers(questions, unknown).ok, false);
});

test('dimension scaling is normalised by the attainable maximum', () => {
  const single = [{
    code: 'x',
    kind: 'single',
    weight: 1,
    enabled: 1,
    options: [
      { code: 'a', label: 'A', scores: { analytical: 3 } },
      { code: 'b', label: 'B', scores: { analytical: 0 } }
    ]
  }];
  const high = scoreCategories(single, { x: ['a'] }).find((c) => c.key === 'analytical');
  const low = scoreCategories(single, { x: ['b'] }).find((c) => c.key === 'analytical');
  assert.equal(high.percent, 100);
  assert.equal(low.percent, 0);
  assert.equal(high.maximum, 3);
});

test('multi-select maximum uses the k highest options, not every option', () => {
  const multi = [{
    code: 'm',
    kind: 'multi',
    max_choices: 1,
    weight: 1,
    enabled: 1,
    options: [
      { code: 'a', label: 'A', scores: { creative: 3 } },
      { code: 'b', label: 'B', scores: { creative: 2 } },
      { code: 'c', label: 'C', scores: { creative: 1 } }
    ]
  }];
  const chosen = scoreCategories(multi, { m: ['a'] }).find((c) => c.key === 'creative');
  assert.equal(chosen.maximum, 3);
  assert.equal(chosen.percent, 100);
});

test('comparison reports only recorded differences', () => {
  const first = scoreAssessment({ questions, strands, answers: answerAll(questions) });
  const changed = answerAll(questions);
  changed.q1 = ['organise'];
  const second = scoreAssessment({ questions, strands, answers: changed });
  const comparison = compareResults(
    { assessmentId: 1, ...first, submittedAt: '2026-01-01T00:00:00.000Z' },
    { assessmentId: 2, ...second, submittedAt: '2026-02-01T00:00:00.000Z' }
  );
  assert.equal(comparison.categories.length, 10);
  assert.equal(comparison.strands.length, 7);
  assert.ok(comparison.categories.every((c) => c.delta !== null));
  assert.match(comparison.note, /do not prove/i);
});
