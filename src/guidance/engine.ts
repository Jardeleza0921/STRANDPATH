/**
 * Strand Assistance engine.
 *
 * Rules only: keyword matching for intent, alias matching for entities, and
 * pre-written responses combined with the student's real assessment records.
 * There is no model call, no generation, and no randomness. When a question
 * falls outside the knowledge base the engine says so instead of guessing.
 */
import type {
  CareerKnowledge,
  FaqKnowledge,
  GuidanceAnswer,
  GuidanceContext,
  GuidancePoint,
  GuidanceSource,
  ProgramKnowledge,
  StrandKnowledge
} from './types';
import {
  careersForProgram,
  careersForStrand,
  DISCLAIMER,
  faqKnowledge,
  findCareers,
  findPrograms,
  findStrands,
  getStrand,
  INTEREST_SIGNALS,
  programsForStrand,
  strandKnowledge,
  TOPICS,
  TRACKS,
  activitiesForCategory
} from './knowledge';
import { labelFor } from '../../shared/engine.js';

const DEFAULT_SUGGESTIONS = [
  'What strand is suitable for me?',
  'Why was my top strand recommended?',
  'What other options do I have?',
  'What should I do next?'
];

const KB_SOURCE: GuidanceSource = {
  label: 'STRANDPATH knowledge base',
  detail: 'Local strand, programme and career descriptions shipped with the application.'
};

function dateLabel(value: string | null | undefined): string {
  if (!value) return 'an earlier attempt';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'an earlier attempt';
  return date.toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'&+\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(text: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((pattern) =>
    typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)
  );
}

