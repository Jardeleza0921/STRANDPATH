import type { ProgramKnowledge } from '../types';

/**
 * College programme knowledge.
 *
 * `strands` lists senior high backgrounds that usually prepare a student well;
 * it is guidance, not an admission rule. `preparation` describes typical
 * preparation and subject comfort, not official prerequisites, because those
 * are set by each college and change. Nothing here promises admission.
 */
export const programKnowledge: ProgramKnowledge[] = [
  {
    slug: 'bs-information-technology',
    name: 'BS Information Technology',
    aliases: ['information technology', 'bsit', 'it course', 'it program'],
    strands: ['ict', 'stem', 'gas'],
    preparation: ['Comfort with computers and file systems', 'Basic programming or troubleshooting', 'Enough maths for logic and networking subjects'],
    skills: ['Problem solving', 'Patience in troubleshooting', 'Systems thinking', 'Communication with users'],
    careers: ['Software developer', 'Systems administrator', 'Network administrator', 'Technical support lead', 'QA tester'],
    notes: 'IT programmes usually mix programming, networking, databases and systems administration. Some schools require a computer; check the department list before enrolling.'
  },
  {
    slug: 'bs-computer-science',
    name: 'BS Computer Science',
    aliases: ['computer science', 'bscs', 'cs course', 'comsci'],
    strands: ['stem', 'ict', 'gas'],
    preparation: ['Strong logical and mathematical reasoning', 'Programming practice', 'Willingness to study algorithms and theory'],
    skills: ['Abstraction', 'Mathematics', 'Programming', 'Debugging', 'Independent learning'],
    careers: ['Software engineer', 'Data analyst', 'Machine learning engineer', 'Game developer', 'Research assistant'],
    notes: 'Computer Science is more theoretical than IT: expect discrete mathematics, algorithms and data structures. ICT helps, but the maths load is real — build it up if it is currently a weak area.'
  },
  {
    slug: 'bs-computer-engineering',
    name: 'BS Computer Engineering',
    aliases: ['computer engineering', 'cpe', 'hardware engineering'],
    strands: ['stem', 'ict'],
    preparation: ['Strong maths and physics', 'Interest in both hardware and software', 'Circuit and electronics basics help'],
    skills: ['Electronics reasoning', 'Programming', 'Systems design', 'Measurement and testing'],
    careers: ['Embedded systems engineer', 'Hardware engineer', 'Network engineer', 'IoT developer'],
    notes: 'Computer Engineering sits between electrical engineering and computer science, so expect calculus, physics and circuits alongside programming.'
  },
  {
    slug: 'bs-accountancy',
    name: 'BS Accountancy',
    aliases: ['accountancy', 'accounting', 'bsa', 'cpa'],
    strands: ['abm', 'gas'],
    preparation: ['Comfort with numbers and careful recording', 'Reading rules and applying them consistently', 'Patience with detail'],
    skills: ['Accuracy', 'Numeracy', 'Analysis', 'Ethics', 'Time management'],
    careers: ['Accountant', 'Auditor', 'Tax associate', 'Financial analyst', 'CPA (after licensure)'],
    notes: 'Accountancy is numbers-heavy with retention policies in many schools. ABM gives a head start but is not the only route; expect a qualifying exam at some colleges.'
  },
  {
    slug: 'bs-business-administration',
    name: 'BS Business Administration',
    aliases: ['business administration', 'bsba', 'management course', 'business course'],
    strands: ['abm', 'gas', 'humss'],
    preparation: ['Organising people and tasks', 'Basic budgeting and numeracy', 'Comfort presenting ideas'],
    skills: ['Planning', 'Communication', 'Leadership', 'Numeracy', 'Negotiation'],
    careers: ['Operations supervisor', 'Marketing officer', 'HR associate', 'Bank associate', 'Small business owner'],
    notes: 'Business programmes vary widely by major (marketing, finance, HR, operations). Ask which majors a school actually offers.'
  },
  {
    slug: 'bs-entrepreneurship',
    name: 'BS Entrepreneurship',
    aliases: ['entrepreneurship', 'entrepreneur course', 'business ownership'],
    strands: ['abm', 'gas', 'tvl'],
    preparation: ['Curiosity about how money and customers work', 'Comfort trying things and revising', 'Basic record keeping'],
    skills: ['Opportunity spotting', 'Selling', 'Budgeting', 'Resilience', 'Team building'],
    careers: ['Small business owner', 'Startup operations', 'Sales and marketing associate', 'Product manager (junior)'],
    notes: 'Entrepreneurship degrees are practical but not a guarantee of business success. Pair them with real selling or operations experience.'
  },
  {
    slug: 'bs-psychology',
    name: 'BS Psychology',
    aliases: ['psychology', 'psych', 'abpsych', 'bs psych'],
    strands: ['humss', 'stem', 'gas'],
    preparation: ['Reading and writing at length', 'Interest in people and behaviour', 'Basic statistics'],
    skills: ['Listening', 'Research literacy', 'Writing', 'Ethics', 'Observation'],
    careers: ['HR associate', 'Research assistant', 'Guidance assistant', 'Case worker', 'Psychology graduate (further study for licensure)'],
    notes: 'A psychology degree does not make someone a licensed psychologist. Clinical practice needs graduate study and licensure; many graduates work in HR, research or social services first.'
  },
  {
    slug: 'bs-education',
    name: 'Bachelor of Secondary/Elementary Education',
    aliases: ['education', 'teaching', 'beed', 'bsed', 'teacher course'],
    strands: ['humss', 'stem', 'abm', 'gas', 'tvl'],
    preparation: ['Patience explaining ideas', 'Strong written and spoken communication', 'Comfort with the subject you would teach'],
    skills: ['Explanation', 'Classroom management', 'Planning', 'Assessment literacy', 'Empathy'],
    careers: ['Teacher', 'Tutor', 'Training officer', 'Curriculum assistant'],
    notes: 'Education degrees specialise by subject or grade level. Licensure (LET) is required to teach in Philippine public schools; private schools have their own requirements.'
  },
  {
    slug: 'ab-communication',
    name: 'AB Communication / Journalism',
    aliases: ['communication', 'journalism', 'mass communication', 'abcomm'],
    strands: ['humss', 'gas', 'arts-design'],
    preparation: ['Writing clearly and often', 'Reading news and current events', 'Comfort interviewing people'],
    skills: ['Writing', 'Research', 'Interviewing', 'Editing', 'Media literacy'],
    careers: ['Journalist', 'Content writer', 'Public relations associate', 'Social media manager', 'Copywriter'],
    notes: 'Portfolio work matters more than the diploma alone. Build published or public pieces while studying.'
  },
  {
    slug: 'ba-political-science',
    name: 'BA Political Science',
    aliases: ['political science', 'polsci', 'politics course'],
    strands: ['humss', 'gas'],
    preparation: ['Reading dense texts', 'Argumentative writing', 'Interest in government and society'],
    skills: ['Critical reading', 'Argumentation', 'Research', 'Writing', 'Debate'],
    careers: ['Policy researcher', 'Legislative staff', 'Civil service officer', 'Law student (pre-law)', 'NGO programme officer'],
    notes: 'Many Political Science graduates continue to law school. Law admission is separate and competitive.'
  },
  {
    slug: 'bs-social-work',
    name: 'BS Social Work',
    aliases: ['social work', 'social worker course'],
    strands: ['humss', 'gas'],
    preparation: ['Genuine interest in community work', 'Emotional steadiness', 'Report writing'],
    skills: ['Active listening', 'Case documentation', 'Community organising', 'Ethics', 'Referral skills'],
    careers: ['Social worker', 'Case manager', 'Community organiser', 'NGO field officer'],
    notes: 'Social work licensure and field placements are part of the programme. It is people-intensive and often emotionally demanding.'
  },
  {
    slug: 'bs-nursing',
    name: 'BS Nursing',
    aliases: ['nursing', 'bsn', 'nurse course'],
    strands: ['stem', 'gas'],
    preparation: ['Strong biology and chemistry', 'Comfort with anatomy and care routines', 'Calm under pressure'],
    skills: ['Observation', 'Procedure accuracy', 'Communication', 'Empathy', 'Stamina'],
    careers: ['Staff nurse', 'Community health nurse', 'Clinical instructor', 'Health programme staff'],
    notes: 'Nursing has heavy science and clinical requirements, plus licensure. Some schools require a science-heavy strand or a bridging subject.'
  },
  {
    slug: 'bs-medical-technology',
    name: 'BS Medical Technology',
    aliases: ['medical technology', 'medtech', 'medical laboratory science'],
    strands: ['stem'],
    preparation: ['Chemistry and biology comfort', 'Precise measurement', 'Attention to detail'],
    skills: ['Laboratory technique', 'Accuracy', 'Data recording', 'Quality control'],
    careers: ['Medical technologist', 'Laboratory analyst', 'Research assistant', 'Diagnostics staff'],
    notes: 'Laboratory programmes expect strong chemistry and biology. Licensure is required to practise as a medical technologist.'
  },
  {
    slug: 'bs-civil-engineering',
    name: 'BS Civil Engineering',
    aliases: ['civil engineering', 'civil engineer', 'bscE'],
    strands: ['stem'],
    preparation: ['Strong algebra, trigonometry and calculus', 'Physics', 'Comfort with drawings and structures'],
    skills: ['Mathematics', 'Structural reasoning', 'Project planning', 'Measurement', 'Safety awareness'],
    careers: ['Civil engineer', 'Site engineer', 'Structural designer', 'Project engineer', 'Quantity surveyor'],
    notes: 'Engineering programmes are maths- and physics-heavy from the first year. Expect board exam preparation later.'
  },
  {
    slug: 'bs-architecture',
    name: 'BS Architecture',
    aliases: ['architecture', 'architect course', 'ar'],
    strands: ['stem', 'arts-design', 'gas'],
    preparation: ['Drawing and spatial thinking', 'Maths for structures', 'Willingness to revise designs'],
    skills: ['Design', 'Technical drawing', 'Spatial reasoning', 'Client communication', 'Project management'],
    careers: ['Architect', 'CAD drafter', 'Urban planning assistant', 'Interior designer', 'Construction coordinator'],
    notes: 'Architecture combines creative studio work with engineering subjects. Many schools require a portfolio or drawing test.'
  },
  {
    slug: 'bs-hospitality-management',
    name: 'BS Hospitality Management / Tourism',
    aliases: ['hospitality management', 'hm', 'tourism', 'hotel and restaurant management', 'hrm'],
    strands: ['tvl', 'abm', 'gas'],
    preparation: ['Comfort working with guests', 'Practical service skills', 'Communication and grooming standards'],
    skills: ['Customer service', 'Organisation', 'Communication', 'Cost awareness', 'Composure'],
    careers: ['Hotel supervisor', 'Restaurant manager', 'Tourism officer', 'Events coordinator', 'Cruise staff'],
    notes: 'Hospitality programmes include internships and may charge for uniforms, tools and practicum. Home Economics specialisations help but are not required.'
  },
  {
    slug: 'bs-fine-arts',
    name: 'BS/AB Fine Arts and Multimedia Arts',
    aliases: ['fine arts', 'multimedia arts', 'mma', 'visual arts', 'graphic design course'],
    strands: ['arts-design', 'gas', 'ict'],
    preparation: ['A portfolio of work', 'Regular drawing or design practice', 'Willingness to take critique'],
    skills: ['Composition', 'Visual storytelling', 'Software tools', 'Critique', 'Discipline'],
    careers: ['Graphic designer', 'Illustrator', 'Animator', 'Art director', 'Multimedia artist'],
    notes: 'Portfolio requirements are common. Software skills can be learned, but consistent practice shows in the portfolio.'
  },
  {
    slug: 'bs-sports-science',
    name: 'BS Sports Science / Physical Education',
    aliases: ['sports science', 'physical education', 'bped', 'sports course'],
    strands: ['sports', 'stem', 'gas'],
    preparation: ['Regular training or coaching experience', 'Basic anatomy and physiology', 'First aid awareness'],
    skills: ['Movement analysis', 'Coaching', 'Programme planning', 'Safety', 'Communication'],
    careers: ['Coach', 'Fitness trainer', 'PE teacher', 'Sports programme officer', 'Rehabilitation assistant'],
    notes: 'Some programmes require a physical or medical clearance. Teaching PE in public schools needs licensure.'
  },
  {
    slug: 'bs-agriculture',
    name: 'BS Agriculture / Agri-business',
    aliases: ['agriculture', 'agribusiness', 'agri course', 'crop science'],
    strands: ['tvl', 'stem', 'gas', 'abm'],
    preparation: ['Interest in plants, animals or food systems', 'Basic biology and record keeping', 'Fieldwork readiness'],
    skills: ['Observation', 'Production planning', 'Record keeping', 'Pest and soil basics', 'Enterprise thinking'],
    careers: ['Farm manager', 'Agricultural technician', 'Agri-business officer', 'Extension worker', 'Food production supervisor'],
    notes: 'Agriculture programmes vary from production to agri-business. Check whether the school has laboratory and field facilities.'
  },
  {
    slug: 'bs-information-systems',
    name: 'BS Information Systems',
    aliases: ['information systems', 'bsis', 'business it'],
    strands: ['ict', 'abm', 'stem', 'gas'],
    preparation: ['Basic programming or databases', 'Understanding of business processes', 'Communication with users'],
    skills: ['Requirements analysis', 'Databases', 'Process mapping', 'Communication', 'Project support'],
    careers: ['Business analyst', 'Systems analyst', 'Data encoder', 'IT project associate', 'Reports developer'],
    notes: 'Information Systems bridges business and technology. It suits students who like organising information and working with people more than pure programming.'
  },
  {
    slug: 'bs-criminology',
    name: 'BS Criminology',
    aliases: ['criminology', 'crim', 'law enforcement course'],
    strands: ['humss', 'gas', 'stem'],
    preparation: ['Physical fitness', 'Reading reports and rules', 'Interest in justice and public safety'],
    skills: ['Observation', 'Report writing', 'Discipline', 'Communication', 'Ethics'],
    careers: ['Police officer', 'Forensic technician', 'Security officer', 'Corrections officer', 'Investigator'],
    notes: 'Criminology has physical, medical and background requirements for some careers. Licensure is required for professional practice.'
  }
];

export function findPrograms(text: string): ProgramKnowledge[] {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')} `;
  return programKnowledge.filter((program) =>
    [program.name.toLowerCase(), ...program.aliases].some((alias) =>
      alias.length <= 5 ? haystack.includes(` ${alias} `) : haystack.includes(alias)
    )
  );
}

export function programsForStrand(slug: string): ProgramKnowledge[] {
  const matches = programKnowledge.filter((program) => program.strands.includes(slug));
  if (!matches.length && slug === 'tvl') {
    return programKnowledge.filter((program) => program.strands.includes('ict'));
  }
  return matches;
}
