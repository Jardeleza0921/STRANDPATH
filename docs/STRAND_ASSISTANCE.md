# Strand Assistance — technical notes

Strand Assistance replaces the former AI Virtual Coach. It is a local, rule-based guidance feature; there is no model call and no AI provider configuration.

## Files

| Path | Role |
| --- | --- |
| `src/pages/app/Assistance.tsx` | Student interface: conversation, topic shortcuts, sources, disclaimer |
| `src/guidance/engine.ts` | Intent detection, entity matching, context, answer construction |
| `src/guidance/knowledge/strands.ts` | Strand records derived from `src/data/strands.ts`, aliases, tracks |
| `src/guidance/knowledge/programs.ts` | College programme entries and lookup by strand |
| `src/guidance/knowledge/careers.ts` | Career entries and lookup by strand/programme |
| `src/guidance/knowledge/faqs.ts` | Structured FAQ entries |
| `src/guidance/knowledge/index.ts` | Knowledge assembly, topic shortcuts, disclaimer |
| `src/guidance/types.ts` | Knowledge and answer types |
| `src/guidance/selftest.ts` | Deterministic tests for every supported topic |
| `scripts/check-guidance.mjs` | Bundles the self-test with esbuild and runs it |

## Processing model

1. **Normalise** — lowercase, unify apostrophes, strip punctuation, collapse whitespace.
2. **Entities** — match strand aliases, programme aliases and career aliases as whole words or phrases.
3. **Intents** — ordered rules using keyword and phrase patterns. Order matters: fixed topics (improvement plan, scoring explanation, TVL specialisations, college-vs-work) are checked before broad keywords such as "improve" or "college". Adaptive development intents (stuck, under-challenged, discouraged, readiness, switching) are checked before entity lookups, and are suppressed when the message is really about choosing a strand.
4. **Context** — the session remembers the current topic, a pending comparison and how many times the student has asked for a simpler explanation. A second request for help with the same topic switches to a different approach instead of repeating the first answer. Conversation turns are persisted per local account in `localStorage` (last 60 turns) for convenience only.
5. **Answer** — paragraphs plus optional labelled points, three or four suggestions, and `sources`. Sources name the assessment (id, date, questionnaire and algorithm version) when it was used.
6. **Fallback** — no confident match produces an explicit unsupported answer that lists what the feature can do. It never guesses.

No randomness is involved, so the same question and context produce the same answer.

## Intent priority (abridged)

1. Empty input, greeting, thanks, emotional-safety cues (counselling direction, no diagnosis).
2. Adaptive development intents — discouraged, stuck/simplify (with escalating alternative explanations), under-challenged.
3. Readiness, stage, pathway progress and the meaning of 100%.
4. Switching strands (with transferable skills) or a request for a switch target.
5. Clearly out-of-scope domains (weather, homework answers, medical/legal advice, tuition, deadlines) → unsupported.
6. Improvement plan, scoring explanation, TVL specialisations, college-vs-work.
7. Why a strand was recommended (optionally for a named strand).
8. Comparison (two strands, or one named strand plus a question).
9. College programmes after a strand or for a named programme.
10. Careers for a strand, programme or career.
11. Skills, strengths and development.
12. Undecided students and alternative options.
13. Improvement plan and next steps.
14. Assessment mechanics and results location.
15. Strand suitability, using interest signals, maths concerns and the assessment.
16. Specific programme, career or strand detail.
17. Remaining FAQ topics and unsupported fallback.

## Assessment integration

The page loads `/dashboard` and the student's submitted assessments through the same API surface as the rest of the app (locally answered in the static build). It passes:

- the latest submitted result (ranked strands with evidence and gaps, strengths, development, warnings, category scores);
- the latest pre- and post-assessment summaries;
- the selected strand and profile fields;
- the active improvement programme and its pending activities;
- the development pathway: stage, current readiness, pathway evidence, progress, strongest and weakest dimensions, next action and transferable skills.

The engine uses these only to explain and contextualise. It cannot modify an assessment, a score or a programme.

## Adding knowledge

**A programme** — append to `programKnowledge` in `programs.ts`:

```ts
{
  slug: 'bs-example',
  name: 'BS Example',
  aliases: ['example course'],
  strands: ['stem', 'gas'],            // SHS preparation, not admission rules
  preparation: ['What helps before starting'],
  skills: ['Skills the programme builds'],
  careers: ['Typical first roles'],
  notes: 'Honest caveat about requirements or licensure.'
}
```

**A career** — append to `careerKnowledge`; include `strands`, `programs`, `skills`, `dayToDay` and a concrete `nextStep`. Avoid invented salaries, demand statistics or guaranteed outcomes.

**An FAQ** — append to `faqKnowledge` with `id`, `question`, `paragraphs`, optional `points` and `suggestions`. Add a direct question to `selftest.ts` so it cannot silently regress.

**A strand alias** — add the alias to `ALIASES` in `strands.ts`. Short codes (≤4 characters) are matched as whole words.

Keep wording student-friendly, second person, short sentences, and avoid claiming certainty about school-specific facts.

## Testing

```bash
npm run test:guidance
```

The self-test builds a real assessment using the shared engine, then checks:

- every documented example question maps to the expected topic and content;
- assessment-grounded answers only claim grounding when a result exists;
- the no-assessment path is honest and still useful;
- follow-up context works (`Compare STEM` → `ICT`);
- every shortcut chip and FAQ entry is reachable;
- unsupported questions set the unsupported flag;
- sources include the assessment when it was used;
- all strands are ranked by the engine.

A failure prints the question, expected and actual topic, and exits non-zero.

## Deliberate limits

- No free-text generation: an unmatched question is answered with the supported-topic list.
- No knowledge of a specific school's current offerings, schedules, fees, scholarships, admission cut-offs or deadlines.
- No psychological diagnosis, personality typing or "aptitude" claims.
- No medical, legal or crisis counselling; emotional-safety cues redirect to a trusted adult or the school counsellor.
- English only, matching the rest of the application.
