/**
 * STRANDPATH content: categories, questionnaire v1.0, strand compatibility model,
 * and the improvement-activity library.
 *
 * The questionnaire is a technical draft reviewed against the SHS strand
 * descriptions in this file. It has NOT been pilot-tested or subjected to a
 * reliability study. `validationStatus` records that honestly and is stored with
 * every question version so results can be read in context.
 */

export const CATEGORIES = {
  scientific: {
    label: 'Science & Investigation',
    short: 'Investigation',
    description: 'Curiosity about how natural and physical systems work, and comfort asking testable questions.',
    developing: 'practising observation, measurement and evidence-based conclusions'
  },
  analytical: {
    label: 'Analysis & Problem Solving',
    short: 'Analysis',
    description: 'Breaking a problem into parts, comparing options, and reasoning toward a solution.',
    developing: 'structuring problems, checking assumptions and comparing alternatives'
  },
  numerical: {
    label: 'Numbers & Data',
    short: 'Numbers & data',
    description: 'Comfort working with quantities, measurements, tables, graphs and financial records.',
    developing: 'reading data critically and using numbers to support a decision'
  },
  technical: {
    label: 'Technology & Systems',
    short: 'Technology',
    description: 'Interest in how digital tools, devices and systems are built, configured and repaired.',
    developing: 'learning tools systematically and troubleshooting step by step'
  },
  creative: {
    label: 'Creativity & Design',
    short: 'Creativity',
    description: 'Producing original work, composing visual or performing pieces, and refining ideas through critique.',
    developing: 'building a regular creative practice and revising work after feedback'
  },
  communication: {
    label: 'Communication & Language',
    short: 'Communication',
    description: 'Explaining ideas in writing and speech, reading critically, and adapting a message to an audience.',
    developing: 'organising ideas clearly and practising explanation out loud'
  },
  social: {
    label: 'People & Community',
    short: 'People',
    description: 'Understanding people, listening well, and working with groups and communities.',
    developing: 'active listening and collaborating with people who work differently'
  },
  enterprise: {
    label: 'Business & Organisation',
    short: 'Organisation',
    description: 'Planning resources, organising activities, and understanding how organisations earn and spend.',
    developing: 'planning with budgets, timelines and clear responsibilities'
  },
  practical: {
    label: 'Hands-on & Practical Work',
    short: 'Practical work',
    description: 'Learning by doing: building, repairing, testing and working with tools, equipment or the body.',
    developing: 'following procedures safely and practising a skill consistently'
  },
  persistence: {
    label: 'Persistence & Self-direction',
    short: 'Persistence',
    description: 'Staying with a difficult task, managing time, and learning independently.',
    developing: 'breaking work into smaller steps and protecting focused time'
  }
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

const scale = (dimension, extra = {}) => ({
  1: { [dimension]: 0.6, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v * 0.2])) },
  2: { [dimension]: 1.2, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v * 0.4])) },
  3: { [dimension]: 1.8, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v * 0.6])) },
  4: { [dimension]: 2.4, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v * 0.8])) },
  5: { [dimension]: 3, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v])) }
});

const likert = () => [
  { code: '1', label: 'Not like me' },
  { code: '2', label: 'A little' },
  { code: '3', label: 'Somewhat' },
  { code: '4', label: 'Mostly' },
  { code: '5', label: 'Very like me' }
];

function scaleQuestion(code, section, prompt, helper, scoresByValue) {
  return {
    code,
    section,
    dimension: 'persistence',
    kind: 'scale',
    prompt,
    helper,
    weight: 1,
    validationStatus: 'technical-draft',
    options: likert().map((o) => ({
      ...o,
      scores: scoresByValue[Number(o.code)]
    }))
  };
}

/**
 * Questionnaire version 1.0 — 20 items.
 * Every item contributes to at least one dimension. Item weights are all 1.0:
 * unequal weighting would need pilot data to justify it.
 */
