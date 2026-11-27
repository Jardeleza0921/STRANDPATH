import { CATEGORIES, CATEGORY_KEYS } from './content.js';

/**
 * Deterministic recommendation engine.
 *
 * Scores are computed only from the submitted answers and the questionnaire /
 * strand definitions stored with the assessment. No randomness, no AI, and no
 * hard-coded per-student outcomes.
 *
 * v1.0 model (documented in README):
 * - Each option contributes points (0–3) to one or more dimensions.
 * - Dimension raw score = Σ(option points × item weight) for answered items.
 * - Dimension maximum = Σ(item weight × best attainable points for that
 *   dimension). For a multi-select item limited to k choices this is the sum of
 *   the k highest option values for that dimension. This is an upper bound per
 *   dimension, so scaled scores are conservative.
 * - Scaled score = raw / maximum, clamped to 0–1.
 * - Strand compatibility = 100 × Σ(scaled score × strand weight), where strand
 *   weights sum to 1. It is an alignment index, never a probability.
 */

export const ALGORITHM_VERSION = 'strandpath-fit-1.0.0';

export const MATCH_LEVELS = [
  { level: 'strong', min: 60, label: 'Strong alignment' },
  { level: 'good', min: 48, label: 'Good alignment' },
  { level: 'possible', min: 38, label: 'Some alignment' },
  { level: 'exploratory', min: 0, label: 'Worth exploring' }
];

const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const round1 = (n) => Math.round(n * 10) / 10;

export function levelFor(score) {
  return MATCH_LEVELS.find((m) => score >= m.min) ?? MATCH_LEVELS[MATCH_LEVELS.length - 1];
}

export function labelFor(category) {
  return CATEGORIES[category]?.label ?? category;
}

/** Normalise a question as stored in the DB (options.scores may be an object). */
function normaliseQuestions(questions) {
  return questions
    .filter((q) => q.enabled !== false && q.enabled !== 0)
    .map((q) => ({
      code: q.code,
      kind: q.kind,
      maxChoices: q.max_choices ?? q.maxChoices ?? null,
      weight: Number(q.weight ?? 1),
      prompt: q.prompt,
      section: q.section,
      options: (q.options ?? []).map((o) => ({
        code: o.code,
        label: o.label,
        scores: typeof o.scores === 'string' ? JSON.parse(o.scores || '{}') : o.scores ?? {}
      }))
    }));
}

/**
 * Validate answers against the questionnaire.
 * Returns the cleaned answers plus any problems; incomplete submissions are
 * rejected by the API so every stored result is reproducible.
 */
export function validateAnswers(questions, answers) {
  const normalised = normaliseQuestions(questions);
  const clean = {};
  const errors = [];
  const missing = [];
  const answered = [];

  for (const q of normalised) {
    const raw = answers?.[q.code];
    const selected = Array.isArray(raw) ? raw.filter((v) => typeof v === 'string') : [];
    const optionsByCode = new Map(q.options.map((o) => [o.code, o]));
    const valid = [...new Set(selected)].filter((code) => optionsByCode.has(code));
    if (valid.length !== selected.length) {
      errors.push(`${q.code}: contains an answer that is not a valid option`);
      continue;
    }
    if (valid.length === 0) {
      missing.push(q.code);
      continue;
    }
    if (q.kind !== 'multi' && valid.length > 1) {
      errors.push(`${q.code}: only one answer is allowed`);
      continue;
    }
    if (q.kind === 'multi' && q.maxChoices && valid.length > q.maxChoices) {
      errors.push(`${q.code}: choose at most ${q.maxChoices}`);
      continue;
    }
    clean[q.code] = valid;
    answered.push(q.code);
  }

  return {
    ok: errors.length === 0,
    complete: missing.length === 0,
    errors,
    missing,
    answers: clean,
    answeredCount: answered.length,
    total: normalised.length
  };
}

function bestAttainable(q, category) {
  const values = q.options
    .map((o) => Number(o.scores?.[category] ?? 0))
    .sort((a, b) => b - a);
  if (q.kind === 'multi') {
    const k = q.maxChoices ? Math.min(q.maxChoices, values.length) : values.length;
    return values.slice(0, k).reduce((sum, v) => sum + v, 0);
  }
  return values[0] ?? 0;
}

