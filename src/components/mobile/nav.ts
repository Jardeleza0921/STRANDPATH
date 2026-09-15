export type MobileScreen =
'welcome' |
'login' |
'home' |
'intro' |
'question' |
'progress' |
'results' |
'strand' |
'pathway' |
'profile';

export interface ScreenProps {
  go: (screen: MobileScreen) => void;
}

export const screenTitles: {id: MobileScreen;label: string;}[] = [
{ id: 'welcome', label: 'Welcome' },
{ id: 'login', label: 'Sign in' },
{ id: 'home', label: 'Home' },
{ id: 'intro', label: 'Assessment intro' },
{ id: 'question', label: 'Assessment question' },
{ id: 'progress', label: 'Assessment progress' },
{ id: 'results', label: 'Results' },
{ id: 'strand', label: 'Strand details' },
{ id: 'pathway', label: 'Pathway exploration' },
{ id: 'profile', label: 'Profile & settings' }];