export const QUESTIONNAIRE_V1 = {
  version: '1.0',
  title: 'StrandPath Interests, Strengths and Readiness Inventory',
  notes:
    '20 items across interests, strengths, work style, preferences and readiness. ' +
    'Items are adapted from the prototype questionnaire and reviewed for grade-10 reading level, ' +
    'non-evaluative wording and coverage of all seven strands. Expert/adviser review and pilot testing ' +
    'are still required before this is described as a validated instrument.',
  questions: [
    {
      code: 'q1',
      section: 'Interests',
      dimension: 'interests',
      kind: 'multi',
      maxChoices: 3,
      prompt: 'Which activities do you enjoy most?',
      helper: 'Pick up to three. Choose what you actually enjoy, not what sounds impressive.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'build-tech', label: 'Building or fixing something with a computer', hint: 'Apps, websites, hardware', scores: { technical: 3, analytical: 1, creative: 1 } },
        { code: 'experiment', label: 'Running experiments or solving puzzles', scores: { scientific: 3, analytical: 1 } },
        { code: 'organise', label: 'Organising an event or a small business', scores: { enterprise: 3, social: 1, numerical: 1 } },
        { code: 'write', label: 'Writing, debating, or telling stories', scores: { communication: 3, creative: 1 } },
        { code: 'create', label: 'Drawing, designing, or making music', scores: { creative: 3, technical: 1 } },
        { code: 'train', label: 'Training, playing sports, or coaching others', scores: { practical: 3, persistence: 1, social: 1 } }
      ]
    },
    {
      code: 'q2',
      section: 'Strengths',
      dimension: 'strengths',
      kind: 'multi',
      maxChoices: 3,
      prompt: 'Which skills do you feel most confident using?',
      helper: 'Pick up to three that classmates or teachers would also say are true of you.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'logic', label: 'Breaking a problem into steps', scores: { analytical: 3, numerical: 1 } },
        { code: 'numbers', label: 'Working with numbers and data', scores: { numerical: 3, analytical: 1 } },
        { code: 'words', label: 'Explaining ideas in writing or speech', scores: { communication: 3, social: 1 } },
        { code: 'people', label: 'Listening to and understanding people', scores: { social: 3, communication: 1 } },
        { code: 'hands', label: 'Working with my hands or with tools', scores: { practical: 3, technical: 1 } },
        { code: 'visual', label: 'Making things look good and clear', scores: { creative: 3, technical: 1 } }
      ]
    },
    {
      code: 'q3',
      section: 'Interests',
      dimension: 'subject',
      kind: 'single',
      prompt: 'Which subject do you look forward to most?',
      helper: 'Choose the one you would still attend on a tiring day.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'math', label: 'Mathematics', scores: { numerical: 3, analytical: 2 } },
        { code: 'science', label: 'Science', scores: { scientific: 3, analytical: 1 } },
        { code: 'computer', label: 'Computer / TLE', scores: { technical: 3, creative: 1 } },
        { code: 'english', label: 'English or Filipino', scores: { communication: 3, social: 1 } },
        { code: 'arts', label: 'Arts or Music', scores: { creative: 3, communication: 1 } },
        { code: 'pe', label: 'Physical Education', scores: { practical: 3, persistence: 1 } }
      ]
    },
    {
      code: 'q4',
      section: 'Work style',
      dimension: 'workstyle',
      kind: 'single',
      prompt: 'Which type of work sounds most enjoyable?',
      helper: 'Imagine a normal workday a few years from now.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'screen', label: 'Building something on a computer that other people use', scores: { technical: 3, creative: 1, analytical: 1 } },
        { code: 'lab', label: 'Testing and analysing in a lab or field site', scores: { scientific: 3, analytical: 1, persistence: 1 } },
        { code: 'office', label: 'Managing a team, budget, or project', scores: { enterprise: 3, numerical: 1, social: 1 } },
        { code: 'community', label: 'Working directly with people in a school or community', scores: { social: 3, communication: 1 } },
        { code: 'studio', label: 'Producing creative work in a studio', scores: { creative: 3, persistence: 1 } },
        { code: 'field', label: 'Moving around, working with equipment or athletes', scores: { practical: 3, persistence: 1, social: 1 } }
      ]
    },
    scaleQuestion('q5', 'Work style', 'I stay patient when something does not work the first time.', 'Answer honestly — this describes how you approach difficulty, not how good you are.', scale('persistence')),
    {
      code: 'q6',
      section: 'Interests',
      dimension: 'curiosity',
      kind: 'multi',
      maxChoices: 3,
      prompt: 'What areas are you curious about right now?',
      helper: 'Pick up to three. Curiosity counts even if you have no experience yet.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'software', label: 'How apps and websites are made', scores: { technical: 3, analytical: 1 } },
        { code: 'health', label: 'Health, medicine, and the human body', scores: { scientific: 3, social: 1 } },
        { code: 'money', label: 'Money, markets, and entrepreneurship', scores: { enterprise: 3, numerical: 1 } },
        { code: 'society', label: 'Society, law, and current issues', scores: { social: 2, communication: 2 } },
        { code: 'design', label: 'Design, film, and visual storytelling', scores: { creative: 3, technical: 1 } },
        { code: 'environment', label: 'Agriculture, environment, and food', scores: { scientific: 2, practical: 2 } }
      ]
    },
    {
      code: 'q7',
      section: 'Work style',
      dimension: 'learning',
      kind: 'single',
      prompt: 'How do you prefer to learn something new?',
      helper: 'Think about how you learned your most recent new skill.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'doing', label: 'By trying it hands-on right away', scores: { practical: 3, persistence: 1 } },
        { code: 'reading', label: 'By reading or watching first, then trying', scores: { analytical: 2, persistence: 2 } },
        { code: 'group', label: 'By working through it with other people', scores: { social: 3, communication: 1 } },
        { code: 'teacher', label: 'By following a step-by-step guide or teacher', scores: { persistence: 2, analytical: 1 } }
      ]
    },
    scaleQuestion('q8', 'Strengths', 'I enjoy explaining things to classmates until they understand.', '', scale('communication', { social: 2 })),
    {
      code: 'q9',
      section: 'Talents',
      dimension: 'experience',
      kind: 'multi',
      prompt: 'Which of these have you done outside of class?',
      helper: 'Select all that apply. Small or informal experiences still count.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'code', label: 'Made a website, game, or edited a video', scores: { technical: 3, creative: 1 } },
        { code: 'sell', label: 'Sold something or helped in a family business', scores: { enterprise: 3, communication: 1 } },
        { code: 'lead', label: 'Led a club, team, or group activity', scores: { social: 3, enterprise: 1 } },
        { code: 'perform', label: 'Performed, competed, or exhibited work', scores: { creative: 3, communication: 1, persistence: 1 } },
        { code: 'repair', label: 'Repaired an appliance, bike, or device', scores: { practical: 3, technical: 1 } },
        { code: 'volunteer', label: 'Volunteered in the community', scores: { social: 3, persistence: 1 } }
      ]
    },
    {
      code: 'q10',
      section: 'Preferences',
      dimension: 'plans',
      kind: 'single',
      prompt: 'Which matters more to you right now?',
      helper: 'Both are valid. This only helps frame your options.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'employable', label: 'Gaining skills I could use for work right after Grade 12', scores: { practical: 3, technical: 1, enterprise: 1 } },
        { code: 'college', label: 'Preparing for a specific college programme', scores: { analytical: 2, persistence: 2, scientific: 1 } },
        { code: 'open', label: 'Keeping my options open a little longer', scores: { analytical: 1, communication: 1, creative: 1 } }
      ]
    },
    scaleQuestion('q11', 'Work style', 'I am comfortable working alone for long stretches.', '', scale('persistence', { technical: 1 })),
    {
      code: 'q12',
      section: 'Strengths',
      dimension: 'help',
      kind: 'multi',
      prompt: 'Which tasks do people usually ask you for help with?',
      helper: 'Select all that apply.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'tech-help', label: 'Fixing a phone, laptop, or wifi problem', scores: { technical: 3, practical: 1 } },
        { code: 'math-help', label: 'Understanding a math or science lesson', scores: { numerical: 3, analytical: 1, social: 1 } },
        { code: 'write-help', label: 'Writing or editing something', scores: { communication: 3 } },
        { code: 'design-help', label: 'Making a poster, layout, or presentation', scores: { creative: 3, technical: 1 } },
        { code: 'plan-help', label: 'Planning an activity or budget', scores: { enterprise: 3, analytical: 1, numerical: 1 } },
        { code: 'talk-help', label: 'Talking through a personal problem', scores: { social: 3, communication: 1 } }
      ]
    },
    {
      code: 'q13',
      section: 'Preferences',
      dimension: 'practicality',
      kind: 'single',
      prompt: 'How much does hands-on practical work appeal to you?',
      helper: 'Workshops, labs, equipment, and physical outputs.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'high', label: 'A lot — I prefer it over classroom work', scores: { practical: 3, technical: 1 } },
        { code: 'mid', label: 'Somewhat — a mix would be ideal', scores: { practical: 2, analytical: 2 } },
        { code: 'low', label: 'Not much — I prefer reading, writing, or analysis', scores: { analytical: 3, communication: 1 } }
      ]
    },
    {
      code: 'q14',
      section: 'Preferences',
      dimension: 'future',
      kind: 'multi',
      maxChoices: 3,
      prompt: 'What would you like your future work to involve?',
      helper: 'Pick up to three.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'problem', label: 'Solving technical problems', scores: { analytical: 3, technical: 2 } },
        { code: 'help', label: 'Helping or teaching people directly', scores: { social: 3, communication: 1 } },
        { code: 'create-work', label: 'Creating original work', scores: { creative: 3 } },
        { code: 'lead-work', label: 'Leading a team or organisation', scores: { enterprise: 3, social: 1 } },
        { code: 'discover', label: 'Discovering or researching something new', scores: { scientific: 3, analytical: 1 } },
        { code: 'stable', label: 'Steady, well-defined daily tasks', scores: { persistence: 3, practical: 1 } }
      ]
    },
    {
      code: 'q15',
      section: 'Preferences',
      dimension: 'context',
      kind: 'single',
      prompt: 'Have you already considered a strand before starting this?',
      helper: 'This does not change your scores. It helps you compare later.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'yes-tech', label: 'Yes — something technology related', scores: {} },
        { code: 'yes-other', label: 'Yes — a different strand', scores: {} },
        { code: 'unsure', label: 'Not yet, I am still exploring', scores: {} }
      ]
    },
    scaleQuestion('q16', 'Readiness', 'I can explain my ideas clearly in writing.', 'This helps suggest activities, not judge your ability.', scale('communication', { analytical: 1 })),
    scaleQuestion('q17', 'Readiness', 'I enjoy figuring out how things work.', '', scale('analytical', { scientific: 2, technical: 1 })),
    scaleQuestion('q18', 'Readiness', 'I am comfortable leading a group.', '', scale('enterprise', { social: 2 })),
    {
      code: 'q19',
      section: 'Strengths',
      dimension: 'subjects',
      kind: 'multi',
      maxChoices: 2,
      prompt: 'Which school subjects do you find easiest to keep up with?',
      helper: 'Pick up to two. "Easiest" means least draining, not necessarily highest grade.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'sub-math', label: 'Mathematics', scores: { numerical: 3, analytical: 1 } },
        { code: 'sub-sci', label: 'Science', scores: { scientific: 3, analytical: 1 } },
        { code: 'sub-eng', label: 'English / Filipino', scores: { communication: 3 } },
        { code: 'sub-ict', label: 'Computer / ICT', scores: { technical: 3, practical: 1 } },
        { code: 'sub-pe', label: 'PE / Health', scores: { practical: 3, social: 1 } },
        { code: 'sub-arts', label: 'Arts / Music', scores: { creative: 3, communication: 1 } }
      ]
    },
    {
      code: 'q20',
      section: 'Readiness',
      dimension: 'readiness',
      kind: 'single',
      prompt: 'How ready do you feel to choose a strand?',
      helper: 'There is no correct answer. This shapes the next steps we suggest.',
      validationStatus: 'technical-draft',
      options: [
        { code: 'ready', label: 'I have a direction in mind and want to check it', scores: { persistence: 2 } },
        { code: 'comparing', label: 'I am comparing two or three options', scores: { persistence: 1 } },
        { code: 'starting', label: 'I am just starting to explore', scores: {} }
      ]
    }
  ]
};

