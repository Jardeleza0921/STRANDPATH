import React from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { isStaticMode, routerMode } from './lib/mode';
import { ThemeProvider } from './contexts/ThemeContext';
import { RequireAuth } from './components/RequireAuth';
import { SiteLayout } from './components/site/SiteLayout';
import { AppShell } from './components/app/AppShell';
import { AdminShell } from './components/admin/AdminShell';
import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { ExploreStrands } from './pages/ExploreStrands';
import { About } from './pages/About';
import { StrandDetailPage } from './pages/StrandDetailPage';
import { Careers } from './pages/Careers';
import { Methodology } from './pages/Methodology';
import { Cover } from './pages/Cover';
import { DesignSystem } from './pages/DesignSystem';
import { MobileApp } from './pages/MobileApp';
import { MobileGallery } from './pages/MobileGallery';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ChangePassword } from './pages/auth/ChangePassword';

import { Dashboard } from './pages/app/Dashboard';
import { AssessmentIntro } from './pages/app/AssessmentIntro';
import { Assessment } from './pages/app/Assessment';
import { AssessmentReview } from './pages/app/AssessmentReview';
import { Results } from './pages/app/Results';
import { History } from './pages/app/History';
import { Compare } from './pages/app/Compare';
import { StrandExplorer } from './pages/app/StrandExplorer';
import { StrandDetail } from './pages/app/StrandDetail';
import { CompareStrands } from './pages/app/CompareStrands';
import { Pathways } from './pages/app/Pathways';
import { Program } from './pages/app/Program';
import { ActivityPage } from './pages/app/ActivityPage';
import { Progress } from './pages/app/Progress';
import { Development } from './pages/app/Development';
import { PostAssessment } from './pages/app/PostAssessment';
import { Assistance } from './pages/app/Assistance';
import { Support } from './pages/app/Support';
import { Profile } from './pages/app/Profile';
import { Settings } from './pages/app/Settings';

import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminStudentDetail } from './pages/admin/AdminStudentDetail';
import { AdminQuestionnaire } from './pages/admin/AdminQuestionnaire';
import { AdminStrands } from './pages/admin/AdminStrands';
import { AdminActivities } from './pages/admin/AdminActivities';
import { AdminTickets } from './pages/admin/AdminTickets';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminLogs } from './pages/admin/AdminLogs';

const Router = routerMode === 'hash' ? HashRouter : BrowserRouter;

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/strands" element={<ExploreStrands />} />
              <Route path="/strands/:slug" element={<StrandDetailPage />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/cover" element={<Cover />} />
              <Route path="/design-system" element={<DesignSystem />} />
              <Route path="/mobile" element={<MobileApp />} />
              <Route path="/mobile/all" element={<MobileGallery />} />
            </Route>

            <Route
              path="/change-password"
              element={
                <RequireAuth>
                  <ChangePassword />
                </RequireAuth>
              }
            />

            <Route
              path="/app"
              element={
                <RequireAuth roles={['student']}>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="assessment" element={<AssessmentIntro />} />
              <Route path="assessment/:id/q/:index" element={<Assessment />} />
              <Route path="assessment/:id/review" element={<AssessmentReview />} />
              <Route path="results" element={<Results />} />
              <Route path="results/:id" element={<Results />} />
              <Route path="history" element={<History />} />
              <Route path="compare" element={<Compare />} />
              <Route path="strands" element={<StrandExplorer />} />
              <Route path="strands/compare" element={<CompareStrands />} />
              <Route path="strands/:slug" element={<StrandDetail />} />
              <Route path="pathways" element={<Pathways />} />
              <Route path="development" element={<Development />} />
              <Route path="program" element={<Program />} />
              <Route path="program/activities/:id" element={<ActivityPage />} />
              <Route path="progress" element={<Progress />} />
              <Route path="post-assessment" element={<PostAssessment />} />
              <Route path="assistance" element={<Assistance />} />
              <Route path="coach" element={<Navigate to="/app/assistance" replace />} />
              <Route path="support" element={<Support />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {!isStaticMode() ? (
            <Route
              path="/admin"
              element={
                <RequireAuth roles={['admin', 'guidance']}>
                  <AdminShell />
                </RequireAuth>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:id" element={<AdminStudentDetail />} />
              <Route path="questionnaire" element={<AdminQuestionnaire />} />
              <Route path="strands" element={<AdminStrands />} />
              <Route path="activities" element={<AdminActivities />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="logs" element={<AdminLogs />} />
            </Route>

            ) : (
              <Route path="/admin" element={<Navigate to="/" replace />} />
            )}

            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
