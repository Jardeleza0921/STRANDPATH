import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InfoIcon, MessageCircleIcon, SendIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Assessment, DashboardData, Programme } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { isStaticMode, STATIC_STORAGE_NOTICE } from '../../lib/mode';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  EmptyState,
  LoadingBlock,
  PageHeader
} from '../../components/ui/Primitives';
import { loadDevelopment } from '../../development/load';
import { createGuidanceSession, DISCLAIMER, TOPICS } from '../../guidance';
import type {
  GuidanceAnswer,
  GuidanceAssessmentSummary,
  GuidanceContext,
  GuidanceSessionLike
} from '../../guidance';

interface Turn {
  id: string;
  role: 'user' | 'guide';
  text: string;
  answer?: GuidanceAnswer;
}

const INTRO: GuidanceAnswer = {
  topic: 'intro',
  title: 'Ask me about strands, courses, careers or your results',
  paragraphs: [
    'I answer from a knowledge base that ships with STRANDPATH, plus your own assessment records when you have them. I am not an AI model and I do not invent facts.',
    'Try a starting question below, or describe what you enjoy and what you find difficult.'
  ],
  suggestions: TOPICS.slice(0, 4).map((topic) => topic.prompt),
  sources: [],
  groundedOnAssessment: false
};

function toSummary(assessment: Assessment): GuidanceAssessmentSummary | null {
  if (!assessment.ranked || !assessment.categoryScores) return null;
  const top = assessment.ranked[0] ?? null;
  return {
    id: assessment.id,
    type: assessment.type,
    submittedAt: assessment.submittedAt,
    algorithmVersion: assessment.algorithmVersion,
    questionnaireVersion: assessment.questionnaireVersion,
    selectedStrand: assessment.selectedStrand,
    topStrand: top
      ? {
          slug: top.slug,
          code: top.code,
          name: top.name,
          score: top.score,
          level: top.level,
          levelLabel: top.levelLabel
        }
      : null,
    ranked: assessment.ranked.map((row) => ({
      slug: row.slug,
      code: row.code,
      name: row.name,
      score: row.score,
      level: row.level,
      levelLabel: row.levelLabel,
      rank: row.rank,
      explanation: row.explanation,
      evidence: row.evidence.map((evidence) => ({
        category: evidence.category,
        label: evidence.label,
        percent: evidence.percent,
        weight: evidence.weight,
        answers: evidence.answers
      })),
      gaps: row.gaps
    })),
    strengths: assessment.strengths ?? [],
    development: assessment.development ?? [],
    warnings: assessment.warnings ?? [],
    categoryScores: assessment.categoryScores.map((category) => ({
      key: category.key,
      label: category.label,
      percent: category.percent
    }))
  };
}

function programmeContext(program: Programme | null): GuidanceContext['programme'] {
  if (!program) return null;
  return {
    name: program.name,
    strandSlug: program.strandSlug,
    status: program.status,
    progress: program.progress,
    activities: program.activities.map((activity) => ({
      title: activity.title,
      status: activity.status,
      category: activity.targetCategoryLabel,
      minutes: activity.minutes
    }))
  };
}

const storageKey = (userId: number | undefined) => `strandpath.assistance.${userId ?? 'guest'}`;

function readTurns(key: string): Turn[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Turn[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (turn) =>
        turn &&
        typeof turn.id === 'string' &&
        (turn.role === 'user' || turn.role === 'guide') &&
        typeof turn.text === 'string'
    );
  } catch {
    return [];
  }
}