const STRAND_SEEDS = [
  {
    slug: 'stem',
    code: 'STEM',
    name: 'Science, Technology, Engineering & Mathematics',
    track: 'Academic',
    tagline: 'For students drawn to investigation, numbers, and how things work.',
    summary:
      'STEM focuses on advanced science and mathematics, experimentation, and structured problem solving. Students spend time analysing data, testing ideas, and explaining results.',
    interests: ['Science experiments', 'Mathematics', 'Research', 'Technology', 'How systems work'],
    skills: ['Logical reasoning', 'Numeracy', 'Data analysis', 'Attention to detail', 'Persistence'],
    learn: [
      'General biology, chemistry, and physics',
      'Pre-calculus, basic calculus, and statistics',
      'Research writing and scientific investigation',
      'Laboratory practice and data interpretation'
    ],
    suited: [
      'You enjoy figuring out why something happens, not only that it happened',
      'You are comfortable with long problems that take several steps',
      'You like measuring, testing, and comparing results'
    ],
    college: ['Engineering', 'Health Sciences', 'Computer Science', 'Architecture', 'Natural Sciences'],
    careers: ['Civil engineer', 'Medical technologist', 'Data analyst', 'Research assistant', 'Architect'],
    considerations: [
      'The workload in math and science subjects is heavier than in other strands',
      'Many related college programmes have entrance exams or additional requirements'
    ],
    weights: { scientific: 0.24, analytical: 0.2, numerical: 0.2, persistence: 0.14, technical: 0.12, practical: 0.1 }
  },
  {
    slug: 'abm',
    code: 'ABM',
    name: 'Accountancy, Business & Management',
    track: 'Academic',
    tagline: 'For students interested in organisations, money, and how work gets managed.',
    summary:
      'ABM introduces business operations, financial records, marketing, and management. Students practise planning, budgeting, and presenting ideas to other people.',
    interests: ['Business ideas', 'Selling and marketing', 'Organising events', 'Money and budgeting', 'Leadership'],
    skills: ['Numeracy', 'Planning', 'Communication', 'Negotiation', 'Record keeping'],
    learn: [
      'Fundamentals of accountancy and business math',
      'Business ethics and organisation management',
      'Marketing principles and applied economics',
      'Business plan development'
    ],
    suited: [
      'You like organising people, resources, or activities',
      'You are curious about how businesses earn and spend',
      'You are comfortable presenting and persuading'
    ],
    college: ['Accountancy', 'Business Administration', 'Entrepreneurship', 'Economics', 'Hospitality Management'],
    careers: ['Accountant', 'Marketing officer', 'Operations supervisor', 'Bank associate', 'Small business owner'],
    considerations: [
      'Accountancy programmes are numbers-heavy and often have retention policies',
      'Some roles expect professional licensure after college'
    ],
    weights: { enterprise: 0.28, numerical: 0.24, communication: 0.16, social: 0.1, analytical: 0.12, persistence: 0.1 }
  },
  {
    slug: 'humss',
    code: 'HUMSS',
    name: 'Humanities & Social Sciences',
    track: 'Academic',
    tagline: 'For students interested in people, society, language, and ideas.',
    summary:
      'HUMSS explores culture, politics, communication, and human behaviour. Students read widely, discuss issues, and write and speak about them clearly.',
    interests: ['Reading and writing', 'Current events', 'Debate', 'Helping people', 'Culture and history'],
    skills: ['Written communication', 'Public speaking', 'Empathy', 'Critical reading', 'Research'],
    learn: [
      'Disciplines of the social sciences',
      'Creative and academic writing',
      'Philosophy, politics, and governance',
      'Community engagement and social advocacy'
    ],
    suited: [
      'You enjoy understanding why people behave the way they do',
      'You are comfortable expressing ideas in words',
      'You are interested in community or public service'
    ],
    college: ['Education', 'Communication', 'Psychology', 'Political Science', 'Law preparation'],
    careers: ['Teacher', 'Journalist', 'Guidance advocate', 'Public servant', 'Social worker'],
    considerations: [
      'Reading and writing loads are substantial',
      'Several related careers require graduate study or licensure'
    ],
    weights: { communication: 0.28, social: 0.3, analytical: 0.12, creative: 0.12, persistence: 0.18 }
  },
  {
    slug: 'gas',
    code: 'GAS',
    name: 'General Academic Strand',
    track: 'Academic',
    tagline: 'For students who are still deciding and want to keep options open.',
    summary:
      'GAS combines subjects from the other academic strands. It suits students who have several interests or who want more time before narrowing down a direction.',
    interests: ['Several subjects equally', 'Trying new things', 'Broad general knowledge'],
    skills: ['Adaptability', 'Self-management', 'General academic skills', 'Curiosity'],
    learn: [
      'Electives drawn from STEM, ABM, and HUMSS',
      'Humanities, social science, and applied economics',
      'Work immersion and research in daily life'
    ],
    suited: [
      'You have more than one interest and none clearly stands out yet',
      'You want a broad base before choosing a college programme'
    ],
    college: ['Most general programmes', 'Education', 'Liberal arts', 'Public administration'],
    careers: ['Varies widely by the college programme you later choose'],
    considerations: [
      'Some competitive college programmes prefer specific strand backgrounds',
      'You may need to catch up on specialised subjects later'
    ],
    weights: { analytical: 0.14, scientific: 0.1, communication: 0.16, social: 0.16, creative: 0.1, enterprise: 0.1, practical: 0.1, persistence: 0.14 }
  },
  {
    slug: 'ict',
    code: 'ICT',
    name: 'Information & Communications Technology (TVL)',
    track: 'TVL',
    tagline: 'For students who like building, testing and troubleshooting with computers.',
    summary:
      'ICT teaches programming, computer systems, networking, and digital media production. Work is project-based: students build, test, and troubleshoot real outputs.',
    interests: ['Computers and software', 'Games and apps', 'Digital art and video', 'Solving technical problems'],
    skills: ['Logical thinking', 'Patience in troubleshooting', 'Attention to detail', 'Self-directed learning'],
    learn: [
      'Computer programming fundamentals (Java, Python, or web technologies)',
      'Computer systems servicing and hardware setup',
      'Computer networking and basic administration',
      'Digital media: graphics, animation, and video editing',
      'Work immersion in a technology-related workplace'
    ],
    suited: [
      'You are patient when something does not work on the first try',
      'You like seeing a finished, working output at the end of a task',
      'You enjoy learning tools on your own outside class',
      'You are comfortable spending long stretches focused on a screen'
    ],
    college: ['Information Technology', 'Computer Science', 'Computer Engineering', 'Information Systems', 'Multimedia Arts'],
    careers: ['Software developer', 'Web developer', 'Network administrator', 'UI/UX designer', 'Technical support specialist', 'Digital media artist'],
    considerations: [
      'Regular access to a computer helps a lot outside school hours',
      'Some college programmes still expect strong math preparation',
      'Certificates from TESDA assessments depend on your school being an accredited centre'
    ],
    weights: { technical: 0.34, analytical: 0.2, creative: 0.12, persistence: 0.16, numerical: 0.08, practical: 0.06, enterprise: 0.04 }
  },
  {
    slug: 'arts-design',
    code: 'A&D',
    name: 'Arts & Design',
    track: 'Arts & Design',
    tagline: 'For students who express ideas visually, musically, or through performance.',
    summary:
      'Arts and Design develops creative practice and craft. Students build a body of work and learn how creative industries operate.',
    interests: ['Drawing and design', 'Music', 'Theatre and dance', 'Photography and film'],
    skills: ['Creative thinking', 'Composition', 'Discipline in practice', 'Receiving critique'],
    learn: [
      'Creative industries and the arts in context',
      'Performing or media arts production',
      'Portfolio and exhibit preparation'
    ],
    suited: [
      'You already make things regularly on your own',
      'You are willing to revise your work after feedback'
    ],
    college: ['Fine Arts', 'Multimedia Arts', 'Music', 'Theatre Arts', 'Film'],
    careers: ['Graphic designer', 'Animator', 'Musician', 'Production designer', 'Art teacher'],
    considerations: [
      'Portfolio or audition requirements are common',
      'Materials and equipment can add to costs'
    ],
    weights: { creative: 0.42, technical: 0.12, communication: 0.12, persistence: 0.16, practical: 0.1, social: 0.08 }
  },
  {
    slug: 'sports',
    code: 'SPORTS',
    name: 'Sports Track',
    track: 'Sports',
    tagline: 'For students committed to athletics, coaching, and physical wellness.',
    summary:
      'The Sports track covers athletic training, officiating, safety, and fitness leadership, combining physical practice with sports science basics.',
    interests: ['Sports and training', 'Fitness', 'Coaching others', 'Health and the body'],
    skills: ['Physical discipline', 'Teamwork', 'Coaching communication', 'Resilience'],
    learn: [
      'Human movement and safety in physical activity',
      'Coaching, officiating, and fitness testing',
      'Sports leadership and event management'
    ],
    suited: [
      'You train regularly and enjoy structured practice',
      'You are interested in how the body performs and recovers'
    ],
    college: ['Sports Science', 'Physical Education', 'Physical Therapy', 'Recreation Management'],
    careers: ['Coach', 'Fitness trainer', 'PE teacher', 'Sports officer', 'Therapy assistant'],
    considerations: [
      'Requires consistent physical training and time commitment',
      'Some programmes have physical or medical requirements'
    ],
    weights: { practical: 0.32, persistence: 0.24, social: 0.18, scientific: 0.1, communication: 0.1, analytical: 0.06 }
  }
];

