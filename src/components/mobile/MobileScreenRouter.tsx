import React from 'react';
import { MobileScreen, ScreenProps } from './nav';
import { MobileWelcome } from './screens/MobileWelcome';
import { MobileLogin } from './screens/MobileLogin';
import { MobileHome } from './screens/MobileHome';
import { MobileIntro } from './screens/MobileIntro';
import { MobileQuestion } from './screens/MobileQuestion';
import { MobileProgress } from './screens/MobileProgress';
import { MobileResults } from './screens/MobileResults';
import { MobileStrand } from './screens/MobileStrand';
import { MobilePathway } from './screens/MobilePathway';
import { MobileProfile } from './screens/MobileProfile';

const map: Record<MobileScreen, React.ComponentType<ScreenProps>> = {
  welcome: MobileWelcome,
  login: MobileLogin,
  home: MobileHome,
  intro: MobileIntro,
  question: MobileQuestion,
  progress: MobileProgress,
  results: MobileResults,
  strand: MobileStrand,
  pathway: MobilePathway,
  profile: MobileProfile
};

export function MobileScreenRouter({ screen, go }: {screen: MobileScreen;} & ScreenProps) {
  const Screen = map[screen];
  return <Screen go={go} />;
}