export function Assistance() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [context, setContext] = useState<GuidanceContext | null>(null);
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const sessionRef = useRef<GuidanceSessionLike | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const key = storageKey(user?.id);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dashboard, list, development] = await Promise.all([
        api.get<DashboardData>('/dashboard'),
        api.get<{ assessments: { id: number; status: string; type: 'pre' | 'post' }[] }>('/assessments'),
        loadDevelopment().catch(() => null)
      ]);
      const submitted = list.assessments.filter((assessment) => assessment.status === 'submitted');
      const latestId = submitted[0]?.id;
      const preId = list.assessments.find((assessment) => assessment.status === 'submitted' && assessment.type === 'pre')?.id;
      const postId = list.assessments.find((assessment) => assessment.status === 'submitted' && assessment.type === 'post')?.id;
      const ids = [...new Set([latestId, preId, postId].filter((id): id is number => Boolean(id)))];
      const records = await Promise.all(
        ids.map((id) => api.get<{ assessment: Assessment }>(`/assessments/${id}`).then((data) => data.assessment))
      );
      const summaries = new Map<number, GuidanceAssessmentSummary>();
      for (const record of records) {
        const summary = toSummary(record);
        if (summary) summaries.set(summary.id, summary);
      }
      const latest = latestId ? summaries.get(latestId) ?? null : null;
      const nextContext: GuidanceContext = {
        latest,
        pre: preId ? summaries.get(preId) ?? null : null,
        post: postId ? summaries.get(postId) ?? null : null,
        selectedStrand: dashboard.selectedStrand ?? latest?.selectedStrand ?? null,
        profile: dashboard.profile
          ? {
              gradeLevel: dashboard.profile.gradeLevel,
              school: dashboard.profile.school,
              interests: dashboard.profile.interests,
              strengths: dashboard.profile.strengths,
              goals: dashboard.profile.goals,
              learningPreference: dashboard.profile.learningPreference,
              careerInterest: dashboard.profile.careerInterest
            }
          : null,
        programme: programmeContext(dashboard.program),
        development: development?.view
          ? {
              strandCode: development.view.pathway.code,
              stageName: development.view.stage.name,
              currentReadiness: development.view.currentReadiness,
              targetReadiness: development.view.targetReadiness,
              progressPercent: development.view.progressPercent,
              completedActivities: development.view.completedActivities,
              remainingActivities: development.view.remainingActivities,
              strongest: development.view.competencies.slice(0, 2).map((row) => ({
                label: row.label,
                percent: row.percent
              })),
              weakest: development.view.skillsToImprove.map((row) => ({
                label: row.label,
                percent: row.percent,
                target: row.target
              })),
              nextAction: development.view.nextAction
                ? { label: development.view.nextAction.label, detail: development.view.nextAction.detail }
                : null,
              transferableSkills: development.view.transferableSkills
            }
          : null
      };
      setContext(nextContext);
      sessionRef.current = createGuidanceSession(nextContext);
      const stored = readTurns(key);
      setTurns(stored);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking]);

  useEffect(() => {
    if (!turns || !user) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(turns.slice(-60)));
    } catch {
      /* Conversation history is a convenience, not a record. */
    }
  }, [turns, key, user]);

  // Links from results pages pass a prepared question.
  const prompt = params.get('prompt');
  useEffect(() => {
    if (!prompt || !context || !turns) return;
    if (turns.some((turn) => turn.role === 'user' && turn.text === prompt)) {
      setParams({}, { replace: true });
      return;
    }
    ask(prompt);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, context, turns === null]);

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || !sessionRef.current) return;
    const answer = sessionRef.current.ask(question);
    setThinking(true);
    setTurns((previous) => [
      ...(previous ?? []),
      { id: `u-${Date.now()}`, role: 'user', text: question },
      { id: `g-${Date.now()}`, role: 'guide', text: answer.title, answer }
    ]);
    setInput('');
    window.setTimeout(() => setThinking(false), 180);
  };

  const clear = () => {
    if (!window.confirm('Clear this conversation? Your assessment records are not affected.')) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    sessionRef.current?.reset();
    setTurns([]);
  };

  const latestAnswer = useMemo(() => {
    for (let index = (turns ?? []).length - 1; index >= 0; index -= 1) {
      const turn = (turns ?? [])[index];
      if (turn.role === 'guide' && turn.answer) return turn.answer;
    }
    return null;
  }, [turns]);

  if (error) {
    return (
      <div className="px-4 py-10 sm:px-8">
        <EmptyState
          title="Strand Assistance could not open"
          description={error}
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      </div>
    );
  }
  if (!context || !turns) return <LoadingBlock label="Opening Strand Assistance…" />;

  const grounded = Boolean(context.latest);
  const suggestions = latestAnswer?.suggestions?.length ? latestAnswer.suggestions : TOPICS.slice(0, 4).map((topic) => topic.prompt);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-[920px] flex-col px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Strand Assistance"
        title="Ask about your strand, course or career"
        description="Ask questions, explore academic pathways, and get guidance based on your interests, selected strand, stage and progress. Answers use a fixed local knowledge base and your own records — no AI service, no API key, and no data leaves this browser."
        actions={
          (turns.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={clear}>
              <Trash2Icon className="h-4 w-4" aria-hidden />
              Clear conversation
            </Button>
          ) : undefined)
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
        <Chip tone={grounded ? 'success' : 'neutral'}>
          {grounded
            ? `Using assessment #${context.latest?.id} · ${formatDate(context.latest?.submittedAt)}`
            : 'No submitted assessment yet'}
        </Chip>
        {context.selectedStrand && <Chip tone="brand">Target: {context.selectedStrand.toUpperCase()}</Chip>}
        {context.development && (
          <Chip>
            {context.development.stageName} · {context.development.progressPercent}% pathway
          </Chip>
        )}
        {context.programme && <Chip>{context.programme.progress.percent}% plan complete</Chip>}
        {isStaticMode() && (
          <span className="inline-flex items-center gap-1 text-[11.5px] text-faint">
            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
            Runs entirely in this browser
          </span>
        )}
      </div>

      <div className="mt-4">
        <Alert tone="info" title="How this works">
          <span className="flex gap-2">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Your question is matched against supported topics with keywords and rules. Answers combine the built-in
              knowledge base with your latest results when one exists. When a question is outside that scope, the
              assistant says so instead of guessing.
            </span>
          </span>
        </Alert>
      </div>

      <Card className="mt-4 flex-1 p-4 sm:p-5">
        {turns.length === 0 ? (
          <div className="py-6">
            <div className="mx-auto max-w-2xl text-center">
              <MessageCircleIcon className="mx-auto h-6 w-6 text-brand" aria-hidden />
              <p className="mt-3 text-[15px] font-semibold text-ink">{INTRO.title}</p>
              <p className="mx-auto mt-1 max-w-lg text-[13px] leading-relaxed text-muted">{INTRO.paragraphs[0]}</p>
              <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-muted">{INTRO.paragraphs[1]}</p>
            </div>

            <div className="mt-6">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Topics I support</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => ask(topic.prompt)}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {turns.map((turn) =>
              turn.role === 'user' ? (
                <li key={turn.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-brand px-4 py-3 text-[13.5px] leading-relaxed text-white">
                    {turn.text}
                  </div>
                </li>
              ) : (
                <li key={turn.id} className="flex justify-start">
                  <div
                    className={[
                      'max-w-[92%] rounded-lg border px-4 py-3.5 text-[13.5px] leading-relaxed',
                      turn.answer?.unsupported ? 'border-warn/30 bg-warn-soft' : 'border-line bg-canvas'
                    ].join(' ')}
                  >
                    <p className="text-[13.5px] font-semibold text-ink">{turn.answer?.title ?? turn.text}</p>
                    {turn.answer?.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="mt-2 text-[13px] leading-relaxed text-muted">
                        {paragraph}
                      </p>
                    ))}
                    {turn.answer?.points && turn.answer.points.length > 0 && (
                      <dl className="mt-3 space-y-2.5">
                        {turn.answer.points.map((point) => (
                          <div key={`${point.label}-${point.text.slice(0, 12)}`}>
                            <dt className="text-[12.5px] font-semibold text-ink">{point.label}</dt>
                            <dd className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{point.text}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {turn.answer?.followUp && (
                      <p className="mt-3 text-[12.5px] leading-relaxed text-ink">{turn.answer.followUp}</p>
                    )}
                    {turn.answer && turn.answer.sources.length > 0 && (
                      <div className="mt-3 border-t border-line pt-2.5">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-faint">Where this came from</p>
                        <ul className="mt-1 space-y-1">
                          {turn.answer.sources.map((source) => (
                            <li key={source.label} className="text-[11px] leading-relaxed text-faint">
                              <span className="font-medium text-muted">{source.label}:</span> {source.detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </li>
              )
            )}
            {thinking && (
              <li className="flex justify-start">
                <div className="rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] text-muted" role="status">
                  Looking that up…
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={endRef} />
      </Card>

      {turns.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ask(suggestion)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-brand hover:text-brand"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
        className="mt-3 flex items-end gap-2"
      >
        <label htmlFor="assistance-input" className="sr-only">
          Ask Strand Assistance
        </label>
        <textarea
          id="assistance-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              ask(input);
            }
          }}
          rows={2}
          maxLength={600}
          placeholder="Ask about a strand, a course, a career, or why you got a result…"
          className="min-h-[54px] flex-1 resize-none rounded-md border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <Button type="submit" disabled={!input.trim()}>
          <SendIcon className="h-4 w-4" aria-hidden />
          Ask
        </Button>
      </form>

      <div className="mt-3 space-y-1.5">
        <p className="text-[11.5px] leading-relaxed text-faint">{DISCLAIMER}</p>
        {isStaticMode() && <p className="text-[11.5px] leading-relaxed text-faint">{STATIC_STORAGE_NOTICE}</p>}
      </div>
    </div>
  );
}
