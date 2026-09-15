import { Strand } from '../types';

export const strands: Strand[] = [
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
  'Laboratory practice and data interpretation'],

  suitedFor: [
  'You enjoy figuring out why something happens, not only that it happened',
  'You are comfortable with long problems that take several steps',
  'You like measuring, testing, and comparing results'],

  collegeFields: ['Engineering', 'Health Sciences', 'Computer Science', 'Architecture', 'Natural Sciences'],
  careerAreas: ['Civil engineer', 'Medical technologist', 'Data analyst', 'Research assistant', 'Architect'],
  considerations: [
  'The workload in math and science subjects is heavier than in other strands',
  'Many related college programmes have entrance exams or additional requirements']

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
  'Business plan development'],

  suitedFor: [
  'You like organising people, resources, or activities',
  'You are curious about how businesses earn and spend',
  'You are comfortable presenting and persuading'],

  collegeFields: ['Accountancy', 'Business Administration', 'Entrepreneurship', 'Economics', 'Hospitality Management'],
  careerAreas: ['Accountant', 'Marketing officer', 'Operations supervisor', 'Bank associate', 'Small business owner'],
  considerations: [
  'Accountancy programmes are numbers-heavy and often have retention policies',
  'Some roles expect professional licensure after college']

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
  'Community engagement and social advocacy'],

  suitedFor: [
  'You enjoy understanding why people behave the way they do',
  'You are comfortable expressing ideas in words',
  'You are interested in community or public service'],

  collegeFields: ['Education', 'Communication', 'Psychology', 'Political Science', 'Law preparation'],
  careerAreas: ['Teacher', 'Journalist', 'Guidance advocate', 'Public servant', 'Social worker'],
  considerations: [
  'Reading and writing loads are substantial',
  'Several related careers require graduate study or licensure']

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
  'Work immersion and research in daily life'],

  suitedFor: [
  'You have more than one interest and none clearly stands out yet',
  'You want a broad base before choosing a college programme'],

  collegeFields: ['Most general programmes', 'Education', 'Liberal arts', 'Public administration'],
  careerAreas: ['Varies widely by the college programme you later choose'],
  considerations: [
  'Some competitive college programmes prefer specific strand backgrounds',
  'You may need to catch up on specialised subjects later']

},
{
  slug: 'tvl',
  code: 'TVL',
  name: 'Technical-Vocational-Livelihood',
  track: 'TVL',
  tagline: 'For students who learn best by doing and want job-ready skills.',
  summary:
  'TVL is hands-on and competency-based. Students train in a chosen specialisation and can earn national certificates alongside their diploma.',
  interests: ['Building and repairing', 'Practical work', 'Technology', 'Cooking, farming, or crafts'],
  skills: ['Manual dexterity', 'Following procedures', 'Troubleshooting', 'Safety awareness'],
  learn: [
  'A chosen specialisation with practical workshops',
  'Competency assessments toward TESDA certificates',
  'Workplace safety and work immersion'],

  suitedFor: [
  'You would rather practise a skill than read about it',
  'You want employable skills right after senior high school'],

  collegeFields: ['Information Technology', 'Engineering technology', 'Hospitality', 'Agriculture'],
  careerAreas: ['Depends on the specialisation you choose'],
  considerations: [
  'Available specialisations differ from school to school',
  'Some specialisations require equipment or materials fees'],

  subTracks: [
  { name: 'Information & Communications Technology', slug: 'ict', note: 'Programming, networking, and digital media' },
  { name: 'Home Economics', note: 'Cookery, baking, tourism, and caregiving' },
  { name: 'Industrial Arts', note: 'Electrical, welding, automotive, and carpentry' },
  { name: 'Agri-Fishery Arts', note: 'Crop production, animal raising, and aquaculture' }]

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
  'Portfolio and exhibit preparation'],

  suitedFor: [
  'You already make things regularly on your own',
  'You are willing to revise your work after feedback'],

  collegeFields: ['Fine Arts', 'Multimedia Arts', 'Music', 'Theatre Arts', 'Film'],
  careerAreas: ['Graphic designer', 'Animator', 'Musician', 'Production designer', 'Art teacher'],
  considerations: [
  'Portfolio or audition requirements are common',
  'Materials and equipment can add to costs']

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
  'Sports leadership and event management'],

  suitedFor: [
  'You train regularly and enjoy structured practice',
  'You are interested in how the body performs and recovers'],

  collegeFields: ['Sports Science', 'Physical Education', 'Physical Therapy', 'Recreation Management'],
  careerAreas: ['Coach', 'Fitness trainer', 'PE teacher', 'Sports officer', 'Therapy assistant'],
  considerations: [
  'Requires consistent physical training and time commitment',
  'Some programmes have physical or medical requirements']

},
{
  slug: 'ict',
  code: 'ICT',
  name: 'Information & Communications Technology',
  track: 'TVL',
  isSubTrack: true,
  tagline: 'A TVL specialisation for students who like building things with computers.',
  summary:
  'ICT teaches programming, computer systems, networking, and digital media production. Work is project-based: students build, test, and troubleshoot real outputs.',
  interests: ['Computers and software', 'Games and apps', 'Digital art and video', 'Solving technical problems'],
  skills: ['Logical thinking', 'Patience in troubleshooting', 'Attention to detail', 'Self-directed learning', 'Following technical instructions'],
  learn: [
  'Computer programming fundamentals (Java, Python, or web technologies)',
  'Computer systems servicing and hardware setup',
  'Computer networking and basic administration',
  'Digital media: graphics, animation, and video editing',
  'Work immersion in a technology-related workplace'],

  suitedFor: [
  'You are patient when something does not work on the first try',
  'You like seeing a finished, working output at the end of a task',
  'You enjoy learning tools on your own outside class',
  'You are comfortable spending long stretches focused on a screen'],

  collegeFields: [
  'Information Technology',
  'Computer Science',
  'Computer Engineering',
  'Information Systems',
  'Multimedia Arts'],

  careerAreas: [
  'Software developer',
  'Web developer',
  'Network administrator',
  'UI/UX designer',
  'Technical support specialist',
  'Digital media artist'],

  considerations: [
  'Regular access to a computer helps a lot outside school hours',
  'Some college programmes still expect strong math preparation',
  'Certificates from TESDA assessments depend on your school being an accredited centre']

}];


export const gridStrands = strands.filter((s) => !s.isSubTrack);

export function getStrand(slug: string): Strand | undefined {
  return strands.find((s) => s.slug === slug);
}