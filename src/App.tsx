import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AssessmentProvider } from './contexts/AssessmentContext';
import { SiteLayout } from './components/site/SiteLayout';
import { AppShell } from './components/app/AppShell';
import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { ExploreStrands } from './pages/ExploreStrands';
import { About } from './pages/About';
import { StrandDetailPage } from './pages/StrandDetailPage';
import { Cover } from './pages/Cover';
import { DesignSystem } from './pages/DesignSystem';
import { MobileApp } from './pages/MobileApp';
import { MobileGallery } from './pages/MobileGallery';
import { Dashboard } from './pages/app/Dashboard';
import { AssessmentIntro } from './pages/app/AssessmentIntro';
import { Assessment } from './pages/app/Assessment';
import { AssessmentReview } from './pages/app/AssessmentReview';
import { Results } from './pages/app/Results';
import { AppStrandDetail } from './pages/app/AppStrandDetail';
import { Pathways } from './pages/app/Pathways';

export function App() {
  return (
    <AssessmentProvider>
      <BrowserRouter basename="/STRANDPATH">
        <Routes>
          <Route element={<SiteLayout />}>
          <Route path="/" element={<Cover />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/strands" element={<ExploreStrands />} />
          <Route path="/strands/:slug" element={<StrandDetailPage />} />
          <Route path="/about" element={<About />} />
        </Route>

          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="assessment/intro" element={<AssessmentIntro />} />
            <Route path="assessment/review" element={<AssessmentReview />} />
            <Route path="assessment/:index" element={<Assessment />} />
            <Route path="results" element={<Results />} />
            <Route path="strands/:slug" element={<AppStrandDetail />} />
            <Route path="pathways" element={<Pathways />} />
          </Route>

          <Route path="/mobile" element={<MobileApp />} />
          <Route path="/mobile/all" element={<MobileGallery />} />
          <Route path="/cover" element={<Cover />} />
          <Route path="/design-system" element={<DesignSystem />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      <BrowserRouter basename="/STRANDPATH">
    </AssessmentProvider>);

}
