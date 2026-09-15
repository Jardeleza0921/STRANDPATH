export interface PathwayBranch {
  field: string;
  note: string;
  careers: string[];
}

export interface Pathway {
  slug: string;
  strand: string;
  strandName: string;
  branches: PathwayBranch[];
}

export const pathways: Pathway[] = [
{
  slug: 'ict',
  strand: 'ICT',
  strandName: 'Information & Communications Technology',
  branches: [
  {
    field: 'Information Technology',
    note: 'Applying technology to real organisational needs',
    careers: ['Software developer', 'Web developer', 'Systems administrator', 'QA analyst']
  },
  {
    field: 'Computer Science',
    note: 'Theory, algorithms, and software foundations',
    careers: ['Backend engineer', 'Data engineer', 'Machine learning associate']
  },
  {
    field: 'Computer Engineering',
    note: 'Where hardware and software meet',
    careers: ['Network engineer', 'Embedded systems technician', 'IT infrastructure officer']
  },
  {
    field: 'Multimedia Arts',
    note: 'Design and digital media production',
    careers: ['UI/UX designer', 'Motion graphics artist', 'Digital content producer']
  }]

},
{
  slug: 'stem',
  strand: 'STEM',
  strandName: 'Science, Technology, Engineering & Mathematics',
  branches: [
  {
    field: 'Engineering',
    note: 'Designing and building physical systems',
    careers: ['Civil engineer', 'Electrical engineer', 'Industrial engineer']
  },
  {
    field: 'Health Sciences',
    note: 'Human health and clinical practice',
    careers: ['Nurse', 'Medical technologist', 'Pharmacist']
  },
  {
    field: 'Natural Sciences',
    note: 'Research and laboratory work',
    careers: ['Research assistant', 'Environmental analyst', 'Science teacher']
  }]

},
{
  slug: 'abm',
  strand: 'ABM',
  strandName: 'Accountancy, Business & Management',
  branches: [
  {
    field: 'Accountancy',
    note: 'Financial reporting and audit',
    careers: ['Accountant', 'Audit associate', 'Tax specialist']
  },
  {
    field: 'Business Administration',
    note: 'Managing operations, people, and markets',
    careers: ['Marketing officer', 'HR associate', 'Operations supervisor']
  },
  {
    field: 'Entrepreneurship',
    note: 'Starting and running a venture',
    careers: ['Business owner', 'Product associate', 'Franchise manager']
  }]

}];


export function getPathway(slug: string) {
  return pathways.find((p) => p.slug === slug) ?? pathways[0];
}