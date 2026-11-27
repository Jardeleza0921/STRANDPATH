import type { CareerKnowledge } from '../types';

/**
 * Career exploration entries. `dayToDay` describes common tasks, not a job
 * guarantee. Pay, demand and licensing vary by employer and change over time;
 * the assistant does not invent statistics.
 */
export const careerKnowledge: CareerKnowledge[] = [
  {
    slug: 'software-developer',
    name: 'Software developer',
    aliases: ['software developer', 'programmer', 'developer', 'coder', 'software engineer'],
    strands: ['ict', 'stem'],
    programs: ['bs-information-technology', 'bs-computer-science', 'bs-information-systems'],
    skills: ['Programming', 'Debugging', 'Reading documentation', 'Working with a team', 'Version control'],
    dayToDay: 'Writing and reviewing code, fixing defects, testing features and explaining technical choices to teammates or users.',
    nextStep: 'Build one small working project — a page, a tool or a game — and keep it where you can show it.'
  },
  {
    slug: 'data-analyst',
    name: 'Data analyst',
    aliases: ['data analyst', 'data analysis', 'analytics'],
    strands: ['stem', 'ict', 'abm'],
    programs: ['bs-computer-science', 'bs-information-technology', 'bs-information-systems', 'bs-business-administration'],
    skills: ['Spreadsheets', 'Statistics', 'Cleaning data', 'Explaining findings', 'Curiosity'],
    dayToDay: 'Cleaning tables, checking numbers, building simple reports and explaining what the data does and does not show.',
    nextStep: 'Practise with a real dataset from your school or community and write three honest observations from it.'
  },
  {
    slug: 'network-administrator',
    name: 'Network administrator',
    aliases: ['network administrator', 'network admin', 'sysadmin', 'systems administrator', 'it support'],
    strands: ['ict', 'stem'],
    programs: ['bs-information-technology', 'bs-information-systems', 'bs-computer-engineering'],
    skills: ['Networking basics', 'Troubleshooting', 'Documentation', 'Security habits', 'Patience'],
    dayToDay: 'Keeping devices and connections working, setting up accounts, monitoring problems and documenting fixes.',
    nextStep: 'Learn to set up a small home network and record every step you had to troubleshoot.'
  },
  {
    slug: 'ui-ux-designer',
    name: 'UI/UX designer',
    aliases: ['ui ux', 'ux designer', 'ui designer', 'product designer', 'web designer'],
    strands: ['ict', 'arts-design'],
    programs: ['bs-fine-arts', 'bs-information-technology', 'bs-information-systems'],
    skills: ['Layout', 'User empathy', 'Prototyping', 'Critique', 'Basic HTML/CSS helps'],
    dayToDay: 'Sketching screens, testing whether people can use them, and refining layouts with developers.',
    nextStep: 'Redesign one screen you use often, then ask two people to try it and note where they hesitate.'
  },
  {
    slug: 'civil-engineer',
    name: 'Civil engineer',
    aliases: ['civil engineer', 'structural engineer', 'site engineer'],
    strands: ['stem'],
    programs: ['bs-civil-engineering'],
    skills: ['Mathematics', 'Structural reasoning', 'Planning', 'Site safety', 'Communication'],
    dayToDay: 'Designing or checking structures, coordinating with contractors, reading plans and solving site problems.',
    nextStep: 'Strengthen trigonometry and physics; try a school project that involves measuring and drawing to scale.'
  },
  {
    slug: 'architect',
    name: 'Architect',
    aliases: ['architect', 'architecture work'],
    strands: ['stem', 'arts-design'],
    programs: ['bs-architecture'],
    skills: ['Drawing', 'Spatial thinking', 'Client communication', 'Building codes awareness', 'Design iteration'],
    dayToDay: 'Turning a client brief into drawings and models, coordinating with engineers and checking buildability.',
    nextStep: 'Start a sketchbook of buildings you notice and annotate what makes them work or fail.'
  },
  {
    slug: 'accountant',
    name: 'Accountant',
    aliases: ['accountant', 'accounting', 'auditor', 'bookkeeper'],
    strands: ['abm'],
    programs: ['bs-accountancy', 'bs-business-administration'],
    skills: ['Accuracy', 'Numeracy', 'Rules and ethics', 'Spreadsheets', 'Deadline management'],
    dayToDay: 'Recording transactions, reconciling records, preparing reports and checking that figures follow the rules.',
    nextStep: 'Practise keeping a simple, honest record of a small budget for a month.'
  },
  {
    slug: 'marketing-officer',
    name: 'Marketing officer',
    aliases: ['marketing', 'marketing officer', 'sales', 'brand associate'],
    strands: ['abm', 'humss'],
    programs: ['bs-business-administration', 'bs-entrepreneurship', 'ab-communication'],
    skills: ['Writing', 'Audience research', 'Persuasion', 'Basic analytics', 'Creativity'],
    dayToDay: 'Planning campaigns, writing messages, coordinating with designers and reviewing what actually reached people.',
    nextStep: 'Run a small, honest promotion for a school event and compare what you expected with what happened.'
  },
  {
    slug: 'teacher',
    name: 'Teacher',
    aliases: ['teacher', 'teaching', 'educator', 'instructor'],
    strands: ['humss', 'stem', 'abm', 'tvl'],
    programs: ['bs-education'],
    skills: ['Explanation', 'Patience', 'Lesson planning', 'Assessment', 'Classroom management'],
    dayToDay: 'Preparing lessons, explaining ideas in several ways, checking understanding and supporting students.',
    nextStep: 'Teach one concept to a classmate who is stuck and notice which explanation worked.'
  },
  {
    slug: 'guidance-counsellor',
    name: 'Guidance counsellor',
    aliases: ['guidance counsellor', 'guidance counselor', 'counsellor', 'counselor', 'school counsellor'],
    strands: ['humss'],
    programs: ['bs-psychology', 'bs-education', 'bs-social-work'],
    skills: ['Listening', 'Confidentiality', 'Referral', 'Documentation', 'Calm communication'],
    dayToDay: 'Meeting students, helping them think through decisions, keeping records and referring serious concerns to specialists.',
    nextStep: 'Talk with your school guidance office about what their work actually involves day to day.'
  },
  {
    slug: 'psychologist',
    name: 'Psychologist',
    aliases: ['psychologist', 'clinical psychologist', 'psychology work'],
    strands: ['humss', 'stem'],
    programs: ['bs-psychology'],
    skills: ['Research literacy', 'Listening', 'Ethics', 'Statistics', 'Writing'],
    dayToDay: 'Depending on the role: research, assessment, counselling under supervision or organisational work. Clinical practice needs graduate study and licensure.',
    nextStep: 'Read about the difference between a psychology graduate, a psychometrician and a licensed psychologist before choosing this path.'
  },
  {
    slug: 'journalist',
    name: 'Journalist / writer',
    aliases: ['journalist', 'writer', 'reporter', 'content writer', 'editor'],
    strands: ['humss', 'arts-design'],
    programs: ['ab-communication', 'ba-political-science'],
    skills: ['Writing', 'Interviewing', 'Verification', 'Research', 'Editing'],
    dayToDay: 'Finding stories, checking facts, interviewing people and writing to a deadline.',
    nextStep: 'Write one verified, sourced article about something happening in your school or barangay.'
  },
  {
    slug: 'social-worker',
    name: 'Social worker',
    aliases: ['social worker', 'community worker', 'case worker'],
    strands: ['humss'],
    programs: ['bs-social-work', 'bs-psychology'],
    skills: ['Listening', 'Documentation', 'Community organising', 'Boundaries', 'Referral'],
    dayToDay: 'Assessing needs, connecting people to services, documenting cases and working with families and communities.',
    nextStep: 'Join one community activity and observe how it is organised, not only how it feels.'
  },
  {
    slug: 'nurse',
    name: 'Nurse',
    aliases: ['nurse', 'nursing', 'staff nurse'],
    strands: ['stem'],
    programs: ['bs-nursing'],
    skills: ['Observation', 'Procedure accuracy', 'Communication', 'Stamina', 'Empathy'],
    dayToDay: 'Monitoring patients, giving care and medication within protocol, recording observations and coordinating with the team.',
    nextStep: 'Check the science requirements of nursing programmes and talk to a nurse about a typical shift.'
  },
  {
    slug: 'medical-technologist',
    name: 'Medical technologist',
    aliases: ['medical technologist', 'medtech', 'lab technologist', 'laboratory analyst'],
    strands: ['stem'],
    programs: ['bs-medical-technology'],
    skills: ['Laboratory technique', 'Accuracy', 'Quality control', 'Data recording'],
    dayToDay: 'Running laboratory tests, checking samples and instruments, and reporting results accurately.',
    nextStep: 'Strengthen chemistry and biology; ask a laboratory near you whether they allow student visits.'
  },
  {
    slug: 'graphic-designer',
    name: 'Graphic designer',
    aliases: ['graphic designer', 'designer', 'illustrator', 'animator', 'multimedia artist'],
    strands: ['arts-design', 'ict'],
    programs: ['bs-fine-arts'],
    skills: ['Composition', 'Typography', 'Software tools', 'Critique', 'Meeting a brief'],
    dayToDay: 'Turning a brief into visuals, revising after feedback and preparing files for print or screen.',
    nextStep: 'Build three pieces around one theme and ask someone to choose the clearest and say why.'
  },
  {
    slug: 'coach',
    name: 'Coach / fitness trainer',
    aliases: ['coach', 'fitness trainer', 'trainer', 'sports coach'],
    strands: ['sports'],
    programs: ['bs-sports-science'],
    skills: ['Movement analysis', 'Programme planning', 'Safety', 'Motivation', 'Communication'],
    dayToDay: 'Planning training, observing technique, adjusting loads and keeping sessions safe.',
    nextStep: 'Keep a simple training log and learn basic first aid.'
  },
  {
    slug: 'agricultural-technician',
    name: 'Agricultural technician',
    aliases: ['agricultural technician', 'farm manager', 'agri technician', 'farmer'],
    strands: ['tvl', 'stem'],
    programs: ['bs-agriculture'],
    skills: ['Observation', 'Record keeping', 'Production planning', 'Pest and soil basics'],
    dayToDay: 'Monitoring crops or animals, recording yields, applying advice and coordinating with extension workers.',
    nextStep: 'Grow something small and keep a weekly record of what changed and why.'
  },
  {
    slug: 'police-officer',
    name: 'Police officer',
    aliases: ['police', 'police officer', 'investigator', 'criminologist'],
    strands: ['humss', 'gas'],
    programs: ['bs-criminology'],
    skills: ['Physical fitness', 'Report writing', 'Discipline', 'Communication', 'Ethics'],
    dayToDay: 'Patrolling, responding to incidents, interviewing people and writing accurate reports.',
    nextStep: 'Check the physical and background requirements of the uniformed service you are considering.'
  },
  {
    slug: 'customer-support-specialist',
    name: 'Customer support specialist',
    aliases: ['customer support', 'call center', 'bpo', 'technical support'],
    strands: ['tvl', 'humss', 'ict', 'gas'],
    programs: ['bs-information-technology', 'ab-communication', 'bs-business-administration'],
    skills: ['Clear speaking', 'Listening', 'Patience', 'System navigation', 'Typing'],
    dayToDay: 'Helping customers resolve problems by phone, chat or email while documenting each case.',
    nextStep: 'Practise explaining a technical fix clearly to someone who is frustrated.'
  }
];

export function findCareers(text: string): CareerKnowledge[] {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')} `;
  return careerKnowledge.filter((career) =>
    [career.name.toLowerCase(), ...career.aliases].some((alias) =>
      alias.length <= 5 ? haystack.includes(` ${alias} `) : haystack.includes(alias)
    )
  );
}

export function careersForStrand(slug: string): CareerKnowledge[] {
  const direct = careerKnowledge.filter((career) => career.strands.includes(slug));
  if (direct.length) return direct;
  if (slug === 'tvl') return careerKnowledge.filter((career) => career.strands.includes('ict'));
  return [];
}

export function careersForProgram(slug: string): CareerKnowledge[] {
  return careerKnowledge.filter((career) => career.programs.includes(slug));
}
