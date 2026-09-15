import { ResultMatch } from '../types';

export const guidanceNotice =
'These results are guidance to help you explore your options. Your final decision should consider your goals, circumstances, school offerings, and guidance from teachers, parents, or counsellors.';

export const resultMatches: ResultMatch[] = [
{
  slug: 'ict',
  name: 'ICT',
  level: 'strong',
  percent: 86,
  explanation:
  'Your selected interests and strengths show a strong connection with areas commonly associated with ICT — building things on a computer, patient troubleshooting, and learning tools on your own.',
  strengths: ['Breaking a problem into steps', 'Patience when something fails', 'Working independently'],
  interests: ['How apps and websites are made', 'Computers and software', 'Digital media'],
  explore: [
  'Read the full ICT strand page and its subjects',
  'Try a free beginner programming lesson this week',
  'Ask your school whether ICT is offered and what equipment is needed']

},
{
  slug: 'stem',
  name: 'STEM',
  level: 'good',
  percent: 71,
  explanation:
  'Several of your answers point toward structured problem solving and curiosity about how systems work, which overlaps with what STEM asks of students.',
  strengths: ['Logical reasoning', 'Working with numbers and data', 'Attention to detail'],
  interests: ['Puzzles and experiments', 'Mathematics', 'Technology'],
  explore: [
  'Compare the math and science load of STEM with ICT',
  'Look at Computer Engineering, which sits between both strands']

},
{
  slug: 'abm',
  name: 'ABM',
  level: 'possible',
  percent: 48,
  explanation:
  'A few of your answers relate to planning and organising. This is worth keeping in view, though fewer of your selections pointed here than to the matches above.',
  strengths: ['Planning', 'Organising activities'],
  interests: ['Entrepreneurship', 'Working with a team'],
  explore: ['Look into technology-focused business roles such as product or operations']
}];


export const contributingStrengths = [
{ label: 'Logical thinking', level: 'High' },
{ label: 'Independent learning', level: 'High' },
{ label: 'Attention to detail', level: 'Moderate' },
{ label: 'Creative problem solving', level: 'Moderate' },
{ label: 'Communication', level: 'Developing' }];


export const relatedInterests = [
'Apps and websites',
'Digital media',
'Games',
'Technology troubleshooting',
'Design',
'Problem solving'];