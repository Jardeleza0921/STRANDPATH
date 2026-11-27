import { ACTIVITIES } from '../../../shared/content.js';
import { CATEGORIES } from '../../../shared/content.js';
import type { ActivitySeed } from '../../../shared/content.js';
import { careerKnowledge, careersForProgram, careersForStrand, findCareers } from './careers';
import { faqKnowledge } from './faqs';
import { findPrograms, programKnowledge, programsForStrand } from './programs';
import { findStrands, getStrand, strandKnowledge, TRACKS } from './strands';

export {
  ACTIVITIES,
  CATEGORIES,
  careerKnowledge,
  careersForProgram,
  careersForStrand,
  faqKnowledge,
  findCareers,
  findPrograms,
  findStrands,
  getStrand,
  programKnowledge,
  programsForStrand,
  strandKnowledge,
  TRACKS
};
export type { ActivitySeed };

export const DISCLAIMER =
  'Recommendations here are guidance, not a psychological assessment, a guaranteed admission, or a promise of a career outcome. School offerings and college requirements differ — confirm them with your school.';

export const TOPICS: { id: string; label: string; prompt: string }[] = [
  { id: 'fit', label: 'Which strand fits me?', prompt: 'What strand is suitable for me?' },
  { id: 'why', label: 'Why was my strand recommended?', prompt: 'Why was my top strand recommended for me?' },
  { id: 'compare', label: 'Compare two strands', prompt: 'What is the difference between STEM and ICT?' },
  { id: 'programs', label: 'College courses', prompt: 'What college courses can I take after ICT?' },
  { id: 'careers', label: 'Careers', prompt: 'What careers are related to HUMSS?' },
  { id: 'skills', label: 'Skills to improve', prompt: 'What skills should I improve?' },
  { id: 'undecided', label: 'I am still undecided', prompt: 'I am still undecided. Can you help me?' },
  { id: 'alternatives', label: 'Other options', prompt: 'What other options do I have?' },
  { id: 'readiness', label: 'How ready am I?', prompt: 'How ready am I for my chosen strand?' },
  { id: 'struggle', label: 'I am stuck on a topic', prompt: 'I am stuck on this topic. Can you explain it more simply?' },
  { id: 'challenge', label: 'I need a harder challenge', prompt: 'This is too easy for me. Can you give me a harder challenge?' },
  { id: 'plan', label: 'My improvement plan', prompt: 'What is in my improvement plan?' },
  { id: 'next', label: 'What should I do next?', prompt: 'What should I do next?' },
  { id: 'tvl', label: 'TVL specialisations', prompt: 'What specialisations does TVL have?' },
  { id: 'math', label: 'Computers without maths', prompt: 'I like computers, but I am not good at mathematics. What should I consider?' }
];

/** Interest phrases students actually use, mapped to the strand they suggest. */
export const INTEREST_SIGNALS: { slug: string; label: string; patterns: RegExp[] }[] = [
  {
    slug: 'ict',
    label: 'computers, coding or digital tools',
    patterns: [/computers?/i, /cod(e|ing)/i, /programm/i, /websites?/i, /apps?\b/i, /games?/i, /tech(nology)?/i, /repair/i]
  },
  {
    slug: 'stem',
    label: 'science, mathematics or how things work',
    patterns: [/math/i, /science/i, /experiment/i, /medicine/i, /engineering/i, /research/i, /numbers?/i]
  },
  {
    slug: 'abm',
    label: 'business, money or organising',
    patterns: [/business/i, /money/i, /sell(ing)?/i, /market/i, /account/i, /entrepreneur/i, /budget/i, /manage/i]
  },
  {
    slug: 'humss',
    label: 'people, writing, law or society',
    patterns: [/people/i, /writ(e|ing)/i, /read/i, /law/i, /psycholog/i, /society/i, /help(ing)? others/i, /debate/i, /history/i]
  },
  {
    slug: 'arts-design',
    label: 'drawing, design, music or performance',
    patterns: [/draw/i, /design/i, /art/i, /music/i, /film/i, /photo/i, /perform/i, /anima/i]
  },
  {
    slug: 'sports',
    label: 'sports, fitness or coaching',
    patterns: [/sports?/i, /fitness/i, /coach/i, /athlet/i, /training/i, /basketball/i, /volleyball/i]
  }
];

/** Concrete practice activities from the real activity library for a dimension. */
export function activitiesForCategory(category: string, limit = 2): ActivitySeed[] {
  return ACTIVITIES.filter((activity) => activity.targetCategory === category).slice(0, limit);
}

export function categoryLabel(category: string): string {
  return CATEGORIES[category]?.label ?? category;
}
