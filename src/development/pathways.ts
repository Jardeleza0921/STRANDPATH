/**
 * Strand development pathways.
 *
 * Every strand has five stages (Foundation → Target Readiness). Each stage
 * names the dimensions it asks the student to demonstrate, the evidence
 * threshold, a checkpoint, and the kind of strand-specific work that builds it.
 * Content is written per strand: an ICT pathway talks about computers, an ABM
 * pathway talks about budgets, and so on.
 */
import { STRANDS, CATEGORIES } from '../../shared/content.js';
import type { Pathway, PathwayStage, StageModule, StageRequirement } from './types';

type StageSpec = {
  name: string;
  summary: string;
  checkpoint: string;
  modules: [string, string, number][];
};

type StrandPathwaySpec = {
  stages: [StageSpec, StageSpec, StageSpec, StageSpec, StageSpec];
};

const STAGE_IDS = ['foundation', 'developing', 'competence', 'advanced', 'target'] as const;
const STAGE_TARGETS = [35, 50, 65, 78, 85];
const STAGE_REQUIREMENT_COUNTS = [2, 3, 4, 4, 4];

const SPECS: Record<string, StrandPathwaySpec> = {
  stem: {
    stages: [
      {
        name: 'Foundation',
        summary: 'Rebuild the mathematics and observation habits that STEM assumes, starting below your current level.',
        checkpoint: 'Finish one worked-example set and one observation log without skipping steps.',
        modules: [
          ['Mathematics foundations', 'Work through operations, fractions, ratios and simple algebra with one worked example per idea.', 25],
          ['Observation and measurement', 'Measure something real and record units, uncertainty and two possible sources of error.', 20],
          ['Science talk', 'Explain one everyday phenomenon in five sentences using evidence, not opinion.', 15]
        ]
      },
      {
        name: 'Developing',
        summary: 'Apply the basics to short investigations and structured problem sets.',
        checkpoint: 'Complete a short investigation with a table of results and a one-paragraph conclusion.',
        modules: [
          ['Scientific reasoning', 'Turn a question into a testable hypothesis and name the variable you would change.', 30],
          ['Problem-solving sets', 'Solve three multi-step problems and write the reasoning beside each step.', 30],
          ['Data interpretation', 'Read a graph or table and write two claims it supports and one it does not.', 20]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Combine mathematics, science and analysis in a single piece of work.',
        checkpoint: 'Submit a mini-investigation with data, calculations and a limitation you noticed.',
        modules: [
          ['Mini experiment write-up', 'Run a small experiment at home or school and write it up in the standard structure.', 45],
          ['Quantitative analysis', 'Calculate an average, a percentage change and explain what each one hides.', 30],
          ['Evidence-based argument', 'Defend a conclusion from data and state one alternative explanation.', 25]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Work on longer, less guided problems and check your own reasoning.',
        checkpoint: 'Complete an advanced problem set or project and explain your method to someone else.',
        modules: [
          ['Extended problem set', 'Take on problems that need two or more concepts and document your planning.', 45],
          ['Technical challenge', 'Build or model something that has to meet a measurable constraint.', 60],
          ['Peer explanation', 'Teach one STEM idea to a classmate and note the question you could not answer.', 25]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Show that your methods hold up under a fresh, unseen task and a follow-up assessment.',
        checkpoint: 'A follow-up assessment plus one independent piece of work you can defend.',
        modules: [
          ['Independent investigation', 'Choose your own question, design the method and present the result.', 60],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Portfolio check', 'Collect three pieces of work that show progress and label the skill each one proves.', 20]
        ]
      }
    ]
  },
  abm: {
    stages: [
      {
        name: 'Foundation',
        summary: 'Build financial literacy and business vocabulary before using either in a plan.',
        checkpoint: 'Complete a personal or family budget and explain every line.',
        modules: [
          ['Financial literacy', 'Track income and spending for a week, then sort the expenses into needs and wants.', 25],
          ['Basic accounting ideas', 'Learn assets, liabilities, income and expense with one everyday example each.', 20],
          ['Business vocabulary', 'Explain profit, margin, capital and cash flow in your own words.', 15]
        ]
      },
      {
        name: 'Developing',
        summary: 'Use numbers to make a simple business decision and explain it to someone else.',
        checkpoint: 'Present a decision with a budget, two options and a reason for the choice.',
        modules: [
          ['Budgeting exercise', 'Plan a small event budget with a contingency line and a break-even point.', 30],
          ['Business decision-making', 'Compare two suppliers or options using cost, risk and convenience.', 25],
          ['Customer thinking', 'Write three questions you would ask a customer before selling them anything.', 20]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Turn an idea into a small, costed venture with a clear customer.',
        checkpoint: 'A one-page business plan with costs, price and a realistic sales estimate.',
        modules: [
          ['Entrepreneurship basics', 'Describe a product, its customer and why they would pay for it.', 30],
          ['Costing and pricing', 'Calculate unit cost, set a price and show the margin at three sales volumes.', 35],
          ['Pitch practice', 'Deliver a 90-second pitch and answer two questions about the numbers.', 25]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Run the numbers on a real or simulated operation and defend the assumptions.',
        checkpoint: 'A financial summary you can explain line by line, including one risk.',
        modules: [
          ['Record keeping', 'Keep a simple ledger for two weeks and reconcile it against receipts.', 40],
          ['Market analysis', 'Survey five potential customers and report what the answers do and do not prove.', 35],
          ['Operations challenge', 'Plan staffing, stock and timing for a one-day selling activity.', 40]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Demonstrate that you can plan, cost and reassess a venture honestly.',
        checkpoint: 'A follow-up assessment plus a venture review with what you would change.',
        modules: [
          ['Venture review', 'Compare your plan with what actually happened and name three causes.', 40],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Portfolio check', 'Collect a budget, a plan and a review that show the skills you claim.', 20]
        ]
      }
    ]
  },
  humss: {
    stages: [
      {
        name: 'Foundation',
        summary: 'Strengthen reading, listening and clear expression before taking on complex arguments.',
        checkpoint: 'Summarise a short text and an interview accurately, without adding your opinion.',
        modules: [
          ['Reading comprehension', 'Read a short article and write its main claim, two supporting points and one gap.', 25],
          ['Listening practice', 'Interview someone about a decision and summarise their view without advising them.', 25],
          ['Clear writing', 'Rewrite a confusing paragraph so a younger student could follow it.', 20]
        ]
      },
      {
        name: 'Developing',
        summary: 'Practise building an argument and understanding a different point of view.',
        checkpoint: 'Write a short argument and a fair summary of the opposing side.',
        modules: [
          ['Critical thinking', 'Separate fact, interpretation and opinion in a news story.', 25],
          ['Writing and argumentation', 'Write 250 words with a claim, evidence and a counter-argument.', 35],
          ['Social awareness', 'Describe how one community issue affects three different groups.', 25]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Research a social question and communicate it to a real audience.',
        checkpoint: 'A short research note with sources and a clear conclusion.',
        modules: [
          ['Mini research', 'Interview two people and compare their views on the same issue.', 40],
          ['Communication', 'Present your findings in three minutes and take two questions.', 25],
          ['Perspective-taking', 'Rewrite your argument from the position of someone who disagrees.', 25]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Work with longer sources and a contested question without oversimplifying it.',
        checkpoint: 'A longer piece of writing that handles counter-evidence honestly.',
        modules: [
          ['Extended reading', 'Read two sources that disagree and map where their evidence differs.', 45],
          ['Debate or facilitation', 'Argue one side, then fairly summarise the other.', 30],
          ['Community engagement', 'Join or organise a small activity and record what you observed.', 40]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Show that you can research, write and speak about a question that matters to you.',
        checkpoint: 'A follow-up assessment plus a finished piece you would be willing to share.',
        modules: [
          ['Independent essay', 'Write and revise an essay or feature on a question you chose.', 60],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Portfolio check', 'Collect three pieces that show reading, writing and speaking.', 20]
        ]
      }
    ]
  },
  gas: {
    stages: [
      {
        name: 'Foundation',
        summary: 'Keep several doors open by strengthening the study habits every strand needs.',
        checkpoint: 'Finish a weekly study plan you actually followed for two weeks.',
        modules: [
          ['Study foundations', 'Build a weekly timetable with realistic blocks and one review session.', 20],
          ['Reading across subjects', 'Read one short text from science, one from business and one from the humanities.', 25],
          ['Note-making', 'Turn one lesson into a one-page summary with questions still open.', 20]
        ]
      },
      {
        name: 'Developing',
        summary: 'Try a short task from three different strands before narrowing your direction.',
        checkpoint: 'Complete one small task in each of three strands and compare which felt sustainable.',
        modules: [
          ['Mini science task', 'Collect five measurements and describe the pattern you see.', 25],
          ['Mini business task', 'Build a simple budget for something you want to buy or organise.', 25],
          ['Mini humanities task', 'Write a 200-word response to a current issue with two sources.', 25]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Choose two directions and go deeper so your choice is based on real work.',
        checkpoint: 'A short comparison of two pathways using work you actually did.',
        modules: [
          ['Comparative project', 'Complete one task from each of your two shortlisted strands.', 45],
          ['Decision grid', 'Score your shortlisted strands against criteria you set and weight.', 25],
          ['Ask an adult', 'Interview someone working in one of your shortlisted fields.', 25]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Build one substantial piece of work in your emerging direction.',
        checkpoint: 'A finished project that uses skills from more than one subject area.',
        modules: [
          ['Cross-subject project', 'Combine two subject areas in one finished output.', 60],
          ['Technical challenge', 'Learn a tool or method well enough to explain it to someone else.', 40],
          ['Reflection', 'Write what the project showed you about the work you want to keep doing.', 20]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Commit to a direction with evidence, not guesswork, and reassess.',
        checkpoint: 'A follow-up assessment plus a written reason for your chosen direction.',
        modules: [
          ['Direction statement', 'Write one page on what you chose, why, and what you will do next.', 30],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Portfolio check', 'Collect work from both shortlisted directions and label the skills shown.', 20]
        ]
      }
    ]
  },
  ict: {
    stages: [
      {
        name: 'Foundation',
        summary: 'Get comfortable with the computer as a tool before writing code.',
        checkpoint: 'Complete a digital-literacy checklist and fix one real problem without help.',
        modules: [
          ['Basic computer concepts', 'Learn files, folders, storage, accounts and how to back work up safely.', 20],
          ['Digital literacy', 'Practise searching effectively, checking sources and organising your files.', 20],
          ['Logical thinking', 'Break a daily routine into ordered steps and spot where it can fail.', 20]
        ]
      },
      {
        name: 'Developing',
        summary: 'Start writing small programs and troubleshooting deliberately.',
        checkpoint: 'A working script or page you built, plus a log of the errors you fixed.',
        modules: [
          ['Introduction to programming', 'Write a program that takes input, makes a decision and prints a result.', 40],
          ['Basic troubleshooting', 'Follow a network or device problem from symptom to likely cause.', 25],
          ['Problem-solving practice', 'Solve three small programming exercises and record each mistake.', 35]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Build a small project end to end and make it usable by someone else.',
        checkpoint: 'A working project with a README and one person who used it.',
        modules: [
          ['Progressive coding exercises', 'Add a feature to an existing program without breaking what works.', 45],
          ['Digital media', 'Produce a graphic, short video or interface screen with a clear purpose.', 35],
          ['Testing habits', 'Write down how you would check each part of your project works.', 20]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Take on a project with real constraints and debug unfamiliar problems.',
        checkpoint: 'A project you extended or repaired under a deadline, with notes on trade-offs.',
        modules: [
          ['Project challenge', 'Build something that stores, searches or displays real data.', 60],
          ['Systems thinking', 'Trace how a request moves from a browser to a server and back.', 30],
          ['Peer review', 'Read someone else’s code and give two specific, kind suggestions.', 25]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Show a portfolio and reassess the skills behind it.',
        checkpoint: 'A follow-up assessment plus two projects you can explain line by line.',
        modules: [
          ['Portfolio project', 'Finish and polish one project you would show an employer or school.', 60],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Explain your work', 'Walk someone through a project, including what you would rebuild differently.', 25]
        ]
      }
    ]
  },
  'arts-design': {
    stages: [
      {
        name: 'Foundation',
        summary: 'Build a regular practice and learn to look closely at your own work.',
        checkpoint: 'A week of daily sketches or studies, with three kept for revision.',
        modules: [
          ['Daily practice', 'Make one small study each day and keep them together.', 15],
          ['Observation', 'Draw or describe an object three times, each time noticing more detail.', 20],
          ['Design vocabulary', 'Learn composition, contrast, rhythm and balance with one example each.', 15]
        ]
      },
      {
        name: 'Developing',
        summary: 'Make complete small pieces rather than fragments.',
        checkpoint: 'Two finished pieces with a note on what you changed between drafts.',
        modules: [
          ['Composition study', 'Redesign one poster or layout three ways and say which works best.', 35],
          ['Technique practice', 'Practise one technique deliberately for three short sessions.', 30],
          ['Critique', 'Ask two people what they notice first and compare it with your intention.', 20]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Carry an idea from brief to finished output.',
        checkpoint: 'A finished piece that answers a real brief and survives feedback.',
        modules: [
          ['Brief to output', 'Take a real request and produce a piece that meets it.', 50],
          ['Media production', 'Produce a short video, set of images or interface mock-up.', 45],
          ['Revision', 'Rework a piece after feedback and record what you changed and why.', 30]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Work to a constraint and present the result to an audience.',
        checkpoint: 'A presented piece with your process shown, not only the final output.',
        modules: [
          ['Constrained project', 'Make something with a limited palette, length or format.', 60],
          ['Process documentation', 'Photograph or record the stages of a piece from sketch to finish.', 30],
          ['Presentation', 'Show your work to a small group and answer questions about choices.', 25]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Assemble a portfolio that shows range, finish and reflection.',
        checkpoint: 'A follow-up assessment plus a portfolio of three finished pieces.',
        modules: [
          ['Portfolio assembly', 'Choose three pieces that show different strengths and order them.', 45],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Artist statement', 'Write 150 words on what you make and why.', 20]
        ]
      }
    ]
  },
  sports: {
    stages: [
      {
        name: 'Foundation',
        summary: 'Build a safe, consistent training habit and learn the basics of how the body responds.',
        checkpoint: 'Two weeks of logged training with rest days and a warm-up routine.',
        modules: [
          ['Training log', 'Record sessions, sleep and how you felt for two weeks.', 15],
          ['Warm-up and safety', 'Learn a warm-up and cool-down routine and explain why each matters.', 20],
          ['Body basics', 'Learn how heart rate, breathing and recovery respond to effort.', 20]
        ]
      },
      {
        name: 'Developing',
        summary: 'Train with a purpose and measure something honestly.',
        checkpoint: 'A four-week goal with before-and-after measurements you recorded yourself.',
        modules: [
          ['Goal setting', 'Set one measurable goal and one habit that supports it.', 20],
          ['Fitness testing', 'Measure speed, endurance or strength safely and record the method.', 30],
          ['Technique practice', 'Break one skill into parts and practise each part slowly.', 30]
        ]
      },
      {
        name: 'Building Competence',
        summary: 'Plan and lead a short session for other people.',
        checkpoint: 'A session plan you delivered, with feedback from two participants.',
        modules: [
          ['Session planning', 'Plan a 30-minute session with warm-up, main work and cool-down.', 35],
          ['Coaching communication', 'Give one instruction, one demonstration and one piece of feedback.', 25],
          ['Sports science basics', 'Explain energy, hydration and recovery in plain language.', 30]
        ]
      },
      {
        name: 'Advanced Practice',
        summary: 'Handle a longer training block and a competitive or performance constraint.',
        checkpoint: 'A six-week training block with adjustments recorded along the way.',
        modules: [
          ['Training block', 'Plan six weeks with progression and at least one deload.', 45],
          ['Performance analysis', 'Review your own performance honestly using recorded evidence.', 30],
          ['Officiating or organising', 'Help run a small game or event and note what you learned.', 40]
        ]
      },
      {
        name: 'Target Readiness',
        summary: 'Show sustained practice, safe coaching and a reassessed profile.',
        checkpoint: 'A follow-up assessment plus a training and coaching portfolio.',
        modules: [
          ['Portfolio check', 'Collect your logs, plan and feedback in one place.', 30],
          ['Reassessment preparation', 'Review your lowest dimensions and write what changed and what did not.', 30],
          ['Coaching reflection', 'Write what you would do differently with the next group you lead.', 25]
        ]
      }
    ]
  }
};

function requirementsFor(strandSlug: string, stageIndex: number): StageRequirement[] {
  const strand = STRANDS.find((row) => row.slug === strandSlug);
  const weights: Record<string, number> = strand?.weights ?? {};
  const ranked = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const count = Math.min(STAGE_REQUIREMENT_COUNTS[stageIndex], ranked.length);
  const chosen = ranked.slice(0, count);
  const total = chosen.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  return chosen.map(([category, weight]) => ({
    category,
    label: (CATEGORIES as Record<string, { label: string }>)[category]?.label ?? category,
    target: STAGE_TARGETS[stageIndex],
    weight: weight / total
  }));
}

function modulesFor(strandSlug: string, stageIndex: number): StageModule[] {
  const spec = SPECS[strandSlug];
  if (!spec) return [];
  const requirements = requirementsFor(strandSlug, stageIndex);
  const stage = spec.stages[stageIndex];
  return stage.modules.map(([title, detail, minutes], index) => ({
    title,
    detail,
    minutes,
    category: requirements[index % requirements.length]?.category ?? 'analytical'
  }));
}

export const PATHWAYS: Pathway[] = STRANDS.map((strand) => {
  const spec = SPECS[strand.slug];
  const stages: PathwayStage[] = STAGE_IDS.map((id, index) => {
    const stageSpec = spec?.stages[index];
    return {
      id,
      name: stageSpec?.name ?? id,
      summary: stageSpec?.summary ?? '',
      target: STAGE_TARGETS[index],
      requirements: requirementsFor(strand.slug, index),
      checkpoint: stageSpec?.checkpoint ?? '',
      modules: modulesFor(strand.slug, index),
      requiresPostAssessment: index === STAGE_IDS.length - 1
    };
  });
  return {
    strandSlug: strand.slug,
    code: strand.code,
    name: strand.name,
    tagline: strand.tagline,
    stages
  };
});

export function getPathway(slug: string | null | undefined): Pathway | null {
  if (!slug) return null;
  return PATHWAYS.find((pathway) => pathway.strandSlug === slug) ?? null;
}
