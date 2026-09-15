import { Question } from '../types';

export const questions: Question[] = [
{
  id: 'q1',
  kind: 'multi',
  section: 'Interests',
  prompt: 'Which activities do you enjoy most?',
  helper: 'Pick up to 3. There are no wrong answers — choose what you actually enjoy, not what sounds impressive.',
  maxChoices: 3,
  options: [
  { id: 'build-tech', label: 'Building or fixing something with a computer', hint: 'Apps, websites, hardware' },
  { id: 'experiment', label: 'Running experiments or solving puzzles' },
  { id: 'organise', label: 'Organising an event or a small business' },
  { id: 'write', label: 'Writing, debating, or telling stories' },
  { id: 'create', label: 'Drawing, designing, or making music' },
  { id: 'train', label: 'Training, playing sports, or coaching others' }]

},
{
  id: 'q2',
  kind: 'multi',
  section: 'Strengths',
  prompt: 'Which skills do you feel most confident using?',
  helper: 'Pick up to 3 that classmates or teachers would also say are true of you.',
  maxChoices: 3,
  options: [
  { id: 'logic', label: 'Breaking a problem into steps' },
  { id: 'numbers', label: 'Working with numbers and data' },
  { id: 'words', label: 'Explaining ideas in writing or speech' },
  { id: 'people', label: 'Listening to and understanding people' },
  { id: 'hands', label: 'Working with my hands or with tools' },
  { id: 'visual', label: 'Making things look good and clear' }]

},
{
  id: 'q3',
  kind: 'single',
  section: 'Interests',
  prompt: 'Which subject do you look forward to most?',
  helper: 'Choose the one you would still attend on a tiring day.',
  options: [
  { id: 'math', label: 'Mathematics' },
  { id: 'science', label: 'Science' },
  { id: 'computer', label: 'Computer / TLE' },
  { id: 'english', label: 'English or Filipino' },
  { id: 'arts', label: 'Arts or Music' },
  { id: 'pe', label: 'Physical Education' }]

},
{
  id: 'q4',
  kind: 'single',
  section: 'Work style',
  prompt: 'Which type of work sounds most enjoyable?',
  helper: 'Imagine a normal workday five years from now.',
  options: [
  { id: 'screen', label: 'Building something on a computer that other people use' },
  { id: 'lab', label: 'Testing and analysing in a lab or field site' },
  { id: 'office', label: 'Managing a team, budget, or project' },
  { id: 'community', label: 'Working directly with people in a school or community' },
  { id: 'studio', label: 'Producing creative work in a studio' },
  { id: 'field', label: 'Moving around, working with equipment or athletes' }]

},
{
  id: 'q5',
  kind: 'scale',
  section: 'Work style',
  prompt: 'I stay patient when something does not work the first time.',
  helper: 'Answer honestly — this helps describe how you approach difficulty, not how good you are.',
  options: [
  { id: '1', label: 'Not like me' },
  { id: '2', label: 'A little' },
  { id: '3', label: 'Somewhat' },
  { id: '4', label: 'Mostly' },
  { id: '5', label: 'Very like me' }]

},
{
  id: 'q6',
  kind: 'multi',
  section: 'Interests',
  prompt: 'What areas are you curious about right now?',
  helper: 'Pick up to 3. Curiosity counts even if you have no experience yet.',
  maxChoices: 3,
  options: [
  { id: 'software', label: 'How apps and websites are made' },
  { id: 'health', label: 'Health, medicine, and the human body' },
  { id: 'money', label: 'Money, markets, and entrepreneurship' },
  { id: 'society', label: 'Society, law, and current issues' },
  { id: 'design', label: 'Design, film, and visual storytelling' },
  { id: 'environment', label: 'Agriculture, environment, and food' }]

},
{
  id: 'q7',
  kind: 'single',
  section: 'Work style',
  prompt: 'How do you prefer to learn something new?',
  helper: 'Think about how you learned your most recent new skill.',
  options: [
  { id: 'doing', label: 'By trying it hands-on right away' },
  { id: 'reading', label: 'By reading or watching first, then trying' },
  { id: 'group', label: 'By working through it with other people' },
  { id: 'teacher', label: 'By following a step-by-step guide or teacher' }]

},
{
  id: 'q8',
  kind: 'scale',
  section: 'Strengths',
  prompt: 'I enjoy explaining things to classmates until they understand.',
  helper: '',
  options: [
  { id: '1', label: 'Not like me' },
  { id: '2', label: 'A little' },
  { id: '3', label: 'Somewhat' },
  { id: '4', label: 'Mostly' },
  { id: '5', label: 'Very like me' }]

},
{
  id: 'q9',
  kind: 'multi',
  section: 'Talents',
  prompt: 'Which of these have you done outside of class?',
  helper: 'Select all that apply. Small or informal experiences still count.',
  options: [
  { id: 'code', label: 'Made a website, game, or edited a video' },
  { id: 'sell', label: 'Sold something or helped in a family business' },
  { id: 'lead', label: 'Led a club, team, or group activity' },
  { id: 'perform', label: 'Performed, competed, or exhibited work' },
  { id: 'repair', label: 'Repaired an appliance, bike, or device' },
  { id: 'volunteer', label: 'Volunteered in the community' }]

},
{
  id: 'q10',
  kind: 'single',
  section: 'Preferences',
  prompt: 'Which matters more to you right now?',
  helper: 'Both are valid. This only helps frame your options.',
  options: [
  { id: 'employable', label: 'Gaining skills I could use for work right after Grade 12' },
  { id: 'college', label: 'Preparing for a specific college programme' },
  { id: 'open', label: 'Keeping my options open a little longer' }]

},
{
  id: 'q11',
  kind: 'scale',
  section: 'Work style',
  prompt: 'I am comfortable working alone for long stretches.',
  helper: '',
  options: [
  { id: '1', label: 'Not like me' },
  { id: '2', label: 'A little' },
  { id: '3', label: 'Somewhat' },
  { id: '4', label: 'Mostly' },
  { id: '5', label: 'Very like me' }]

},
{
  id: 'q12',
  kind: 'multi',
  section: 'Strengths',
  prompt: 'Which tasks do people usually ask you for help with?',
  helper: 'Select all that apply.',
  options: [
  { id: 'tech-help', label: 'Fixing a phone, laptop, or wifi problem' },
  { id: 'math-help', label: 'Understanding a math or science lesson' },
  { id: 'write-help', label: 'Writing or editing something' },
  { id: 'design-help', label: 'Making a poster, layout, or presentation' },
  { id: 'plan-help', label: 'Planning an activity or budget' },
  { id: 'talk-help', label: 'Talking through a personal problem' }]

},
{
  id: 'q13',
  kind: 'single',
  section: 'Preferences',
  prompt: 'How much does hands-on practical work appeal to you?',
  helper: 'Workshops, labs, equipment, and physical outputs.',
  options: [
  { id: 'high', label: 'A lot — I prefer it over classroom work' },
  { id: 'mid', label: 'Somewhat — a mix would be ideal' },
  { id: 'low', label: 'Not much — I prefer reading, writing, or analysis' }]

},
{
  id: 'q14',
  kind: 'multi',
  section: 'Preferences',
  prompt: 'What would you like your future work to involve?',
  helper: 'Pick up to 3.',
  maxChoices: 3,
  options: [
  { id: 'problem', label: 'Solving technical problems' },
  { id: 'help', label: 'Helping or teaching people directly' },
  { id: 'create-work', label: 'Creating original work' },
  { id: 'lead-work', label: 'Leading a team or organisation' },
  { id: 'discover', label: 'Discovering or researching something new' },
  { id: 'stable', label: 'Steady, well-defined daily tasks' }]

},
{
  id: 'q15',
  kind: 'single',
  section: 'Preferences',
  prompt: 'Have you already considered a strand before starting this?',
  helper: 'This does not change your results. It helps you compare later.',
  options: [
  { id: 'yes-ict', label: 'Yes — something technology related' },
  { id: 'yes-other', label: 'Yes — a different strand' },
  { id: 'unsure', label: 'Not yet, I am still exploring' }]

}];