function score(assessment: NonNullable<GuidanceContext['latest']>, slug: string) {
  return assessment.ranked.find((row) => row.slug === slug) ?? null;
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function matchedInterests(text: string): { slug: string; label: string }[] {
  return INTEREST_SIGNALS.filter((signal) => signal.patterns.some((pattern) => pattern.test(text))).map(
    (signal) => ({ slug: signal.slug, label: signal.label })
  );
}

function assessmentSource(context: GuidanceContext): GuidanceSource[] {
  const latest = context.latest;
  if (!latest) return [KB_SOURCE];
  return [
    {
      label: latest.type === 'post' ? 'Your follow-up assessment' : 'Your latest assessment',
      detail: `Assessment #${latest.id}, submitted ${dateLabel(latest.submittedAt)}, questionnaire v${latest.questionnaireVersion ?? '—'}, algorithm ${latest.algorithmVersion}.`
    },
    KB_SOURCE
  ];
}

/* -------------------------------------------------------------- answer builders */

function buildWhy(context: GuidanceContext): GuidanceAnswer {
  const latest = context.latest;
  if (!latest || !latest.ranked.length) {
    return {
      topic: 'why',
      title: 'There is no scored assessment to explain yet',
      paragraphs: [
        'I can only explain a recommendation that actually exists. You have not submitted an assessment in this browser yet, so there is no ranking for me to read.',
        'The pre-assessment takes about ten minutes. When you finish it, I can point to the exact dimensions and answers behind each strand score.'
      ],
      suggestions: ['What strand is suitable for me?', 'How does STRANDPATH compute my recommendation?', 'What should I do next?'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }
  const top = latest.ranked[0];
  const chosen = context.selectedStrand ? score(latest, context.selectedStrand) : null;
  const subject = chosen ?? top;
  const index = latest.ranked.findIndex((row) => row.slug === subject.slug);
  const ordinal = index === 0 ? 'highest' : `rank #${subject.rank}`;
  const points: GuidancePoint[] = subject.evidence.map((evidence) => ({
    label: `${evidence.label} — ${Math.round(evidence.percent)}%`,
    text: `${Math.round(evidence.weight * 100)}% of the ${subject.code} profile rests on this dimension.${
      evidence.answers.length ? ` Your answers included: ${list(evidence.answers)}.` : ''
    }`
  }));
  if (subject.gaps.length) {
    points.push({
      label: 'What pulled it down',
      text: `${list(subject.gaps.map((gap) => gap.label))} scored lower in this attempt. That describes your current answers, not a limit on what you can learn.`
    });
  }
  const alternatives = latest.ranked.filter((row) => row.slug !== subject.slug).slice(0, 2);
  if (alternatives.length) {
    points.push({
      label: 'Close alternatives',
      text: alternatives.map((row) => `${row.code} (${row.score.toFixed(1)})`).join(' and ') + ' follow in the ranking. Read their evidence before treating the first place as a decision.'
    });
  }
  const paragraphs = [
    `${subject.code} is your ${ordinal} strand on assessment #${latest.id}, with an alignment index of ${subject.score.toFixed(
      1
    )} of 100 — ${subject.levelLabel.toLowerCase()}.`,
    subject.explanation,
    'The index compares your answers with the strand profile. It is not a probability of success and not a grade; it shows where your current interests and self-reported strengths line up.'
  ];
  if (latest.warnings.length) {
    paragraphs.push(...latest.warnings.map((warning) => warning.message));
  }
  return {
    topic: 'why',
    title: `Why ${subject.code} was recommended`,
    paragraphs,
    points,
    suggestions: [
      `What careers are related to ${subject.code}?`,
      'What skills should I improve?',
      'What other options do I have?',
      'What should I do next?'
    ],
    sources: assessmentSource(context),
    groundedOnAssessment: true
  };
}

function comparePoints(a: StrandKnowledge, b: StrandKnowledge): GuidancePoint[] {
  const shared = a.collegeFields.filter((field) => b.collegeFields.includes(field));
  const sharedCareers = a.careers.filter((career) => b.careers.includes(career));
  const points: GuidancePoint[] = [
    { label: `${a.code} in one line`, text: a.tagline },
    { label: `${b.code} in one line`, text: b.tagline },
    {
      label: 'Subjects you would actually take',
      text: `${a.code}: ${list(a.subjects.slice(0, 3))}. ${b.code}: ${list(b.subjects.slice(0, 3))}.`
    },
    {
      label: 'Skills each one builds',
      text: `${a.code} leans on ${list(a.skills.slice(0, 3))}; ${b.code} leans on ${list(b.skills.slice(0, 3))}.`
    }
  ];
  if (shared.length) {
    points.push({ label: 'Where they overlap', text: `Both can lead toward ${list(shared.slice(0, 3))} in college.` });
  }
  if (sharedCareers.length) {
    points.push({ label: 'Shared career directions', text: list(sharedCareers.slice(0, 3)) + '.' });
  }
  points.push({
    label: 'Considerations',
    text: `${a.code}: ${a.considerations[0] ?? 'Check your school’s offering.'} ${b.code}: ${b.considerations[0] ?? 'Check your school’s offering.'}`
  });
  return points;
}

function buildCompare(context: GuidanceContext, strands: StrandKnowledge[], text: string): GuidanceAnswer {
  let [a, b] = strands;
  const latest = context.latest;
  const fallbackSlug = context.selectedStrand ?? latest?.ranked?.[0]?.slug ?? null;
  if (!a && fallbackSlug) a = getStrand(fallbackSlug) ?? strandKnowledge[0];
  if (!b) b = strandKnowledge.find((strand) => strand.slug !== a?.slug) ?? strandKnowledge[1];
  if (!a || !b || a.slug === b.slug) {
    return {
      topic: 'compare',
      title: 'Which two should I compare?',
      paragraphs: [
        'Name two strands and I will lay out the subjects, skills, college directions and trade-offs side by side.',
        'For example: “Compare STEM and ICT” or “What is the difference between ABM and HUMSS?”'
      ],
      suggestions: ['Compare STEM and ICT', 'Compare ABM and HUMSS', 'Compare GAS and TVL'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }
  const points = comparePoints(a, b);
  const paragraphs = [
    `${a.code} and ${b.code} are both senior high options, but they are built for different kinds of work. ${a.summary} ${b.summary}`
  ];
  const mathComment = hasAny(text, [/math/i, /numbers?/i, /not good/i, /weak/i]);
  if (mathComment) {
    const heavier = a.slug === 'stem' ? a : b.slug === 'stem' ? b : null;
    const lighter = heavier?.slug === a.slug ? b : a;
    if (heavier) {
      paragraphs.push(
        `${heavier.code} keeps more science and mathematics in the timetable. ${lighter.code} is still technical or academic work, but it usually demands less advanced mathematics. If maths is your worry, that difference matters more than the labels.`
      );
    }
  }
  if (latest) {
    const aScore = score(latest, a.slug);
    const bScore = score(latest, b.slug);
    if (aScore || bScore) {
      paragraphs.push(
        `On your latest assessment, ${[aScore, bScore]
          .filter(Boolean)
          .map((row) => `${row!.code} scored ${row!.score.toFixed(1)} (${row!.levelLabel.toLowerCase()})`)
          .join(' and ')}. Use that as a starting point, not as the decision itself.`
      );
    }
  }
  return {
    topic: 'compare',
    title: `${a.code} or ${b.code}?`,
    paragraphs,
    points,
    suggestions: [
      `What college courses can I take after ${a.code}?`,
      `What college courses can I take after ${b.code}?`,
      `What strand is suitable for me?`,
      'What other options do I have?'
    ],
    sources: latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(latest)
  };
}

function buildPrograms(context: GuidanceContext, strand: StrandKnowledge | null, text: string): GuidanceAnswer {
  const explicit = findPrograms(text);
  if (!strand && explicit.length) {
    const program = explicit[0];
    return buildProgramDetail(program, context);
  }
  const target = strand ?? getStrand(context.selectedStrand ?? '') ?? getStrand(context.latest?.ranked?.[0]?.slug ?? '') ?? null;
  if (!target) {
    return {
      topic: 'programs',
      title: 'Which strand should I start from?',
      paragraphs: [
        'I can list college programmes for a strand or a specific programme, but I need to know which one you mean.',
        'You can also take the assessment first and ask me about the strand it ranks highest for you.'
      ],
      suggestions: ['What college courses can I take after ICT?', 'What college courses can I take after HUMSS?', 'What strand is suitable for me?'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }
  const programs = programsForStrand(target.slug).slice(0, 6);
  if (!programs.length) {
    return {
      topic: 'programs',
      title: `College directions after ${target.code}`,
      paragraphs: [
        `${target.code} does not map to a short fixed list of degrees. Its college fields include ${list(target.collegeFields)}.`,
        'Ask a specific programme and I can explain the typical preparation and careers attached to it.'
      ],
      suggestions: target.collegeFields.slice(0, 3).map((field) => `What does ${field} involve?`),
      sources: [KB_SOURCE],
      groundedOnAssessment: Boolean(context.latest)
    };
  }
  const points = programs.map((program) => ({
    label: program.name,
    text: `${list(program.preparation.slice(0, 2))}. Usual career directions: ${list(program.careers.slice(0, 3))}.`
  }));
  const paragraphs = [
    `After ${target.code}, students commonly move into ${list(programs.slice(0, 4).map((program) => program.name))}.`,
    'These are typical preparations, not admission rules. Each college sets its own requirements, and some programmes have qualifying exams or additional science and maths subjects.'
  ];
  if (context.latest) {
    const target2 = score(context.latest, target.slug);
    if (target2?.gaps.length) {
      paragraphs.push(
        `Your assessment flagged ${list(target2.gaps.map((gap) => gap.label))} as preparation worth building. That is relevant if you choose a programme with a heavy load in those areas.`
      );
    }
  }
  return {
    topic: 'programs',
    title: `College programmes after ${target.code}`,
    paragraphs,
    points,
    suggestions: [
      `What careers are related to ${target.code}?`,
      `Compare ${target.code} and ${target.slug === 'ict' ? 'STEM' : 'ICT'}`,
      'What strand is suitable for me?',
      'What should I do next?'
    ],
    sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildProgramDetail(program: ProgramKnowledge, context: GuidanceContext): GuidanceAnswer {
  const strands = program.strands.map((slug) => getStrand(slug)?.code ?? slug.toUpperCase());
  return {
    topic: 'program',
    title: program.name,
    paragraphs: [
      `Typical senior high preparation: ${list(strands)}. That is guidance, not a guarantee — colleges set their own admission rules.`,
      program.notes
    ],
    points: [
      { label: 'Preparation that helps', text: list(program.preparation) + '.' },
      { label: 'Skills the programme builds', text: list(program.skills) + '.' },
      { label: 'Career directions', text: list(program.careers) + '.' }
    ],
    suggestions: [`What careers are related to ${program.name}?`, 'What strand is suitable for me?', 'What should I do next?'],
    sources: [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildCareers(
  context: GuidanceContext,
  strands: StrandKnowledge[],
  programs: ProgramKnowledge[],
  careers: CareerKnowledge[],
  text: string
): GuidanceAnswer {
  if (careers.length) {
    const career = careers[0];
    if (hasAny(text, [/what (is|does|do)/i, /tell me about/i, /involve/i, /day/i]) || (/career/i.test(text) && careers.length === 1 && !strands.length)) {
      return {
        topic: 'career',
        title: career.name,
        paragraphs: [
          `A ${career.name.toLowerCase()} typically ${career.dayToDay.charAt(0).toLowerCase()}${career.dayToDay.slice(1)}`,
          `Relevant senior high strands: ${career.strands.map((slug) => getStrand(slug)?.code ?? slug).join(', ')}.`
        ],
        points: [
          { label: 'Skills that matter', text: list(career.skills) + '.' },
          { label: 'A useful first step', text: career.nextStep },
          { label: 'College programmes often taken', text: list(career.programs.map((slug) => slug.replace(/^(bs|ab|ba)-/, '').replace(/-/g, ' '))) + '.' }
        ],
        suggestions: ['What strand is suitable for me?', 'What skills should I improve?', 'What should I do next?'],
        sources: [KB_SOURCE],
        groundedOnAssessment: Boolean(context.latest)
      };
    }
  }

  let targetStrand: StrandKnowledge | null = strands[0] ?? null;
  let targetProgram: ProgramKnowledge | null = programs[0] ?? null;
  if (!targetStrand && targetProgram) {
    targetStrand = getStrand(targetProgram.strands[0]) ?? null;
  }
  if (!targetStrand && !targetProgram) {
    targetStrand = getStrand(context.selectedStrand ?? '') ?? getStrand(context.latest?.ranked?.[0]?.slug ?? '') ?? null;
  }
  if (!targetStrand) {
    return {
      topic: 'careers',
      title: 'Which strand or programme should I start from?',
      paragraphs: [
        'Careers connect to strands and college programmes. Name one and I can show the usual directions and the skills they need.',
        'For example: “What careers are related to HUMSS?” or “What can I do with a nursing degree?”'
      ],
      suggestions: ['What careers are related to HUMSS?', 'What careers are related to ICT?', 'What strand is suitable for me?'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }

  const related = targetProgram ? careersForProgram(targetProgram.slug) : careersForStrand(targetStrand.slug);
  const fallback = targetStrand.careers.map((name) => ({ name } as { name: string }));
  const entries: { name: string; detail?: string; skills?: string[]; nextStep?: string }[] = related.length
    ? related.slice(0, 5).map((career) => ({
        name: career.name,
        detail: career.dayToDay,
        skills: career.skills,
        nextStep: career.nextStep
      }))
    : fallback.slice(0, 5).map((career) => ({ name: career.name }));

  const points: GuidancePoint[] = entries.map((entry) => ({
    label: entry.name,
    text: entry.detail
      ? `${entry.detail}${entry.skills ? ` Skills that matter: ${list(entry.skills.slice(0, 3))}.` : ''}`
      : `A common direction from ${targetStrand!.code}. Confirm the actual requirements with employers and schools.`
  }));
  const paragraphs = [
    `Careers commonly associated with ${targetProgram ? targetProgram.name : targetStrand.code}: ${list(entries.map((entry) => entry.name))}.`,
    'These are directions, not guarantees. Some need a licence or graduate study; others depend more on a portfolio and experience. Pay and demand also change, so check current local requirements rather than trusting a list.'
  ];
  if (related[0]?.nextStep) {
    paragraphs.push(`One concrete first step: ${related[0].nextStep}`);
  }
  return {
    topic: 'careers',
    title: `Careers related to ${targetProgram ? targetProgram.name : targetStrand.code}`,
    paragraphs,
    points,
    suggestions: [
      `What college courses can I take after ${targetStrand.code}?`,
      'What skills should I improve?',
      'What strand is suitable for me?',
      'What should I do next?'
    ],
    sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildStrandDetail(strand: StrandKnowledge, context: GuidanceContext): GuidanceAnswer {
  const programs = programsForStrand(strand.slug).slice(0, 4).map((program) => program.name);
  const latestScore = context.latest ? score(context.latest, strand.slug) : null;
  const paragraphs = [
    `${strand.code} — ${strand.name} (${strand.track} track). ${strand.summary}`,
    `It suits students who ${strand.suitedFor.map((line) => line.charAt(0).toLowerCase() + line.slice(1)).join('; ')}.`
  ];
  if (latestScore) {
    paragraphs.push(
      `On your latest assessment it scored ${latestScore.score.toFixed(1)} (${latestScore.levelLabel.toLowerCase()}), rank #${latestScore.rank}.`
    );
  }
  return {
    topic: 'strand',
    title: `${strand.code} at a glance`,
    paragraphs,
    points: [
      { label: 'Subjects', text: list(strand.subjects) + '.' },
      { label: 'Skills it develops', text: list(strand.skills) + '.' },
      { label: 'College directions', text: list(strand.collegeFields) + '.' },
      { label: 'Careers people mention', text: list(strand.careers) + '.' },
      { label: 'Worth knowing', text: list(strand.considerations) + '.' },
      ...(programs.length ? [{ label: 'Programmes that usually follow', text: list(programs) + '.' }] : [])
    ],
    suggestions: [
      `What careers are related to ${strand.code}?`,
      `What college courses can I take after ${strand.code}?`,
      `Why was ${strand.code} recommended?`,
      'What other options do I have?'
    ],
    sources: latestScore ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(latestScore)
  };
}

function fitFromInterests(context: GuidanceContext, text: string): GuidanceAnswer {
  const signals = matchedInterests(text);
  const mathsConcern = hasAny(text, [/not good at math/i, /bad at math/i, /weak in math/i, /hate math/i, /struggle.*math/i, /not good at mathematics/i]);
  const codes = [...new Set(signals.map((signal) => signal.slug))];
  const strands = codes.map((slug) => getStrand(slug)).filter((strand): strand is StrandKnowledge => Boolean(strand));
  const latest = context.latest;

  if (!strands.length && !latest) {
    return {
      topic: 'fit',
      title: 'Tell me a little about what you enjoy',
      paragraphs: [
        'I can suggest a starting point without an assessment, but it will be a keyword match rather than evidence from your answers.',
        'What do you actually enjoy doing — building things, explaining ideas, organising people, making art, training, or figuring out how systems work? And which subjects feel easier than others?'
      ],
      points: TOPICS.filter((topic) => topic.id === 'fit' || topic.id === 'undecided').map((topic) => ({
        label: topic.label,
        text: `Try: “${topic.prompt}”`
      })),
      suggestions: ['I like computers, but I am not good at mathematics.', 'I enjoy writing and helping people.', 'I am still undecided. Can you help me?'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }

  const ranked = latest?.ranked ?? [];
  const points: GuidancePoint[] = [];
  if (strands.length) {
    points.push({
      label: 'What your words point to',
      text: `${list(strands.map((strand) => strand.code))} — because you mentioned ${list(signals.map((signal) => signal.label))}. That is an interest signal, not a recommendation on its own.`
    });
  }
  if (ranked.length) {
    const top = ranked.slice(0, 3);
    points.push({
      label: 'What your assessment says',
      text: top.map((row) => `${row.code} ${row.score.toFixed(1)} (${row.levelLabel.toLowerCase()})`).join('; ') + '.'
    });
  }
  if (mathsConcern) {
    const gentler = ['ict', 'gas', 'humss', 'abm'].map((slug) => getStrand(slug)).filter(Boolean) as StrandKnowledge[];
    points.push({
      label: 'Because maths is a concern',
      text: `Look at ${list(gentler.slice(0, 3).map((strand) => strand.code))}. ICT and IT-related college programmes are technical but usually lighter on advanced mathematics than STEM, Computer Science or Engineering. If you want a technology degree anyway, plan to build algebra and statistics rather than avoiding them.`
    });
  }

  const paragraphs: string[] = [];
  if (signals.length && mathsConcern) {
    paragraphs.push(
      `You mentioned ${list(signals.map((signal) => signal.label))} and also that mathematics is difficult. That combination is common, and it does not rule out technology work — it changes which technology route makes sense.`
    );
    paragraphs.push(
      'ICT is hands-on: programming, computer servicing, networking and digital media, with less advanced maths than STEM. Information Technology and Information Systems degrees are usually gentler than Computer Science or Engineering. STEM keeps more science and engineering doors open, but it will ask for sustained maths.'
    );
  } else if (signals.length) {
    paragraphs.push(
      `Based on what you wrote, ${list(strands.map((strand) => strand.code))} is worth reading first. ${strands[0].summary}`
    );
    paragraphs.push(
      `You would study ${list(strands[0].subjects.slice(0, 3))}, and build ${list(strands[0].skills.slice(0, 3))}.`
    );
  } else {
    paragraphs.push(
      `Your assessment ranks ${ranked
        .slice(0, 2)
        .map((row) => `${row.code} (${row.score.toFixed(1)})`)
        .join(' and ')} highest. The ranking is a match with your answers, not a prediction.`
    );
  }
  if (latest) {
    paragraphs.push(
      'Read the top two strand pages and their considerations before deciding; the highest score is a starting point for a conversation, not an instruction.'
    );
    if (latest.warnings.length) paragraphs.push(...latest.warnings.map((warning) => warning.message));
  } else {
    paragraphs.push('There is no submitted assessment in this browser yet, so this is only an interest match. The pre-assessment would make this more specific.');
  }

  return {
    topic: 'fit',
    title: 'A starting point, not a verdict',
    paragraphs,
    points,
    suggestions: latest
      ? ['Why was my top strand recommended?', 'What other options do I have?', 'What skills should I improve?', 'What should I do next?']
      : ['How does the assessment work?', 'What specialisations does TVL have?', 'What should I do next?'],
    sources: latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(latest)
  };
}

function buildSkills(context: GuidanceContext): GuidanceAnswer {
  const latest = context.latest;
  if (!latest) {
    return {
      topic: 'skills',
      title: 'Skills are built by practice, not discovered by a quiz',
      paragraphs: [
        'Without a submitted assessment I cannot point to your specific lower-scoring dimensions. I can still suggest how to build the skills that most strands use.',
        'The assessment measures ten dimensions — analysis, numbers, technology, communication, people, organisation, creativity, practical work, science and persistence. Each can be practised.'
      ],
      points: [
        { label: 'Explain something weekly', text: 'Take one idea from class and explain it in 150 words to someone who missed it.' },
        { label: 'Keep a problem log', text: 'Write what happened, what you assumed and what you actually knew. It builds analysis faster than solving more exercises.' },
        { label: 'Finish one small project', text: 'A working page, a repaired device, an event, a piece of art — completion teaches persistence.' }
      ],
      suggestions: ['What strand is suitable for me?', 'How does the assessment work?', 'What should I do next?'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }
  const strengths = latest.strengths.length
    ? latest.strengths
    : latest.categoryScores
        .slice()
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 2)
        .map((category) => ({ ...category, description: labelFor(category.key) }));
  const development = latest.development.length
    ? latest.development
    : latest.categoryScores
        .slice()
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 2)
        .map((category) => ({
          ...category,
          description: labelFor(category.key),
          developing: 'practising this deliberately'
        }));

  const points: GuidancePoint[] = [
    {
      label: 'Use what is already working',
      text: `${list(strengths.map((entry) => entry.label))} came out strongest. Choose a strand where those matter, then keep using them.`
    },
    ...development.slice(0, 3).map((entry) => {
      const practice = activitiesForCategory(entry.key, 2).map((activity) => activity.title);
      return {
        label: `${entry.label} — ${Math.round(entry.percent)}%`,
        text: `${entry.developing.charAt(0).toUpperCase()}${entry.developing.slice(1)}.${
          practice.length ? ` The activity library has: ${list(practice)}.` : ''
        }`
      };
    })
  ];
  if (context.programme) {
    const next = context.programme.activities.find((activity) => activity.status !== 'completed');
    if (next) {
      points.push({
        label: 'Already in your plan',
        text: `${next.title} targets ${next.category} and takes about ${next.minutes} minutes. It is the next unfinished activity in ${context.programme.name}.`
      });
    }
  }
  return {
    topic: 'skills',
    title: 'Where to focus next',
    paragraphs: [
      `Your latest assessment puts ${list(strengths.map((entry) => entry.label))} highest and ${list(
        development.map((entry) => entry.label)
      )} lower in this attempt.`,
      'Lower percentages describe your answers at that moment, not a fixed ability. Pick one area and practise it for a few weeks; trying to improve everything at once usually produces nothing.'
    ],
    points,
    suggestions: ['What is in my improvement plan?', 'Why was my top strand recommended?', 'What careers fit my strengths?', 'What should I do next?'],
    sources: assessmentSource(context),
    groundedOnAssessment: true
  };
}

function buildAlternatives(context: GuidanceContext): GuidanceAnswer {
  const latest = context.latest;
  if (!latest?.ranked.length) {
    return {
      topic: 'alternatives',
      title: 'Options to explore before deciding',
      paragraphs: [
        'Without an assessment I can give you the structural alternatives rather than a ranked list.',
        'GAS keeps several academic doors open. TVL builds a practical skill and can still lead to college. Arts and Design and Sports are specialised tracks. Each choice trades breadth for depth.'
      ],
      points: [
        { label: 'Want to keep options open?', text: 'GAS combines subjects from several strands. Check which college programmes your school’s GAS actually prepares you for.' },
        { label: 'Want a skill you can use soon?', text: 'TVL specialisations lead to work, certificates where available, or college. ICT is the technology route.' },
        { label: 'Want a specific field now?', text: 'STEM, ABM, HUMSS, Arts and Design or Sports each lean toward a cluster of college programmes.' }
      ],
      suggestions: ['What strand is suitable for me?', 'Compare GAS and TVL', 'What should I do next?'],
      sources: [KB_SOURCE],
      groundedOnAssessment: false
    };
  }
  const topSlug = latest.ranked[0].slug;
  const others = latest.ranked.filter((row) => row.slug !== topSlug).slice(0, 3);
  const top = getStrand(topSlug);
  const points: GuidancePoint[] = others.map((row) => {
    const strand = getStrand(row.slug);
    return {
      label: `${row.code} — ${row.score.toFixed(1)} (rank #${row.rank})`,
      text: `${strand?.tagline ?? ''} College directions: ${list((strand?.collegeFields ?? []).slice(0, 3))}.`
    };
  });
  if (top) {
    points.push({
      label: 'Before you switch',
      text: `${top.code} is only a better match if you would actually study ${list(top.subjects.slice(0, 2))} for two years. Read its considerations too.`
    });
  }
  const paragraphs = [
    `Your top three are ${list(latest.ranked.slice(0, 3).map((row) => `${row.code} (${row.score.toFixed(1)})`))}. They are not the only options, and the ranking is not a lock.`,
    'If more than one fits, compare what you would study, not only the score. A strand three points lower can be the better choice if its subjects are the ones you would keep doing on a bad week.',
    context.selectedStrand
      ? 'You can change your selection later; your improvement programme is rebuilt around the new strand. Nothing about a selection is permanent.'
      : 'You have not selected a strand yet, so nothing is committed. Read the top two pages and choose when you are ready.'
  ];
  return {
    topic: 'alternatives',
    title: 'Your other options',
    paragraphs,
    points,
    suggestions: [
      `Compare ${latest.ranked[0].code} and ${latest.ranked[1]?.code ?? 'GAS'}`,
      'What strand is suitable for me?',
      'What is in my improvement plan?',
      'What should I do next?'
    ],
    sources: assessmentSource(context),
    groundedOnAssessment: true
  };
}

function buildNextSteps(context: GuidanceContext): GuidanceAnswer {
  const latest = context.latest;
  const programme = context.programme;
  const points: GuidancePoint[] = [];
  let title = 'A sensible next step';
  let paragraphs: string[];

  if (!latest) {
    title = 'Start with the pre-assessment';
    paragraphs = [
      'There is no submitted assessment in this browser yet. The pre-assessment is the baseline for everything else: strand alignment, your improvement programme and any later comparison.',
      'It takes about ten to twelve minutes and asks about interests, strengths and how you prefer to work. There are no right answers.'
    ];
    points.push(
      { label: '1. Take the pre-assessment', text: 'Open “Let’s Get Started” in the student menu.' },
      { label: '2. Read two strand pages', text: 'Look at the subjects and considerations, not only the summary.' },
      { label: '3. Bring it to a person', text: 'Talk it through with your adviser, a parent or the guidance office.' }
    );
  } else if (!context.selectedStrand) {
    title = 'Turn your results into a choice';
    paragraphs = [
      `Your latest assessment ranks ${latest.ranked.slice(0, 2).map((row) => row.code).join(' and ')} highest. The next step is not another test — it is reading and comparing.`,
      'Open the top two strand pages, compare them side by side, and choose one on the results page when you are ready. You can change it later.'
    ];
    points.push(
      { label: '1. Read the evidence', text: 'On your results, open “Show evidence” for the top two strands.' },
      { label: '2. Compare honestly', text: 'Ask which subjects you would keep doing even when the work is boring.' },
      { label: '3. Select a strand', text: 'Choosing unlocks a short improvement programme; it does not lock your future.' }
    );
  } else if (!programme) {
    title = 'Build your improvement programme';
    paragraphs = [
      `You selected ${context.selectedStrand.toUpperCase()}. STRANDPATH can turn your results into a short sequence of activities aimed at the areas that scored lower.`,
      'The programme is a plan for practice, not a requirement for admission. You can skip or request an alternative at any point.'
    ];
    points.push(
      { label: 'Generate the programme', text: 'Open “My Improvement Plan” and generate it from your latest assessment.' },
      { label: 'Do the first activity', text: 'Start with the first unfinished activity rather than reading the whole list.' },
      { label: 'Reassess later, not daily', text: 'A follow-up assessment is suggested after about four weeks.' }
    );
  } else {
    const next = programme.activities.find((activity) => activity.status !== 'completed');
    title = next ? 'Your next unfinished activity' : 'Your programme is complete';
    paragraphs = next
      ? [
          `${programme.name} is ${programme.progress.percent}% complete (${programme.progress.completed} of ${programme.progress.total} activities).`,
          `Next is “${next.title}”, about ${next.minutes} minutes, targeting ${next.category}. Finish it and record a short reflection.`
        ]
      : [
          `All ${programme.progress.total} activities in ${programme.name} are recorded as complete.`,
          'A follow-up assessment would show how your answers have changed. It is optional, and it cannot prove that any activity caused a change.'
        ];
    points.push(
      next
        ? { label: 'Open the activity', text: 'Go to My Improvement Plan and continue where you stopped.' }
        : { label: 'Consider the follow-up', text: 'Open the follow-up assessment page to see your baseline and start when ready.' },
      { label: 'Keep the evidence', text: 'Export your records from Profile if you need a copy for a conversation at home or school.' }
    );
  }

  return {
    topic: 'next',
    title,
    paragraphs,
    points,
    suggestions: latest
      ? ['What skills should I improve?', 'What other options do I have?', 'What is in my improvement plan?', 'Why was my top strand recommended?']
      : ['What strand is suitable for me?', 'How does the assessment work?', 'What specialisations does TVL have?'],
    sources: latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(latest)
  };
}

function buildPlan(context: GuidanceContext): GuidanceAnswer {
  const programme = context.programme;
  if (!programme) {
    return {
      topic: 'plan',
      title: 'No improvement programme yet',
      paragraphs: [
        'A programme is generated from a submitted assessment and the strand you select. Right now there is no active programme for this account.',
        'It contains up to a few short activities aimed at the dimensions worth developing, with an optional knowledge check and a reflection.'
      ],
      suggestions: ['What should I do next?', 'What strand is suitable for me?', 'What skills should I improve?'],
      sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
      groundedOnAssessment: Boolean(context.latest)
    };
  }
  const upcoming = programme.activities.filter((activity) => activity.status !== 'completed').slice(0, 3);
  return {
    topic: 'plan',
    title: programme.name,
    paragraphs: [
      `Status: ${programme.status}. Progress: ${programme.progress.completed} of ${programme.progress.total} activities (${programme.progress.percent}%).`,
      upcoming.length
        ? `Still to do: ${list(upcoming.map((activity) => activity.title))}.`
        : 'Every activity is recorded as complete. The follow-up assessment is the remaining step.'
    ],
    points: programme.activities.slice(0, 5).map((activity) => ({
      label: `${activity.status === 'completed' ? 'Done' : activity.status === 'in_progress' ? 'In progress' : 'Not started'} · ${activity.title}`,
      text: `${activity.category}, about ${activity.minutes} minutes.`
    })),
    suggestions: ['What skills should I improve?', 'What should I do next?', 'What other options do I have?'],
    sources: [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildAssessmentHelp(): GuidanceAnswer {
  return {
    topic: 'assessment',
    title: 'How the assessment and scoring work',
    paragraphs: [
      'The questionnaire has 20 items across interests, strengths, work style, preferences and readiness. Answers give points to ten dimensions; each dimension becomes a percentage of what was attainable in that attempt.',
      'Each strand has a published weighting of those dimensions. The alignment index is the weighted average on a 0–100 scale. It is deterministic: the same answers always produce the same result, with no AI in the scoring path.',
      'Every submitted attempt keeps the questionnaire version and algorithm version it was scored with. A post-assessment compares your current answers with your baseline and reports differences without claiming that anything caused them.'
    ],
    points: [
      { label: 'Pre-assessment', text: 'Your baseline. It unlocks the post-assessment and the improvement programme.' },
      { label: 'Post-assessment', text: 'The same questionnaire later. Differences are descriptive, not proof of improvement.' },
      { label: 'Retakes', text: 'Starting a new assessment never overwrites an old one; all attempts stay in your history.' },
      { label: 'Limits', text: 'The questionnaire is a technical draft, not a validated psychological test. It does not diagnose or predict success.' }
    ],
    suggestions: ['What should I do next?', 'Why was my top strand recommended?', 'Where is my data stored?'],
    sources: [KB_SOURCE],
    groundedOnAssessment: false
  };
}

function buildFaq(faq: FaqKnowledge): GuidanceAnswer {
  return {
    topic: `faq-${faq.id}`,
    title: faq.question.replace(/\?$/, ''),
    paragraphs: faq.paragraphs,
    points: faq.points,
    suggestions: faq.suggestions ?? DEFAULT_SUGGESTIONS,
    sources: [KB_SOURCE],
    groundedOnAssessment: false
  };
}

function buildUnsupported(text: string): GuidanceAnswer {
  return {
    topic: 'unsupported',
    title: 'That is outside what I can answer',
    paragraphs: [
      `I could not match “${text.trim().slice(0, 140)}” to anything in the STRANDPATH knowledge base, so I will not guess at an answer.`,
      'I can help with senior high strands, college programmes and their typical preparation, careers, skills to develop, how the assessment works, and how to read your own results. I cannot check your school’s current offerings, admission deadlines, tuition, scholarships or personal circumstances — those need a person.'
    ],
    points: [
      { label: 'Try a strand question', text: '“What is the difference between STEM and ICT?” or “What careers are related to HUMSS?”' },
      { label: 'Try a decision question', text: '“I am still undecided. Can you help me?” or “What other options do I have?”' },
      { label: 'Ask about your results', text: '“Why was my top strand recommended?” or “What skills should I improve?”' }
    ],
    suggestions: TOPICS.slice(0, 4).map((topic) => topic.prompt),
    sources: [KB_SOURCE],
    groundedOnAssessment: false,
    unsupported: true
  };
}

/* --------------------------------------------------- adaptive development help */

function weakestDimension(context: GuidanceContext): { label: string; percent: number } | null {
  const fromDevelopment = context.development?.weakest?.[0];
  if (fromDevelopment) return { label: fromDevelopment.label, percent: fromDevelopment.percent };
  const fromAssessment = context.latest?.development?.[0];
  if (fromAssessment) return { label: fromAssessment.label, percent: fromAssessment.percent };
  return null;
}

function strongestDimension(context: GuidanceContext): { label: string; percent: number } | null {
  const fromDevelopment = context.development?.strongest?.[0];
  if (fromDevelopment) return fromDevelopment;
  const fromAssessment = context.latest?.strengths?.[0];
  if (fromAssessment) return { label: fromAssessment.label, percent: fromAssessment.percent };
  return null;
}

function developmentCategory(key: string): string {
  const categories: Record<string, string> = {
    scientific: 'scientific',
    'science & investigation': 'scientific',
    analytical: 'analytical',
    'analysis & problem solving': 'analytical',
    numerical: 'numerical',
    'numbers & data': 'numerical',
    technical: 'technical',
    'technology & systems': 'technical',
    creative: 'creative',
    'creativity & design': 'creative',
    communication: 'communication',
    'communication & language': 'communication',
    social: 'social',
    'people & community': 'social',
    enterprise: 'enterprise',
    'business & organisation': 'enterprise',
    practical: 'practical',
    'hands-on & practical work': 'practical',
    persistence: 'persistence',
    'persistence & self-direction': 'persistence'
  };
  return categories[key.toLowerCase()] ?? 'analytical';
}

function practiceSuggestion(label: string, step = 0) {
  const category = developmentCategory(label);
  const options = activitiesForCategory(category, 2);
  const activity = options[step % Math.max(1, options.length)];
  return activity ? `${activity.title} (${activity.minutes} minutes)` : null;
}

function buildReadiness(context: GuidanceContext): GuidanceAnswer {
  const development = context.development;
  const strand = getStrand(context.selectedStrand ?? '') ?? null;
  const latest = context.latest;

  if (!development) {
    return {
      topic: 'readiness',
      title: strand ? `Readiness for ${strand.code}` : 'Readiness starts with a chosen strand',
      paragraphs: strand
        ? [
            `Your current readiness for ${strand.code} comes from your latest assessment. The development pathway also tracks what you have demonstrated through completed activities and their knowledge checks.`,
            'Open “My Development Journey” to see the five stages, their checkpoints and what evidence is still missing. A percentage is never a prediction of admission or success.'
          ]
        : [
            'Readiness is measured against a strand you choose, not in general. Take the pre-assessment, review your results, then choose the strand you want to develop toward.',
            'After that, your journey page shows two numbers: how closely today\'s answers match the strand, and how much of the pathway\'s evidence you have actually collected.'
          ],
      points: latest
        ? [`Your latest assessment ranks ${latest.ranked[0]?.code ?? 'a strand'} first at ${latest.ranked[0]?.score.toFixed(1) ?? '—'} of 100. That is a starting point, not a readiness verdict.`].map(
            (text) => ({ label: 'From your assessment', text })
          )
        : [{ label: 'First step', text: 'Complete the pre-assessment to establish a baseline.' }],
      suggestions: strand
        ? ['What should I do next?', 'What is in my improvement plan?', 'How does the assessment work?']
        : ['What strand is suitable for me?', 'What should I do next?', 'How does the assessment work?'],
      sources: latest ? assessmentSource(context) : [KB_SOURCE],
      groundedOnAssessment: Boolean(latest)
    };
  }

  const points: GuidancePoint[] = [
    {
      label: `Current readiness — ${development.currentReadiness}/100`,
      text: `This is the weighted match between your latest assessment answers and ${development.strandCode}. It can be high while your skills are still developing, or lower while you are already building them.`
    },
    {
      label: `Pathway evidence — ${development.targetReadiness}%`,
      text: `That is how much of ${development.strandCode}'s defined requirements has evidence behind it: assessment answers plus completed activities and knowledge checks.`
    },
    {
      label: `Current stage — ${development.stageName}`,
      text: `${development.completedActivities} ${
        development.completedActivities === 1 ? 'activity is' : 'activities are'
      } recorded and ${development.remainingActivities} ${
        development.remainingActivities === 1 ? 'is' : 'are'
      } still in your plan. Stages are completed by evidence, not by time spent.`
    }
  ];
  if (development.weakest[0]) {
    points.push({
      label: 'The gap the pathway is targeting',
      text: `${development.weakest[0].label} is at ${development.weakest[0].percent}% against a ${development.weakest[0].target}% stage target. That is practice, not a fixed limit.`
    });
  }
  if (development.nextAction) {
    points.push({ label: 'Next step', text: `${development.nextAction.label}. ${development.nextAction.detail}` });
  }
  return {
    topic: 'readiness',
    title: `Where you are in ${development.strandCode}`,
    paragraphs: [
      `You are in the ${development.stageName} stage of your ${development.strandCode} pathway, with ${development.progressPercent}% of the pathway's readiness criteria met.`,
      '100% would mean every checkpoint has evidence and a follow-up assessment is submitted. It would not mean guaranteed admission, guaranteed success, or a permanent label — only that the defined STRANDPATH criteria were satisfied.'
    ],
    points,
    suggestions: ['What should I do next?', 'What skills should I improve?', 'What is in my improvement plan?', 'What other options do I have?'],
    sources: assessmentSource(context),
    groundedOnAssessment: Boolean(latest)
  };
}

function buildStruggle(context: GuidanceContext, repeat: number): GuidanceAnswer {
  const weak = weakestDimension(context);
  const strand = getStrand(context.selectedStrand ?? '') ?? null;
  const label = weak?.label ?? 'the topic you are working on';
  const practice = practiceSuggestion(label, repeat);
  const second = practiceSuggestion(label, repeat + 1);

  if (repeat > 0) {
    return {
      topic: 'struggle',
      title: `A different way to practise ${label.toLowerCase()}`,
      paragraphs: [
        `Repeating the same explanation is not working, so let's change the approach rather than the effort. This is about the method, not about you being unable to learn it.`,
        'Try working backwards from a finished example, then rebuild it without looking. If that is still hard, shrink the task until it takes ten minutes and finish that smaller piece.'
      ],
      points: [
        { label: '1. Find a worked example', text: `Take one solved example of ${label.toLowerCase()} and label every step in your own words.` },
        { label: '2. Rebuild it from memory', text: 'Close the example and reproduce it. Where you stall is the exact step to practise.' },
        { label: '3. Do one small piece', text: practice ? `Try “${practice}” and stop after the first part if you need to.` : 'Do ten minutes, then write one line about what blocked you.' }
      ],
      suggestions: [
        'What skills should I improve?',
        'How ready am I for my chosen strand?',
        'What should I do next?'
      ],
      sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
      groundedOnAssessment: Boolean(context.latest)
    };
  }

  const points: GuidancePoint[] = [
    {
      label: '1. Name the exact step',
      text: `Write the last thing you understood and the first thing you did not. “${label}” is usually several smaller steps, and only one of them is blocking you.`
    },
    {
      label: '2. Use a concrete example',
      text: strand
        ? `Connect it to something you already do in ${strand.code}: ${list(strand.subjects.slice(0, 2))}. A worked example you can point at beats a definition.`
        : 'Use a worked example you can point at. A definition alone rarely fixes a blocked step.'
    },
    {
      label: '3. Do a smaller version',
      text: practice ? `Try “${practice}”. Finish it badly before you try to finish it well.` : 'Do a ten-minute version of the task and write down where it broke.'
    }
  ];
  if (second) {
    points.push({ label: 'If that is still too much', text: `Drop to “${second}” and come back to the harder one tomorrow.` });
  }
  return {
    topic: 'struggle',
    title: weak ? `Let's break ${label.toLowerCase()} into smaller steps` : 'Let’s make this smaller and more concrete',
    paragraphs: [
      weak
        ? `“${label}” is your lowest evidence area right now at about ${Math.round(weak.percent)}%. That is useful information, not a verdict — it tells us exactly where practice will help most.`
        : 'I do not have a scored dimension to point at yet, so I will keep this general rather than pretend to know your specific gap.',
      'Struggling with a step usually means the step is too large, not that you cannot learn it. Break it down, use a concrete example, and finish something small today.'
    ],
    points,
    suggestions: [
      'Explain it in a different way',
      'Give me an easier practice activity',
      'How ready am I for my chosen strand?',
      'What should I do next?'
    ],
    sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildChallenge(context: GuidanceContext): GuidanceAnswer {
  const strong = strongestDimension(context);
  const label = strong?.label ?? 'your strongest area';
  const category = developmentCategory(label);
  const activities = activitiesForCategory(category, 2);
  const advanced = activities[1] ?? activities[0];
  const strand = getStrand(context.selectedStrand ?? '') ?? null;

  const points: GuidancePoint[] = [
    {
      label: 'Skip the beginner version',
      text: `Your evidence in ${label.toLowerCase()} is already ${strong ? `${Math.round(strong.percent)}%` : 'relatively strong'}, so repeat the foundation only if a specific step fails.`
    },
    {
      label: 'Raise the constraint',
      text: advanced
        ? `Take “${advanced.title}” and add one constraint: a time limit, a smaller budget, or a requirement that someone else can use the result without asking you a question.`
        : 'Take a task you can already do and add a time limit, a resource limit, or an audience who must understand it unaided.'
    },
    {
      label: 'Apply it to the strand',
      text: strand
        ? `Build something that uses ${list(strand.skills.slice(0, 2))} in ${strand.code}. Application is what turns a strength into evidence.`
        : 'Apply the skill to a finished piece of work rather than another exercise.'
    }
  ];
  if (context.programme) {
    const remaining = context.programme.activities.filter((activity) => activity.status !== 'completed');
    if (remaining.length) {
      points.push({
        label: 'Do not repeat what is done',
        text: `You still have ${remaining.length} activities in ${context.programme.name}. Skip anything that only repeats ${label.toLowerCase()} at the beginner level.`
      });
    }
  }
  return {
    topic: 'challenge',
    title: `A harder challenge for ${label.toLowerCase()}`,
    paragraphs: [
      'If the current work feels easy, the useful next step is not more of the same — it is a task with a real constraint and an audience.',
      'Difficulty should come from the application, not from jumping to content you have not been taught. If a harder task fails, you will still learn more than from repeating a worksheet.'
    ],
    points,
    suggestions: ['How ready am I for my chosen strand?', 'What should I do next?', 'What skills should I improve?'],
    sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildDiscouraged(context: GuidanceContext): GuidanceAnswer {
  const next = context.development?.nextAction;
  const strand = getStrand(context.selectedStrand ?? '') ?? null;
  return {
    topic: 'discouraged',
    title: 'This is difficult — that does not mean you cannot do it',
    paragraphs: [
      'Feeling stuck or discouraged is a normal response to work that is genuinely hard. It is not evidence that you chose the wrong strand, and it is not a judgement about your ability.',
      'I will not tell you it is easy, because it is not. What helps is making the next step small enough to finish today, and then looking at what actually changed.'
    ],
    points: [
      next
        ? { label: 'One small step', text: `${next.label}. ${next.detail}` }
        : { label: 'One small step', text: 'Open your plan and do the first unfinished activity for ten minutes. You can stop after that.' },
      { label: 'Keep the evidence', text: 'Write one sentence about what you tried. Progress records are for you, not for a grade.' },
      strand
        ? { label: 'Your choice still stands', text: `You chose ${strand.code} for a reason. The pathway exists to build the skills, not to test whether you already have them.` }
        : { label: 'You are allowed to change direction', text: 'If the strand stops fitting, you can choose another without losing the work you have already done.' },
      { label: 'Talk to a person', text: 'If this is affecting more than schoolwork, speak with a trusted adult or your school guidance office. I am a guidance tool, not a counsellor.' }
    ],
    suggestions: ['What should I do next?', 'How ready am I for my chosen strand?', 'I am stuck on this topic. Can you explain it more simply?'],
    sources: [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildSwitchPrompt(context: GuidanceContext): GuidanceAnswer {
  const current = getStrand(context.selectedStrand ?? '');
  const transferable = context.development?.transferableSkills ?? [];
  return {
    topic: 'switch',
    title: 'Changing strands without losing progress',
    paragraphs: [
      current
        ? `You are currently developing toward ${current.code}. Changing your target does not erase completed activities, assessments or checkpoints — they stay in your record, and any skill the new pathway needs is reused.`
        : 'Changing your target does not erase completed activities or assessments; they stay in your record and are reused where the new pathway needs them.',
      'Tell me which strand you are considering and I will compare it with your current pathway: what carries over, what you would add, and how the plan would be recalculated.'
    ],
    points: [
      {
        label: 'What carries over',
        text: transferable.length
          ? `${list(transferable)} from your completed work. A new pathway starts at your current level rather than from zero.`
          : 'Completed activities stay in your record. Once you practise a dimension, it counts wherever the new pathway uses it.'
      },
      {
        label: 'What changes',
        text: 'The new strand has its own requirements. Stages you can already evidence are skipped; the rest start from your current evidence.'
      },
      {
        label: 'Deciding',
        text: 'Compare what you would study for two years, not only the score. Talk it through with your adviser before changing the target if you are unsure.'
      }
    ],
    suggestions: [
      'Compare ICT and HUMSS',
      'What strand is suitable for me?',
      'How ready am I for my chosen strand?',
      'What should I do next?'
    ],
    sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

function buildSwitch(context: GuidanceContext, strand: StrandKnowledge, text: string): GuidanceAnswer {
  const current = getStrand(context.selectedStrand ?? '');
  if (!current || current.slug === strand.slug) {
    const detail = buildStrandDetail(strand, context);
    if (current) {
      detail.paragraphs.push(
        `You are already developing toward ${current.code}. If you want a different target, choose it on your results page; your records stay and the plan is rebuilt around the new requirements.`
      );
    }
    return { ...detail, topic: 'switch', title: `${strand.code} and your current pathway` };
  }

  const sharedSkills = current.skills.filter((skill) => strand.skills.includes(skill));
  const sharedFields = current.collegeFields.filter((field) => strand.collegeFields.includes(field));
  const transferable = context.development?.transferableSkills ?? [];
  const needed = strand.skills.filter((skill) => !current.skills.includes(skill));

  const points: GuidancePoint[] = [
    { label: `${strand.code} in one line`, text: strand.tagline },
    {
      label: 'What carries over',
      text: `${transferable.length ? `${list(transferable)} from your completed work, plus ` : ''}${sharedSkills.length ? list(sharedSkills) : 'general study habits'}. Changing strands does not erase completed activities.`
    },
    {
      label: 'What you would add',
      text: needed.length ? list(needed.slice(0, 4)) + '.' : 'Most of the skill base overlaps; the difference is mainly the subjects and projects.'
    },
    {
      label: 'What changes in the plan',
      text: `Your new pathway is recalculated from ${strand.code}'s requirements. Stages you can already evidence are skipped; the rest start at your current level.`
    }
  ];
  if (sharedFields.length) {
    points.push({ label: 'Where the two overlap in college', text: list(sharedFields.slice(0, 3)) + '.' });
  }
  const currentScore = context.latest ? score(context.latest, current.slug) : null;
  const newScore = context.latest ? score(context.latest, strand.slug) : null;
  const paragraphs = [
    `You are currently developing toward ${current.code}. ${strand.code} is a real option, and choosing it would not waste the work you have done.`,
    strand.summary
  ];
  if (currentScore && newScore) {
    paragraphs.push(
      `On your latest assessment, ${current.code} scored ${currentScore.score.toFixed(1)} and ${strand.code} scored ${newScore.score.toFixed(1)}. The lower score means more to build, not that the door is closed.`
    );
  }
  if (context.development) {
    paragraphs.push(
      `Your current pathway evidence is ${context.development.targetReadiness}%. A switch keeps completed activities as evidence wherever the new pathway uses the same dimensions.`
    );
  }
  const asksAboutDecision = hasAny(text, [/should i (switch|change)/i, /is it worth/i, /can i still/i, /too late/i]);
  if (asksAboutDecision) {
    paragraphs.push(
      'That decision is yours. Compare what you would study for two years and what you would keep doing on a bad week, then talk it through with your adviser before changing the target.'
    );
  }
  return {
    topic: 'switch',
    title: `Changing from ${current.code} to ${strand.code}`,
    paragraphs,
    points,
    suggestions: [
      `Compare ${current.code} and ${strand.code}`,
      `What careers are related to ${strand.code}?`,
      'What should I do next?',
      'How ready am I for my chosen strand?'
    ],
    sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
    groundedOnAssessment: Boolean(context.latest)
  };
}

/* --------------------------------------------------------------- the session */

export interface GuidanceSession {
  ask(input: string): GuidanceAnswer;
  reset(): void;
  readonly lastTopic: string | null;
}

export function createGuidanceSession(context: GuidanceContext = {}): GuidanceSession {
  let lastTopic: string | null = null;
  let pendingSecondStrand: StrandKnowledge | null = null;
  const askedTopics: Record<string, number> = {};

  const remember = (answer: GuidanceAnswer, _strands?: StrandKnowledge[]): GuidanceAnswer => {
    lastTopic = answer.topic;
    return answer;
  };

  function ask(raw: string): GuidanceAnswer {
    const text = normalise(raw);
    if (!text) {
      return remember(buildUnsupported(''));
    }

    // A pending comparison: the student was asked for a second strand.
    if (pendingSecondStrand) {
      const next = findStrands(text).filter((strand) => strand.slug !== pendingSecondStrand?.slug);
      if (next.length) {
        const first = pendingSecondStrand;
        pendingSecondStrand = null;
        return remember(buildCompare(context, [first, next[0]], text), [first, next[0]]);
      }
      pendingSecondStrand = null;
    }

    // Short replies that only name a strand after a question about strands.
    const onlyStrand = findStrands(text);
    if (onlyStrand.length === 1 && text.split(' ').length <= 4 && lastTopic && ['fit', 'compare', 'strand'].includes(lastTopic)) {
      return remember(buildStrandDetail(onlyStrand[0], context), onlyStrand);
    }

    // Adaptive development intents. These come before topic lookups so that a
    // student who is stuck, discouraged or under-challenged gets a different
    // response rather than another definition.
    const askingAboutChoice = hasAny(text, [/strand/i, /choose/i, /decid/i, /suitable/i, /track/i]);
    if (!askingAboutChoice) {
      if (hasAny(text, [/give up/i, /can'?t do (this|it|anything)/i, /not smart/i, /i'?m stupid/i, /i will fail/i, /i'?m failing/i, /i'?m bad at (this|everything)/i, /what'?s the point/i, /too far behind/i])) {
        return remember(buildDiscouraged(context));
      }
      if (hasAny(text, [/don'?t (understand|get it)/i, /do not understand/i, /confus(ed|ing)/i, /too (hard|difficult)/i, /struggl(e|ing)/i, /stuck/i, /simpl(e|er|ify)/i, /explain (it |that )?again/i, /make it easier/i, /not getting it/i, /different way/i, /easier (practice|activity|version)/i])) {
        const answer = buildStruggle(context, askedTopics['struggle'] ?? 0);
        askedTopics['struggle'] = (askedTopics['struggle'] ?? 0) + 1;
        return remember(answer);
      }
      if (hasAny(text, [/too easy/i, /boring/i, /already know/i, /mastered/i, /harder challenge/i, /more (advanced|difficult)/i, /challenge me/i, /next level/i, /advanced (work|activity|challenge)/i])) {
        return remember(buildChallenge(context));
      }
    }

    // Readiness, stage and progress against the chosen pathway.
    if (hasAny(text, [/how ready/i, /ready am i/i, /my readiness/i, /readiness for/i, /what stage/i, /which stage/i, /how close am i/i, /how much progress/i, /my development/i, /my pathway/i, /what does 100/i, /meaning of 100/i])) {
      return remember(buildReadiness(context));
    }

    // Switching or comparing against the current pathway.
    if (hasAny(text, [/change (my )?strand/i, /switch (my )?strand/i, /switch to/i, /move to (another|a different) strand/i, /different strand/i, /other strand/i, /transferable/i]) && context.selectedStrand) {
      const target = findStrands(text)[0] ?? null;
      if (target) return remember(buildSwitch(context, target, text));
      return remember(buildSwitchPrompt(context));
    }

    // Social and safety cases first.
    if (/^(hi|hello|hey|good (morning|afternoon|evening)|kamusta|kumusta)\b/.test(text)) {
      return remember(
        {
          topic: 'greeting',
          title: 'Hello — what would you like to work through?',
          paragraphs: [
            'I am the STRANDPATH Strand Assistance guide. I answer from a fixed local knowledge base and, when you have one, from your own assessment results.',
            'You can ask about a strand, a college course, a career, the skills worth building, or why a recommendation came out the way it did.'
          ],
          suggestions: TOPICS.slice(0, 4).map((topic) => topic.prompt),
          sources: [KB_SOURCE],
          groundedOnAssessment: Boolean(context.latest)
        },
        []
      );
    }
    if (/^(thanks|thank you|salamat|ok(ay)?|got it)\b/.test(text) && text.split(' ').length <= 4) {
      return remember(
        {
          topic: 'thanks',
          title: 'You are welcome',
          paragraphs: ['If you want, we can look at your other options or the next step in your plan.'],
          suggestions: ['What other options do I have?', 'What should I do next?', 'What skills should I improve?'],
          sources: [KB_SOURCE],
          groundedOnAssessment: Boolean(context.latest)
        },
        []
      );
    }
    if (hasAny(text, [/suicid/i, /self[- ]?harm/i, /kill myself/i, /depress/i, /panic attack/i, /hopeless/i, /overwhelm/i, /anxious/i])) {
      return remember(buildFaq(faqKnowledge.find((faq) => faq.id === 'emotional-support')!));
    }
    if (hasAny(text, [/weather/i, /solve .*equation/i, /homework answer/i, /diagnose/i, /medical advice/i, /legal advice/i, /tuition fee/i, /scholarship deadline/i, /admission deadline/i, /another school/i])) {
      return remember(buildUnsupported(raw));
    }

    const strands = findStrands(text);
    const programs = findPrograms(text);
    const careers = findCareers(text);
    const latest = context.latest;

    // Fixed topics that would otherwise be caught by a broader keyword below.
    if (/improvement plan|my (plan|programme|program|progress)/i.test(text)) {
      return remember(buildPlan(context));
    }
    if (hasAny(text, [/how (does|do) .*(comput|scor|rank|work)/i, /how .*scoring/i, /algorithm/i])) {
      return remember(buildFaq(faqKnowledge.find((entry) => entry.id === 'how-recommendation-works')!));
    }
    if (/tvl/i.test(text) && hasAny(text, [/speciali/i, /offer/i])) {
      return remember(buildFaq(faqKnowledge.find((entry) => entry.id === 'tvl-specialisations')!));
    }
    if (/college.*(work|job)|work.*college|after grade 12/i.test(text)) {
      return remember(buildFaq(faqKnowledge.find((entry) => entry.id === 'college-vs-work')!));
    }

    // Why did a strand score what it did?
    if (hasAny(text, [/why (was|did|is)/i, /why .*recommend/i, /explain .* (score|rank|recommend)/i, /how did .*(score|rank)/i, /why this strand/i])) {
      const answer = buildWhy(context);
      if (strands.length && latest) {
        const subject = strands[0];
        const detail = buildStrandDetail(subject, context);
        const scoreRow = score(latest, subject.slug);
        if (scoreRow) {
          answer.paragraphs = [
            `${subject.code} scored ${scoreRow.score.toFixed(1)} (${scoreRow.levelLabel.toLowerCase()}), rank #${scoreRow.rank} on assessment #${latest.id}.`,
            scoreRow.explanation
          ];
          answer.points = detail.points;
          answer.title = `Why ${subject.code} scored ${scoreRow.score.toFixed(1)}`;
          answer.groundedOnAssessment = true;
          answer.sources = assessmentSource(context);
        }
      }
      return remember(answer, strands);
    }

    // Comparisons.
    const compareWords = hasAny(text, [/compare/i, /difference/i, / versus /i, / vs /i, /which is better/i]);
    const hasAcademicIntent = hasAny(text, [/career/i, /job/i, /course/i, /college/i, /degree/i, /program/i, /skill/i]);
    const compareByList = !hasAcademicIntent && strands.length >= 2 && / and | or /.test(text);
    if ((compareWords || compareByList) && (strands.length >= 2 || (strands.length === 1 && compareWords) || (programs.length >= 2))) {
      if (strands.length >= 2) return remember(buildCompare(context, strands, text));
      if (strands.length === 1) {
        pendingSecondStrand = strands[0];
        const other = context.selectedStrand && context.selectedStrand !== strands[0].slug ? getStrand(context.selectedStrand) : null;
        if (other) return remember(buildCompare(context, [strands[0], other], text), [strands[0], other]);
        return remember(
          {
            topic: 'compare',
            title: `Compare ${strands[0].code} with which strand?`,
            paragraphs: [`Name the second strand and I will compare the subjects, skills, college doors and trade-offs with ${strands[0].code}.`],
            suggestions: strandKnowledge
              .filter((strand) => strand.slug !== strands[0].slug)
              .slice(0, 4)
              .map((strand) => `Compare ${strands[0].code} and ${strand.code}`),
            sources: [KB_SOURCE],
            groundedOnAssessment: false
          },
          strands
        );
      }
    }

    // College programmes.
    if (hasAny(text, [/college/i, /course/i, /program(me)?s?\b/i, /degree/i, /take after/i, /study after/i, /what can i take/i])) {
      return remember(buildPrograms(context, strands[0] ?? null, text));
    }

    // Careers.
    if (hasAny(text, [/career/i, /job/i, /work as/i, /profession/i, /employment/i, /what can i (be|do)/i]) || (careers.length && hasAny(text, [/become/i, /involve/i, /day/i]))) {
      return remember(buildCareers(context, strands, programs, careers, text));
    }

    // Skills and strengths.
    if (hasAny(text, [/skill/i, /strength/i, /improve/i, /weak/i, /better at/i, /develop/i])) {
      if (hasAny(text, [/improve .*strand/i, /prepare for/i]) && (strands.length || context.selectedStrand)) {
        const strand = strands[0] ?? getStrand(context.selectedStrand ?? '') ?? null;
        if (strand) {
          const practice = [...new Set([...strand.skills.slice(0, 3)])];
          return remember(
            {
              topic: 'skills',
              title: `Skills worth building for ${strand.code}`,
              paragraphs: [
                `${strand.code} leans on ${list(practice)}. These are learnable, and the point of the improvement programme is to practise them rather than wait until you feel ready.`,
                'Pick one skill and one activity; doing two weeks of practice beats reading ten lists.'
              ],
              points: strand.skills.slice(0, 4).map((skill) => ({ label: skill, text: `Practice it through ${list(strand.subjects.slice(0, 2))} tasks and a small project you finish.` })),
              suggestions: ['What skills should I improve?', 'What is in my improvement plan?', 'What should I do next?'],
              sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
              groundedOnAssessment: Boolean(context.latest)
            },
            strands
          );
        }
      }
      return remember(buildSkills(context));
    }

    // Alternatives and undecided students.
    if (hasAny(text, [/undecided/i, /not sure/i, /confused/i, /can't decide/i, /cannot decide/i, /other option/i, /alternative/i, /backup/i, /plan b/i, /multiple interest/i, /several interest/i])) {
      if (hasAny(text, [/other option/i, /alternative/i, /backup/i, /plan b/i]) && latest) {
        return remember(buildAlternatives(context));
      }
      return remember(buildFaq(faqKnowledge.find((faq) => faq.id === 'undecided')!));
    }

    // Plan and programme.
    if (hasAny(text, [/my (plan|programme|program|progress|activities)/i, /improvement plan/i, /activities/i, /programme/i, /program\b/i]) && !hasAny(text, [/course/i, /college/i, /degree/i])) {
      return remember(buildPlan(context));
    }

    // Next steps.
    if (hasAny(text, [/what should i do/i, /next step/i, /what now/i, /how do i (start|begin)/i, /prepare/i, /where do i (start|begin)/i])) {
      return remember(buildNextSteps(context));
    }

    // Assessment mechanics.
    if (hasAny(text, [/assessment/i, /questionnaire/i, /scor(e|ing)/i, /algorithm/i, /result/i, /retake/i, /post[- ]assessment/i])) {
      if (hasAny(text, [/where .*result/i, /find .*result/i])) {
        return remember(
          {
            topic: 'assessment',
            title: 'Finding your results',
            paragraphs: [
              'Your latest submitted results are under “Your Suggested Strands” in the student menu. Earlier attempts are under “My Previous Assessments”.',
              'Each attempt opens with its scores, explanations and evidence, and a post-assessment also shows the comparison with its baseline.'
            ],
            suggestions: ['Why was my top strand recommended?', 'What skills should I improve?', 'What should I do next?'],
            sources: context.latest ? assessmentSource(context) : [KB_SOURCE],
            groundedOnAssessment: Boolean(context.latest)
          },
          strands
        );
      }
      if (hasAny(text, [/how (does|do) .*work/i, /scor(e|ing)/i, /algorithm/i, /how .* comput/i])) {
        return remember(buildFaq(faqKnowledge.find((faq) => faq.id === 'how-recommendation-works')!));
      }
      return remember(buildAssessmentHelp());
    }

    // Strand suitability.
    if (hasAny(text, [/what strand/i, /which strand/i, /suitable/i, /fit(s|ted)? me/i, /for me/i, /recommend/i, /should i (take|choose)/i, /consider/i, /what (track|strand) (should|do)/i, /i (like|enjoy|love|hate|struggle)/i, /choose between/i, /how do i choose/i]) || (strands.length && !programs.length && !careers.length)) {
      if (strands.length === 1 && !hasAny(text, [/suitable/i, /fit/i, /for me/i, /recommend/i, /should i/i])) {
        return remember(buildStrandDetail(strands[0], context));
      }
      return remember(fitFromInterests(context, text), strands);
    }

    // Specific entities without a stronger intent.
    if (programs.length) return remember(buildProgramDetail(programs[0], context));
    if (careers.length && !strands.length) return remember(buildCareers(context, [], [], careers, text));
    if (strands.length === 1) return remember(buildStrandDetail(strands[0], context));
    if (strands.length > 1) return remember(buildCompare(context, strands, text));

    // Fixed FAQ topics.
    const faq =
      (/track/i.test(text) && hasAny(text, [/difference/i, /strand/i]) && faqKnowledge.find((entry) => entry.id === 'strand-vs-track')) ||
      (/tvl/i.test(text) && hasAny(text, [/speciali/i, /offer/i, /courses/i]) && faqKnowledge.find((entry) => entry.id === 'tvl-specialisations')) ||
      (/math/i.test(text) && hasAny(text, [/not good/i, /weak/i, /hate/i]) && faqKnowledge.find((entry) => entry.id === 'not-good-at-math')) ||
      (/humss/i.test(text) && hasAny(text, [/after/i, /do/i]) && faqKnowledge.find((entry) => entry.id === 'after-humss')) ||
      (/college.*(work|job)|work.*college|after grade 12/i.test(text) && faqKnowledge.find((entry) => entry.id === 'college-vs-work')) ||
      (/every school|offer.*strand|available/i.test(text) && faqKnowledge.find((entry) => entry.id === 'school-offerings')) ||
      (/privacy|data|stored|storage|localStorage/i.test(text) && faqKnowledge.find((entry) => entry.id === 'privacy'));
    if (faq) return remember(buildFaq(faq));

    // Explain the CV-like basics if the question names a track.
    const track = TRACKS.find((entry) => text.includes(entry.name.toLowerCase().split(' ')[0]) && text.includes('track'));
    if (track) {
      return remember(
        {
          topic: 'track',
          title: track.name,
          paragraphs: [track.description],
          points: track.strands.map((slug) => ({
            label: getStrand(slug)?.code ?? slug,
            text: getStrand(slug)?.tagline ?? ''
          })),
          suggestions: ['What strand is suitable for me?', 'What specialisations does TVL have?', 'Compare STEM and ICT'],
          sources: [KB_SOURCE],
          groundedOnAssessment: Boolean(context.latest)
        },
        []
      );
    }

    return remember(buildUnsupported(raw));
  }

  return {
    ask,
    reset() {
      lastTopic = null;
      pendingSecondStrand = null;
      for (const key of Object.keys(askedTopics)) delete askedTopics[key];
    },
    get lastTopic() {
      return lastTopic;
    }
  };
}

export { DISCLAIMER, TOPICS };