export function scoreCategories(questions, answers) {
  const qs = normaliseQuestions(questions);
  const raw = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0]));
  const maximum = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0]));
  const sources = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, []]));

  for (const q of qs) {
    const selected = answers?.[q.code] ?? [];
    if (!selected.length) continue;
    const chosen = q.options.filter((o) => selected.includes(o.code));

    for (const category of CATEGORY_KEYS) {
      maximum[category] += q.weight * bestAttainable(q, category);
      for (const option of chosen) {
        const points = Number(option.scores?.[category] ?? 0);
        if (!points) continue;
        raw[category] += q.weight * points;
        sources[category].push({
          questionCode: q.code,
          optionCode: option.code,
          label: option.label,
          points: round1(q.weight * points)
        });
      }
    }
  }

  const categories = CATEGORY_KEYS.map((key) => {
    const max = maximum[key];
    const normalized = max > 0 ? clamp(raw[key] / max) : 0;
    return {
      key,
      label: CATEGORIES[key].label,
      short: CATEGORIES[key].short,
      raw: round1(raw[key]),
      maximum: round1(max),
      normalized: Math.round(normalized * 1000) / 1000,
      percent: round1(normalized * 100),
      sources: sources[key]
        .sort((a, b) => b.points - a.points)
        .slice(0, 4)
    };
  });

  return categories;
}

function weightedScore(categoryScores, weights) {
  const entries = Object.entries(weights ?? {});
  const sumWeights = entries.reduce((sum, [, w]) => sum + Number(w), 0);
  if (!sumWeights) return 0;
  const total = entries.reduce((sum, [key, weight]) => {
    const category = categoryScores.find((c) => c.key === key);
    return sum + (category?.normalized ?? 0) * Number(weight);
  }, 0);
  return clamp(total / sumWeights) * 100;
}

function buildExplanation(strand, categoryScores, score) {
  const contributions = Object.entries(strand.weights ?? {})
    .map(([key, weight]) => {
      const category = categoryScores.find((c) => c.key === key);
      return { key, weight: Number(weight), normalized: category?.normalized ?? 0 };
    })
    .sort((a, b) => b.weight - a.weight);

  const top = contributions[0];
  const topCategory = categoryScores.find((c) => c.key === top?.key);
  const strengths = [...categoryScores]
    .sort((a, b) => b.normalized - a.normalized)
    .slice(0, 2)
    .map((c) => c.label);

  const level = levelFor(score);
  return (
    `Your answers point most strongly to ${strengths.join(' and ')}. ` +
    `${strand.code} gives its greatest weight to ${topCategory?.label ?? 'several dimensions'} ` +
    `(${Math.round((top?.weight ?? 0) * 100)}% of its profile), where your responses are ` +
    `${topCategory && topCategory.normalized >= 0.6 ? 'well supported' : topCategory && topCategory.normalized >= 0.4 ? 'partly supported' : 'less developed'}. ` +
    `On the alignment index this strand scores ${score.toFixed(1)} — ${level.label.toLowerCase()} — which describes how closely your ` +
    `selected interests and self-reported strengths match the strand, not how likely you are to succeed in it.`
  );
}

function buildEvidence(strand, categoryScores) {
  return Object.entries(strand.weights ?? {})
    .map(([key, weight]) => {
      const category = categoryScores.find((c) => c.key === key);
      return { key, weight: Number(weight), category };
    })
    .sort((a, b) => b.weight * (b.category?.normalized ?? 0) - a.weight * (a.category?.normalized ?? 0))
    .slice(0, 3)
    .map((entry) => ({
      category: entry.key,
      label: entry.category?.label ?? entry.key,
      normalised: entry.category?.normalized ?? 0,
      percent: entry.category?.percent ?? 0,
      weight: entry.weight,
      answers: (entry.category?.sources ?? []).slice(0, 3).map((s) => s.label)
    }));
}

/**
 * Run the full assessment.
 * @param {{questions: any[], strands: any[], answers: object}} input
 */
