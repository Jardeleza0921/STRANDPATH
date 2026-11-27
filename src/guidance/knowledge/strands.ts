import { strands } from '../../data/strands';
import type { StrandKnowledge } from '../types';

/**
 * SHS strand knowledge.
 *
 * Descriptions, subjects, skills and careers come from the same strand records
 * the rest of STRANDPATH displays, so the assistant cannot contradict the
 * strand pages. Aliases exist only to recognise how students type or say the
 * names. Every entry keeps the caveat that school offerings differ.
 */
const ALIASES: Record<string, string[]> = {
  stem: ['stem', 'science technology engineering and mathematics', 'science strand', 'engineering strand', 'med', 'medicine track'],
  abm: ['abm', 'accountancy business and management', 'accountancy', 'business strand', 'business and management', 'entrepreneurship strand'],
  humss: ['humss', 'humanities and social sciences', 'humanities', 'social sciences', 'social science strand', 'humms'],
  gas: ['gas', 'general academic strand', 'general academic', 'general strand'],
  tvl: ['tvl', 'technical vocational livelihood', 'technical vocational', 'tech voc', 'techvoc', 'vocational strand', 'vocational'],
  ict: ['ict', 'information and communications technology', 'information communication technology', 'information technology strand', 'computer strand', 'programming strand', 'it strand'],
  'arts-design': ['arts and design', 'arts & design', 'arts design', 'a&d', 'art strand', 'design strand', 'creative strand'],
  sports: ['sports', 'sports track', 'sports strand', 'athletics strand', 'pe strand']
};

const PARENT: Record<string, string> = { ict: 'tvl' };

export const strandKnowledge: StrandKnowledge[] = strands.map((strand) => ({
  slug: strand.slug,
  code: strand.code,
  name: strand.name,
  track: strand.track,
  tagline: strand.tagline,
  summary: strand.summary,
  subjects: strand.learn,
  skills: strand.skills,
  interests: strand.interests,
  suitedFor: strand.suitedFor,
  collegeFields: strand.collegeFields,
  careers: strand.careerAreas,
  considerations: strand.considerations,
  aliases: ALIASES[strand.slug] ?? [strand.code.toLowerCase(), strand.name.toLowerCase()],
  isSubTrack: Boolean(strand.isSubTrack),
  parentSlug: PARENT[strand.slug]
}));

export const TRACKS = [
  {
    slug: 'academic',
    name: 'Academic Track',
    strands: ['stem', 'abm', 'humss', 'gas'],
    description:
      'The Academic track prepares students for college programmes. STEM, ABM and HUMSS each lean toward a cluster of college courses, while GAS keeps several doors open.'
  },
  {
    slug: 'tvl',
    name: 'Technical-Vocational-Livelihood (TVL) Track',
    strands: ['tvl', 'ict'],
    description:
      'TVL is competency-based and hands-on. It can lead to employment, TESDA certificates where the school is an accredited assessment centre, or college. ICT is the computer specialisation inside TVL.'
  },
  {
    slug: 'arts-design',
    name: 'Arts and Design Track',
    strands: ['arts-design'],
    description:
      'Arts and Design develops creative practice, portfolio work and an understanding of creative industries.'
  },
  {
    slug: 'sports',
    name: 'Sports Track',
    strands: ['sports'],
    description:
      'The Sports track combines athletic practice with coaching, safety and fitness fundamentals.'
  }
] as const;

export function findStrands(text: string): StrandKnowledge[] {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9&]+/g, ' ').replace(/\s+/g, ' ')} `;
  const found: StrandKnowledge[] = [];
  for (const strand of strandKnowledge) {
    const hit = strand.aliases.some((alias) => {
      const needle = ` ${alias} `;
      // Short codes must match as words; longer names may appear inside a phrase.
      return alias.length <= 4 ? haystack.includes(needle) : haystack.includes(alias);
    });
    if (hit) found.push(strand);
  }
  return found;
}

export function getStrand(slug: string): StrandKnowledge | undefined {
  return strandKnowledge.find((strand) => strand.slug === slug);
}

export function strandLabel(slug: string | null | undefined): string {
  if (!slug) return 'your strand';
  return getStrand(slug)?.code ?? slug.toUpperCase();
}