export const STRANDS = STRAND_SEEDS;

/** Activities are keyed by the dimension they develop. */
export const ACTIVITIES = [
  {
    slug: 'explain-it-in-150-words',
    title: 'Explain it in 150 words',
    type: 'writing',
    targetCategory: 'communication',
    tier: 'foundation',
    difficulty: 1,
    minutes: 20,
    objectives: ['Practice drafting a clear explanation', 'Notice what readers need that you left out'],
    instructions:
      'Choose one idea you learned this week.\nWrite a 150-word explanation for a classmate who missed the lesson.\nRead it back and underline any sentence that assumes knowledge they do not have.\nRewrite those sentences.',
    completionCriteria: 'A 150-word explanation, revised once after reading it aloud.',
    check: [
      {
        prompt: 'A good explanation for a classmate should start by…',
        options: ['Using the most technical terms', 'Stating what they already know and what they will learn', 'Listing every detail at once'],
        answer: 1,
        explanation: 'Orienting the reader first makes the rest of the explanation easier to follow.'
      },
      {
        prompt: 'Which revision improves clarity most?',
        options: ['Adding more adjectives', 'Splitting a long sentence into two', 'Removing all examples'],
        answer: 1,
        explanation: 'Shorter sentences reduce the amount a reader has to hold at once.'
      }
    ]
  },
  {
    slug: 'mini-debate-prep',
    title: 'Prepare both sides of a mini-debate',
    type: 'practice',
    targetCategory: 'communication',
    tier: 'core',
    difficulty: 2,
    minutes: 30,
    objectives: ['Build an argument with evidence', 'Anticipate an opposing view'],
    instructions:
      'Pick a school or community issue you care about.\nWrite three reasons for one side and three for the other, each in one sentence.\nFind one piece of evidence for the strongest reason on each side.\nSay your opening statement out loud in 60 seconds.',
    completionCriteria: 'Six reasons, two pieces of evidence, and one 60-second spoken opening.',
    check: null
  },
  {
    slug: 'weekly-problem-log',
    title: 'Keep a weekly problem log',
    type: 'reflection',
    targetCategory: 'analytical',
    tier: 'foundation',
    difficulty: 1,
    minutes: 15,
    objectives: ['Separate facts from assumptions', 'Practice defining a problem before solving it'],
    instructions:
      'Pick one problem you met this week — a task, a group issue, or a school requirement.\nWrite what happened, what you assumed, and what you actually knew.\nWrite one sentence that defines the real problem.\nList two possible next steps.',
    completionCriteria: 'One logged problem with facts, assumptions, a problem statement, and two options.',
    check: [
      {
        prompt: 'Which part of a problem log separates evidence from opinion?',
        options: ['The list of next steps', 'The "what I actually knew" line', 'The title'],
        answer: 1,
        explanation: 'Recording what you can verify, separately from what you assume, is the core discipline.'
      }
    ]
  },
  {
    slug: 'decision-grid',
    title: 'Build a decision grid',
    type: 'exercise',
    targetCategory: 'analytical',
    tier: 'core',
    difficulty: 2,
    minutes: 30,
    objectives: ['Compare options using explicit criteria', 'Explain a choice using evidence'],
    instructions:
      'Choose a real decision, such as a strand shortlist or a group project plan.\nList three criteria that matter, and weight them (1–3).\nScore each option 1–5 per criterion in a table.\nMultiply, total the scores, and write three sentences on whether the result matches your instinct.',
    completionCriteria: 'A completed grid with weighted criteria and a written comparison.',
    check: null
  },
  {
    slug: 'listening-interview',
    title: 'Practise a listening interview',
    type: 'practice',
    targetCategory: 'social',
    tier: 'foundation',
    difficulty: 1,
    minutes: 25,
    objectives: ['Ask open questions', 'Summarise another person’s view accurately'],
    instructions:
      'Ask a classmate or family member about a decision they made recently.\nUse at least three open questions ("What led you to…?").\nDo not give advice.\nAfterwards, summarise what they said in three sentences and ask if you understood it correctly.',
    completionCriteria: 'Three open questions asked and a summary confirmed by the other person.',
    check: null
  },
  {
    slug: 'community-needs-survey',
    title: 'Run a five-person mini survey',
    type: 'research',
    targetCategory: 'social',
    tier: 'core',
    difficulty: 2,
    minutes: 45,
    objectives: ['Design simple questions', 'Report findings without overclaiming'],
    instructions:
      'Choose a question about your school or barangay that five people could answer.\nWrite four short questions, including one that can be counted.\nAsk five people and record answers without names.\nWrite five sentences: what you found, what you cannot conclude, and one follow-up question.',
    completionCriteria: 'Four questions, five anonymous responses, and a short limitations statement.',
    check: null
  },
  {
    slug: 'twenty-minute-focus-block',
    title: 'Twenty-minute focus block',
    type: 'reflection',
    targetCategory: 'persistence',
    tier: 'foundation',
    difficulty: 1,
    minutes: 20,
    objectives: ['Protect uninterrupted study time', 'Identify what breaks concentration'],
    instructions:
      'Choose one small task you have been avoiding.\nSet a timer for 20 minutes and put your phone out of reach.\nWork only on that task until the timer ends.\nWrite one sentence on what interrupted you and one change for next time.',
    completionCriteria: 'One completed block and one written adjustment.',
    check: null
  },
  {
    slug: 'debug-your-study-routine',
    title: 'Debug your study routine',
    type: 'reflection',
    targetCategory: 'persistence',
    tier: 'core',
    difficulty: 2,
    minutes: 30,
    objectives: ['Break a study goal into weekly steps', 'Plan for a specific obstacle'],
    instructions:
      'Name one subject you want to improve in over the next month.\nWrite what "improved" would look like in a measurable way.\nSplit it into four weekly steps.\nFor each step, write one obstacle and the response you will use when it appears.',
    completionCriteria: 'A four-week plan with an obstacle and response for each step.',
    check: null
  },
  {
    slug: 'one-page-profile-site',
    title: 'Build a one-page profile site',
    type: 'project',
    targetCategory: 'technical',
    tier: 'core',
    difficulty: 2,
    minutes: 60,
    objectives: ['Use HTML structure and CSS layout', 'Test work in a browser'],
    instructions:
      'Create one HTML file with a heading, a short paragraph about your strand interests, and a list of three skills.\nAdd CSS for readable spacing and one accent colour.\nOpen it in a browser and check it at phone width.\nWrite down one problem you fixed and how.',
    completionCriteria: 'A working page in a browser plus a short troubleshooting note.',
    check: [
      {
        prompt: 'Which HTML element is best for a list of skills?',
        options: ['<div> repeated', '<ul> with <li> items', '<table> with one column'],
        answer: 1,
        explanation: 'A list element gives the content structure that assistive technology can announce.'
      },
      {
        prompt: 'A page looks broken on a phone but fine on a laptop. What should you check first?',
        options: ['The viewport meta tag and fixed widths', 'The number of images', 'The page title'],
        answer: 0,
        explanation: 'Missing viewport configuration and fixed pixel widths are the most common causes.'
      }
    ]
  },
  {
    slug: 'trace-a-web-request',
    title: 'Trace how a page loads',
    type: 'research',
    targetCategory: 'technical',
    tier: 'foundation',
    difficulty: 1,
    minutes: 25,
    objectives: ['Understand the request/response cycle', 'Read basic developer tools output'],
    instructions:
      'Open a simple website and its browser developer tools (Network tab).\nReload the page and note the first three requests and their status codes.\nFind one file that took the longest to load.\nWrite a five-sentence explanation of what happened, in your own words.',
    completionCriteria: 'Three recorded requests and a five-sentence explanation.',
    check: null
  },
  {
    slug: 'real-dataset',
    title: 'Make sense of a real dataset',
    type: 'exercise',
    targetCategory: 'numerical',
    tier: 'core',
    difficulty: 2,
    minutes: 40,
    objectives: ['Summarise data with simple statistics', 'Question how data was collected'],
    instructions:
      'Find a small public dataset (school enrolment, weather, or prices).\nCompute or read off the average, the highest and the lowest value.\nMake one chart by hand or in a spreadsheet.\nWrite two sentences on what the data cannot tell you.',
    completionCriteria: 'Summary values, one chart, and a limitations note.',
    check: null
  },
  {
    slug: 'budget-a-school-week',
    title: 'Budget a school week',
    type: 'exercise',
    targetCategory: 'numerical',
    tier: 'foundation',
    difficulty: 1,
    minutes: 25,
    objectives: ['Track spending accurately', 'Compare planned against actual costs'],
    instructions:
      'Estimate your spending for one school week: transport, food, materials.\nRecord the actual amounts each day.\nAt the end of the week, compare plan and actual in a small table.\nWrite one sentence on the biggest difference and why it happened.',
    completionCriteria: 'A plan, five days of actuals, and a comparison table.',
    check: null
  },
  {
    slug: 'ten-sketch-week',
    title: 'Ten-sketch warm-up week',
    type: 'practice',
    targetCategory: 'creative',
    tier: 'foundation',
    difficulty: 1,
    minutes: 15,
    objectives: ['Build a repeatable creative habit', 'Separate drafting from polishing'],
    instructions:
      'Make ten quick sketches or short musical phrases across five days (two per day).\nKeep each under five minutes and do not erase.\nAt the end, choose one to develop and write three sentences on why it interests you.',
    completionCriteria: 'Ten rough pieces and one chosen for development.',
    check: null
  },
  {
    slug: 'redesign-a-school-poster',
    title: 'Redesign a school poster',
    type: 'project',
    targetCategory: 'creative',
    tier: 'core',
    difficulty: 2,
    minutes: 50,
    objectives: ['Apply hierarchy and contrast', 'Revise work using a critique'],
    instructions:
      'Find a school announcement poster.\nWrite down its message and its intended reader.\nRedesign it with one clear headline, one supporting detail, and a visible action.\nAsk one person what they noticed first, and revise once.',
    completionCriteria: 'Before and after versions plus one recorded critique and revision.',
    check: [
      {
        prompt: 'The main purpose of visual hierarchy is to…',
        options: ['Use more colours', 'Guide the reader through information in order of importance', 'Fill empty space'],
        answer: 1,
        explanation: 'Hierarchy tells the reader what to read first, second and last.'
      }
    ]
  },
  {
    slug: 'cost-it-out',
    title: 'Cost out a small venture',
    type: 'project',
    targetCategory: 'enterprise',
    tier: 'core',
    difficulty: 2,
    minutes: 45,
    objectives: ['Estimate costs and price', 'Test whether an idea can pay for itself'],
    instructions:
      'Choose a small product or service students could realistically sell.\nList materials or time costs for one unit.\nSet a price and calculate the margin per unit.\nWrite how many units you would need to sell to cover one week of costs.',
    completionCriteria: 'A unit cost estimate, a price, a margin, and a break-even count.',
    check: null
  },
  {
    slug: 'map-a-school-event',
    title: 'Map a school event',
    type: 'exercise',
    targetCategory: 'enterprise',
    tier: 'foundation',
    difficulty: 1,
    minutes: 25,
    objectives: ['Sequence tasks and owners', 'Identify the riskiest step'],
    instructions:
      'Choose a small school event.\nList the tasks that must happen before, during and after.\nAssign an owner to each and put the tasks in order.\nMark the task most likely to fail and write a backup plan.',
    completionCriteria: 'A sequenced task list with owners, one risk and a backup.',
    check: null
  },
  {
    slug: 'skill-practice-log',
    title: 'Keep a skill practice log',
    type: 'practice',
    targetCategory: 'practical',
    tier: 'foundation',
    difficulty: 1,
    minutes: 20,
    objectives: ['Practice deliberately instead of repeating blindly', 'Track small improvements'],
    instructions:
      'Choose one practical skill you can practise safely at home or school.\nPractise three times this week for 10 minutes.\nAfter each session, note what you tried, what improved, and what still feels awkward.\nAsk someone experienced for one correction.',
    completionCriteria: 'Three logged sessions and one piece of feedback applied.',
    check: null
  },
  {
    slug: 'assemble-and-test',
    title: 'Assemble, test, then explain',
    type: 'project',
    targetCategory: 'practical',
    tier: 'core',
    difficulty: 2,
    minutes: 40,
    objectives: ['Follow a procedure safely', 'Verify a result rather than assuming it'],
    instructions:
      'Choose a safe assembly or setup task (a lamp, a cable setup, a simple recipe, a fitness circuit).\nRead the procedure fully before starting and note the safety points.\nAssemble or perform it, then test it against the stated criteria.\nWrite three sentences on what you verified and what you could not.',
    completionCriteria: 'A completed build or routine, a test result, and a verification note.',
    check: null
  },
  {
    slug: 'ask-a-testable-question',
    title: 'Turn curiosity into a testable question',
    type: 'exercise',
    targetCategory: 'scientific',
    tier: 'foundation',
    difficulty: 1,
    minutes: 20,
    objectives: ['Distinguish testable from untestable questions', 'Identify a measurable outcome'],
    instructions:
      'Write three questions you are curious about.\nFor each, decide whether it could be answered with evidence you could collect.\nRewrite one as a testable question with a measurable outcome.\nName the variable you would change and the one you would measure.',
    completionCriteria: 'Three questions, one rewritten as testable, with variables named.',
    check: [
      {
        prompt: 'Which question is testable with school-level evidence?',
        options: ['Is science the best subject?', 'Does studying with music affect recall scores?', 'Should students like science?'],
        answer: 1,
        explanation: 'It names a change and a measurable outcome, so evidence can support or contradict it.'
      }
    ]
  },
  {
    slug: 'mini-experiment-writeup',
    title: 'Write up a mini experiment',
    type: 'research',
    targetCategory: 'scientific',
    tier: 'core',
    difficulty: 2,
    minutes: 45,
    objectives: ['Report method and evidence honestly', 'Separate result from interpretation'],
    instructions:
      'Run a safe, simple comparison (plant growth, paper plane distance, cooling rates).\nRecord your method, including what you kept the same.\nPresent the results in a table.\nWrite a conclusion and a separate paragraph on what could have affected the result.',
    completionCriteria: 'Method, results table, conclusion, and a limitations paragraph.',
    check: null
  }
];

export const AI_SYSTEM_BOUNDARY = [
  'You are part of STRANDPATH, a school guidance tool for Senior High School students in the Philippines.',
  'You explain results that were computed by a deterministic scoring engine. You never change scores, invent scores, or invent records.',
  'You never tell a student which strand they must choose. You help them understand options and make their own decision.',
  'You do not diagnose, counsel, or act as a mental health professional. For personal distress or safety concerns, encourage the student to speak with a trusted adult or the school guidance office.',
  'Use only the STRANDPATH context provided. If information is missing or uncertain, say so plainly.',
  'Do not invent curriculum requirements, admission rules, school policies, or TESDA/CHED details.',
  'Keep language age-appropriate, non-judgmental, and concise.'
].join(' ');
