export interface Step {
  number: string;
  title: string;
  description: string;
  detail: string;
}

export const steps: Step[] = [
{
  number: '01',
  title: 'Understand yourself',
  description: 'Start with a short reflection on how you learn and work.',
  detail:
  'Before any strand is mentioned, StrandPath asks about how you approach difficulty, how you prefer to learn, and what a good day of work looks like to you.'
},
{
  number: '02',
  title: 'Explore your interests',
  description: 'Choose the subjects, activities, and topics you are drawn to.',
  detail:
  'You select from everyday activities and school subjects. Curiosity counts — you do not need experience in something for it to matter here.'
},
{
  number: '03',
  title: 'Identify your strengths',
  description: 'Name the skills you already use, including outside class.',
  detail:
  'Informal experience counts: helping in a family business, fixing a device, leading a club, or editing videos for friends.'
},
{
  number: '04',
  title: 'Discover possible strand matches',
  description: 'See which strands connect to what you selected, and why.',
  detail:
  'Every match comes with an explanation of which answers led to it. Nothing is presented as a final verdict — matches are described as strong, good, or possible.'
},
{
  number: '05',
  title: 'Explore future pathways',
  description: 'Follow each strand toward college fields and career areas.',
  detail:
  'You can trace a strand into related college programmes and the kinds of work they can lead to, so a choice today has visible context.'
}];