export function scoreAssessment({ questions, strands, answers }) {
  const validation = validateAnswers(questions, answers);
  if (!validation.ok) {
    const error = new Error(`Invalid responses: ${validation.errors.join('; ')}`);
    error.status = 400;
    throw error;
  }
  if (!validation.complete) {
    const error = new Error(`Missing responses for: ${validation.missing.join(', ')}`);
    error.status = 400;
    error.missing = validation.missing;
    throw error;
  }

  const categoryScores = scoreCategories(questions, validation.answers);

  const ranked = strands
    .filter((s) => s.active !== 0 && s.active !== false)
    .map((strand) => {
      const weights = typeof strand.weights === 'string' ? JSON.parse(strand.weights || '{}') : strand.weights ?? {};
      const score = Math.round(weightedScore(categoryScores, weights) * 10) / 10;
      const level = levelFor(score);
      return {
        slug: strand.slug,
        code: strand.code,
        name: strand.name,
        track: strand.track,
        score,
        level: level.level,
        levelLabel: level.label,
        explanation: buildExplanation({ ...strand, weights }, categoryScores, score),
        evidence: buildEvidence({ ...strand, weights }, categoryScores),
        gaps: Object.entries(weights)
          .filter(([key, weight]) => weight >= 0.12 && (categoryScores.find((c) => c.key === key)?.normalized ?? 0) < 0.45)
          .map(([key]) => ({ key, label: labelFor(key), description: CATEGORIES[key]?.developing ?? '' }))
      };
    })
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const sorted = [...categoryScores].sort((a, b) => b.normalized - a.normalized);
  const strengths = sorted
    .filter((c) => c.normalized >= 0.6)
    .slice(0, 3)
    .map((c) => ({
      key: c.key,
      label: c.label,
      percent: c.percent,
      description: CATEGORIES[c.key].description
    }));
  const development = [...sorted]
    .reverse()
    .filter((c) => c.normalized <= 0.45)
    .slice(0, 3)
    .map((c) => ({
      key: c.key,
      label: c.label,
      percent: c.percent,
      description: CATEGORIES[c.key].description,
      developing: CATEGORIES[c.key].developing
    }));

  const warnings = [];
  if (ranked.length >= 2 && ranked[0].score - ranked[1].score < 5) {
    warnings.push({
      type: 'close_results',
      message: `Your top two strands are within ${round1(ranked[0].score - ranked[1].score)} points of each other. Both are worth exploring before you decide.`
    });
  }
  if (development.length) {
    warnings.push({
      type: 'development_areas',
      message: `${development.map((d) => d.label).join(', ')} scored lower in this attempt. Lower scores describe your current answers, not a limit on what you can learn.`
    });
  }
  if (categoryScores.every((c) => c.maximum === 0)) {
    warnings.push({
      type: 'no_mapped_items',
      message: 'This questionnaire version has no scored items, so no strand alignment could be calculated.'
    });
  }

  return {
    algorithmVersion: ALGORITHM_VERSION,
    answeredCount: validation.answeredCount,
    total: validation.total,
    answers: validation.answers,
    categoryScores,
    ranked,
    strengths,
    development,
    warnings,
    topStrand: ranked[0] ?? null
  };
}

/**
 * Compare two stored results. Only differences that exist in the records are
 * reported; nothing is inferred or extrapolated.
 */
export function compareResults(previous, current) {
  if (!previous || !current) return null;
  const before = new Map(previous.categoryScores.map((c) => [c.key, c]));
  const categories = current.categoryScores.map((c) => {
    const prev = before.get(c.key);
    return {
      key: c.key,
      label: c.label,
      before: prev?.percent ?? null,
      after: c.percent,
      delta: prev ? round1(c.percent - prev.percent) : null
    };
  });

  const prevRanked = new Map((previous.ranked ?? []).map((r) => [r.slug, r]));
  const strands = (current.ranked ?? []).map((r) => {
    const prev = prevRanked.get(r.slug);
    return {
      slug: r.slug,
      code: r.code,
      name: r.name,
      before: prev ? prev.score : null,
      after: r.score,
      delta: prev ? round1(r.score - prev.score) : null,
      rankBefore: prev ? prev.rank : null,
      rankAfter: r.rank
    };
  });

  const changes = categories
    .filter((c) => c.delta !== null && Math.abs(c.delta) >= 1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    previousAssessmentId: previous.assessmentId ?? null,
    currentAssessmentId: current.assessmentId ?? null,
    previousDate: previous.submittedAt ?? null,
    currentDate: current.submittedAt ?? null,
    categories,
    strands,
    improved: changes.filter((c) => c.delta > 0).slice(0, 4),
    declined: changes.filter((c) => c.delta < 0).slice(0, 4),
    note:
      'Differences show how your answers changed between the two attempts. They do not prove that any activity caused the change.'
  };
}
