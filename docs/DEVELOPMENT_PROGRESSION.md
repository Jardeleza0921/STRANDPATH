# Development progression, readiness and strand choice

STRANDPATH no longer stops at "here is the strand that matches your answers". After the
pre-assessment a student can choose any strand — including one that needs significant
preparation — and receives a staged pathway that starts from their current evidence.

The loop is:

**ASSESS → DISCOVER → CHOOSE → DEVELOP → PRACTICE → REASSESS → PROGRESS**

## Where the pieces live

| File | Responsibility |
| --- | --- |
| `src/development/types.ts` | Pathway, stage, requirement, evidence and view types |
| `src/development/pathways.ts` | Five stages for each of the seven strands, with strand-specific modules |
| `src/development/readiness.ts` | Evidence rules, stage status, progress, next action, transferable skills |
| `src/development/load.ts` | Assembles the view from the existing API (static or optional server) |
| `src/pages/app/Development.tsx` | "My Development Journey": two readiness measures, roadmap, next action |
| `src/development/selftest.ts` | 253 automated checks over the model |

## Two measurements, deliberately separate

- **Current readiness** — the weighted alignment between the student's latest assessment
  answers and the chosen strand. It is the same alignment index used in the results page.
- **Pathway evidence** — the weighted share of the strand's dimensions for which evidence
  exists. Evidence is the higher of:
  - the assessment percentage for that dimension, and
  - practice evidence: a completed activity's knowledge-check score (best score, capped at
    90), or 45% for a completed activity without a check.

Completing an activity never adds assessment points. A check score can fill a gap the
assessment left; it cannot push evidence past 90. Two checked activities add a small
(3-point) consistency bonus.

- **Pathway progress** — the average stage completion, where partial credit measures
  movement toward the final readiness threshold (85), not the stage's own lower bar. A
  completed stage always shows 100%.

100% requires **every stage checkpoint** (stage requirements met, at least one relevant
completed activity or a demonstrated-mastery exemption) **and a submitted follow-up
assessment**. It does not mean guaranteed admission, academic success, professional
competence, a validated aptitude or a permanent classification. The UI states this next
to the number and lists which criteria are met and which remain.

## Stages

All strands use the same five stages, with their own content:

| Stage | Target per dimension | Purpose |
| --- | --- | --- |
| Foundation | 35% | Rebuild the base the strand assumes |
| Developing | 50% | Apply basics in short tasks |
| Building Competence | 65% | Combine skills in finished work |
| Advanced Practice | 78% | Longer, less guided work with constraints |
| Target Readiness | 85% | Independent work plus a follow-up assessment |

Requirements are the strand's highest-weight dimensions, three or four per stage, weighted
by the strand's published weight vector. This means ICT asks for technology, analysis,
persistence and creativity; ABM asks for enterprise, numbers, communication and analysis.

**Mastery skipping.** If every requirement in a stage is at least 15 points above its
target, the stage is marked *demonstrated* and can be completed without repeating its
activities. The page shows a "Demonstrated — can skip" chip.

**Next action.** The model always names one step: choose a strand, build the plan, continue
the next unfinished activity in the current stage, take the follow-up assessment, or review
evidence. The dashboard, journey page and Strand Assistance all read the same value.

## Personalized plans

`POST /programs/generate` (answered locally in the static build) now:

1. ranks the chosen strand's dimensions by `weight × (100 − percent)`, so targets are
   relevant to that strand rather than the student's globally weakest two;
2. skips dimensions already at 80% or above as mastered;
3. picks activities from the real activity library starting at the student's level — a
   dimension at 70%+ receives the core activity and skips the foundation one.

Submitting a new selection archives the previous programme rather than deleting it.
Archived activities stay in the progress history, so completed work is never lost.

## Changing strands

The journey page and Strand Assistance explain that switching:

- keeps every completed activity and assessment;
- reuses evidence wherever the new pathway needs the same dimension (transferable skills);
- recalculates stages and the activity plan from the new strand's requirements;
- skips stages the student can already evidence.

No shaming copy is used. A student who picks a strand other than their top match sees a
respectful explanation of the gap and a plan, not a rejection.

## Honest limits

- The pathway targets are curriculum-design choices, not validated psychometric cut-offs.
- Knowledge-check scores are small, self-administered checks, not examinations.
- Activity completion is recorded from the student's own reflection.
- In the static build all records live in one browser's `localStorage`; clearing site data
  removes them. Cross-device accounts need the optional backend.

## Testing

```bash
npm run test:development   # 253 checks across 7 pathways
npm run test:guidance      # 199 checks, including adaptive assistance answers
npm run typecheck
npm run build
```

The development self-test covers: complete five-stage pathways, low-match strand choice,
recommendation vs choice separation, check-score versus participation evidence, mastery
skipping, the 100% gate, progress without a follow-up, plan next-action links, transferable
evidence after a strand change, and rejection of a missing strand.
