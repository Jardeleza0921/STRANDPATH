import type { FaqKnowledge } from '../types';

/**
 * General questions the assistant answers with structured, static guidance.
 * These are deliberately conservative: they explain the system and how to
 * think about a decision, and never claim to know a school's offerings.
 */
export const faqKnowledge: FaqKnowledge[] = [
  {
    id: 'undecided',
    question: 'I am still undecided. Can you help me?',
    paragraphs: [
      'Being undecided at this point is normal, and it is not a failure. Most students are choosing between plausible options, not between one right answer and several wrong ones.',
      'A useful way to move is to separate three things: what you enjoy doing, what you are currently good at, and what you are willing to practise. A strand only needs to fit the first and give you room to build the third.'
    ],
    points: [
      { label: 'Start with evidence', text: 'Take the assessment and read the top three strands, including the considerations — not only the scores.' },
      { label: 'Test an interest cheaply', text: 'Try one small activity in each of your two strongest areas before deciding. Twenty minutes of real practice tells you more than another personality quiz.' },
      { label: 'Keep a broad option', text: 'GAS exists for students who want more time. Choosing it is a decision, not a delay — but check which college programmes it prepares you for.' },
      { label: 'Talk to one person', text: 'Bring your results to your adviser or guidance office and ask what they have seen students with similar interests do.' }
    ],
    suggestions: ['What strand is suitable for me?', 'What are the differences between GAS and TVL?', 'What other options do I have?']
  },
  {
    id: 'how-recommendation-works',
    question: 'How does STRANDPATH compute my recommendation?',
    paragraphs: [
      'Your answers give points to ten dimensions such as analysis, technology, communication and persistence. Each dimension is converted to a percentage of what was attainable in that attempt.',
      'Each strand has its own published weighting of those dimensions. The alignment index is the weighted average, scaled to 100. It describes how closely your answers match a strand profile — it is not a probability, a grade, or a prediction that you will succeed.'
    ],
    points: [
      { label: 'Deterministic', text: 'The same answers produce the same result every time. No AI model is used to score, rank or change your result.' },
      { label: 'Versioned', text: 'Every attempt stores the questionnaire version and algorithm version used, so a result can always be read in context.' },
      { label: 'Transparent', text: 'Each ranked strand lists the dimensions that contributed and the answers behind them. That is what “Show evidence” displays.' },
      { label: 'Not a diagnosis', text: 'The questionnaire is a technical draft, not a validated psychological test. It is structured guidance for a conversation.' }
    ],
    suggestions: ['Why was my top strand recommended?', 'What skills should I improve?', 'What other options do I have?']
  },
  {
    id: 'strand-vs-track',
    question: 'What is the difference between a track and a strand?',
    paragraphs: [
      'A track is the broad group; a strand is the specific programme inside it. The Academic track contains STEM, ABM, HUMSS and GAS. TVL contains specialisations such as ICT, Home Economics, Industrial Arts and Agri-Fishery Arts. Arts and Design and Sports are tracks with their own strand.',
      'When people ask “what strand should I take?”, they usually mean the specific programme. When they ask about TVL, the specialisation matters as much as the track.'
    ],
    suggestions: ['What is the difference between STEM and ICT?', 'What specialisations does TVL have?', 'What strand is suitable for me?']
  },
  {
    id: 'tvl-specialisations',
    question: 'What specialisations does TVL have?',
    paragraphs: [
      'TVL covers four broad specialisation groups: Information and Communications Technology (ICT), Home Economics, Industrial Arts, and Agri-Fishery Arts. Each group contains several competency-based courses, and the exact list depends on the school.',
      'TVL can lead to work after Grade 12, a TESDA certificate where the school is an accredited assessment centre, or college. It is not a lower choice — it is a different balance between practice and theory.'
    ],
    points: [
      { label: 'ICT', text: 'Programming, computer systems servicing, networking and digital media.' },
      { label: 'Home Economics', text: 'Cookery, baking, tourism, caregiving and related service skills.' },
      { label: 'Industrial Arts', text: 'Electrical installation, welding, automotive servicing and carpentry.' },
      { label: 'Agri-Fishery Arts', text: 'Crop production, animal raising and aquaculture.' }
    ],
    suggestions: ['What college courses can I take after ICT?', 'What careers are related to TVL?', 'Is TVL a good choice for college?']
  },
  {
    id: 'stem-vs-ict',
    question: 'What is the difference between STEM and ICT?',
    paragraphs: [
      'Both can lead to technology work, but they are built differently. STEM is an academic strand with heavy science, mathematics and research. It keeps more science and engineering college programmes open, including medicine, engineering and the pure sciences.',
      'ICT is a TVL specialisation. It is hands-on and project-based: programming, hardware servicing, networking and digital media. It can lead straight to technical work or to IT-related college programmes. It usually has less advanced mathematics and science than STEM.'
    ],
    points: [
      { label: 'Choose STEM if', text: 'You want engineering, health sciences or a science degree, and you are willing to keep up with advanced maths and laboratory work.' },
      { label: 'Choose ICT if', text: 'You want to build and troubleshoot real systems now, prefer learning by doing, and are aiming at IT, support or digital media work.' },
      { label: 'Either can work if', text: 'You want software development. Check the maths requirement of the specific college programme, then choose the strand you can actually sustain.' }
    ],
    suggestions: ['I like computers but I am not good at maths. What should I consider?', 'What college courses can I take after ICT?', 'Compare STEM and ICT for me']
  },
  {
    id: 'not-good-at-math',
    question: 'What if the strand I like requires maths I am not good at?',
    paragraphs: [
      'Disliking maths and being unable to learn it are different things, but both are worth taking seriously. The useful question is not “am I good at maths?” but “which programme needs which maths, and am I willing to build it?”',
      'If a programme needs calculus or statistics, plan to strengthen the foundation now instead of hoping it resolves itself. If you want technology work without a heavy maths load, IT, Information Systems and ICT specialisations are usually gentler than Computer Science or Engineering.'
    ],
    points: [
      { label: 'Technology without heavy maths', text: 'BS Information Technology, BS Information Systems, and ICT specialisations focus more on systems, support and application than on proof and calculus.' },
      { label: 'Maths-heavy technology', text: 'BS Computer Science, Computer Engineering and STEM-based engineering degrees expect strong algebra, trigonometry and often calculus.' },
      { label: 'Build the foundation', text: 'Practise the specific topics the programme lists — usually algebra, functions and statistics — rather than redoing everything.' }
    ],
    suggestions: ['What college courses can I take after ICT?', 'What careers are related to ICT?', 'What skills should I improve?']
  },
  {
    id: 'after-humss',
    question: 'What can I do after HUMSS?',
    paragraphs: [
      'HUMSS prepares you for programmes that depend on reading, writing, argument and understanding people: communication, psychology, political science, education, social work, sociology, law preparation and several liberal arts degrees.',
      'It is a strong base for law and public service, but it also fits people-facing work in media, HR, training and community organisations. HUMSS does not close science doors by itself, but some science programmes will expect bridging work.'
    ],
    suggestions: ['What careers are related to HUMSS?', 'What college courses can I take after HUMSS?', 'Compare HUMSS and GAS for me']
  },
  {
    id: 'college-vs-work',
    question: 'Should I go to college or start working after Grade 12?',
    paragraphs: [
      'Both are legitimate routes, and the decision depends on your situation: family finances, the work available near you, whether a licence or degree is required for the work you want, and whether you can study while earning.',
      'A practical way to decide is to name the job or field you are aiming at and check whether it requires a degree, a licence, or a portfolio. If it requires a licence, college is not optional. If it requires demonstrable skill, a certificate plus a portfolio can be a faster first step.'
    ],
    points: [
      { label: 'Degree required', text: 'Teaching, nursing, engineering, accountancy, law, psychology practice, social work and many government roles.' },
      { label: 'Portfolio or certificate can start you', text: 'Software development, design, media production, technical support, hospitality and skilled trades — but check each employer.' },
      { label: 'You can combine them', text: 'Many students work while studying. It is demanding, so plan the schedule honestly rather than assuming it will fit.' }
    ],
    suggestions: ['What careers are related to ICT?', 'What college courses can I take after TVL?', 'What should I do next?']
  },
  {
    id: 'school-offerings',
    question: 'Does every school offer every strand?',
    paragraphs: [
      'No. Schools offer different strands and TVL specialisations depending on their teachers, laboratories and partnerships. A strand described here may not be available at your school, and a specialisation may have a different name.',
      'Check your school’s actual offerings and requirements before you decide. STRANDPATH can explain the pathways, but it cannot confirm what your school will offer next year.'
    ],
    suggestions: ['What strand is suitable for me?', 'What specialisations does TVL have?', 'How do I choose between two strands?']
  },
  {
    id: 'privacy',
    question: 'Where is my data stored?',
    paragraphs: [
      'In this static STRANDPATH build, your account, answers and results are stored only in this browser’s local storage. They are not sent to a server and are not visible to your school from here.',
      'That also means the records disappear if you clear site data, use private browsing, or switch device or browser. Export your records from the Profile page if you need a copy, and treat this build as a personal tool rather than an official school record.'
    ],
    suggestions: ['How do I export my records?', 'How does STRANDPATH compute my recommendation?', 'What should I do next?']
  },
  {
    id: 'emotional-support',
    question: 'I feel overwhelmed by this decision.',
    paragraphs: [
      'Choosing a strand can feel heavy, especially when other people have opinions about it. That pressure is real, and it is bigger than a questionnaire.',
      'If the worry is affecting your sleep, appetite, attendance or sense of safety, please talk to a trusted adult, your parent or guardian, or your school guidance counsellor. STRANDPATH is a guidance tool, not a counsellor, and it cannot assess your mental health.'
    ],
    suggestions: ['What should I do next?', 'I am still undecided', 'Where is my data stored?']
  }
];
