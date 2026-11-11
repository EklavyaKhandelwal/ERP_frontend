import React, { lazy, Suspense, useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AppLoadingSkeleton, SectionSkeleton } from './components/feedback/LoadingSkeleton';

const LoginView = lazy(() => import('./views/auth/LoginView').then(module => ({ default: module.LoginView })));
const AccountSetupView = lazy(() => import('./views/auth/AccountSetupView').then(module => ({ default: module.AccountSetupView })));
const ForgotPasswordView = lazy(() => import('./views/auth/ForgotPasswordView').then(module => ({ default: module.ForgotPasswordView })));
const PasswordResetView = lazy(() => import('./views/auth/PasswordResetView').then(module => ({ default: module.PasswordResetView })));
const AdminDashboardView = lazy(() => import('./views/dashboard/AdminDashboardView').then(module => ({ default: module.AdminDashboardView })));
const EmployeeDashboardView = lazy(() => import('./views/dashboard/EmployeeDashboardView').then(module => ({ default: module.EmployeeDashboardView })));
const EmployeesView = lazy(() => import('./views/employees/EmployeesView').then(module => ({ default: module.EmployeesView })));
const EmployeeProfileView = lazy(() => import('./views/employees/EmployeeProfileView').then(module => ({ default: module.EmployeeProfileView })));
const LeavesView = lazy(() => import('./views/leaves/LeavesView').then(module => ({ default: module.LeavesView })));
const PayrollView = lazy(() => import('./views/payroll/PayrollView').then(module => ({ default: module.PayrollView })));
const ProjectsView = lazy(() => import('./views/projects/ProjectsView').then(module => ({ default: module.ProjectsView })));
const ProjectDetailView = lazy(() => import('./views/projects/ProjectDetailView').then(module => ({ default: module.ProjectDetailView })));
const TimesheetsView = lazy(() => import('./views/timesheets/TimesheetsView').then(module => ({ default: module.TimesheetsView })));
const AttendanceView = lazy(() => import('./views/attendance/AttendanceView').then(module => ({ default: module.AttendanceView })));
const ReportsView = lazy(() => import('./views/reports/ReportsView').then(module => ({ default: module.ReportsView })));
const AppraisalsView = lazy(() => import('./views/appraisals/AppraisalsView').then(module => ({ default: module.AppraisalsView })));
const MyProfileView = lazy(() => import('./views/profile/MyProfileView').then(module => ({ default: module.MyProfileView })));
const ResignationView = lazy(() => import('./views/resignation/ResignationView').then(module => ({ default: module.ResignationView })));
const SettingsView = lazy(() => import('./views/settings/SettingsView').then(module => ({ default: module.SettingsView })));
const SalesView = lazy(() => import('./views/sales/SalesView').then(module => ({ default: module.SalesView })));

interface MutationFeedbackEvent {
  id: number;
  phase: 'saving' | 'success' | 'finished';
  title: string;
  message?: string;
}

interface SuccessFeedback {
  title: string;
  message: string;
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthLoading, authError, currentView, role, currentUser } = useERP();
  const [pendingMutations, setPendingMutations] = useState<Map<number, string>>(() => new Map());
  const [successFeedback, setSuccessFeedback] = useState<SuccessFeedback | null>(null);

  useEffect(() => {
    const handleMutationFeedback = (event: Event) => {
      const { id, phase, title, message } = (event as CustomEvent<MutationFeedbackEvent>).detail;
      if (phase === 'saving') {
        setPendingMutations(previous => new Map(previous).set(id, message ?? title));
        return;
      }

      setPendingMutations(previous => {
        const next = new Map(previous);
        next.delete(id);
        return next;
      });
      if (phase === 'success') setSuccessFeedback({ title, message: message ?? '' });
    };

    window.addEventListener('app:mutation-feedback', handleMutationFeedback);
    return () => window.removeEventListener('app:mutation-feedback', handleMutationFeedback);
  }, []);

  useEffect(() => {
    if (!successFeedback) return;
    const timeoutId = window.setTimeout(() => setSuccessFeedback(null), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [successFeedback]);

  if (window.location.pathname === '/account/setup') {
    return (
      <Suspense fallback={<AppLoadingSkeleton />}>
        <AccountSetupView />
      </Suspense>
    );
  }

  if (window.location.pathname === '/account/password-reset') {
    return <Suspense fallback={<AppLoadingSkeleton />}><PasswordResetView /></Suspense>;
  }

  if (isAuthLoading) {
    return <AppLoadingSkeleton />;
  }

  // Wait until the API has checked the session before showing the app.
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<AppLoadingSkeleton />}>
        {currentView === 'forgot-password' ? <ForgotPasswordView /> : <LoginView />}
      </Suspense>
    );
  }

  if (role === 'employee' && !currentUser.onboardingComplete) {
    return <Suspense fallback={<AppLoadingSkeleton />}><AccountSetupView employeeOnboarding /></Suspense>;
  }

  // Active Main View Router
  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return role === 'admin' ? <AdminDashboardView /> : <EmployeeDashboardView />;
      case 'employees':
        return <EmployeesView />;
      case 'my-profile':
        return <MyProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'resignation':
        return <ResignationView />;
      case 'employee-profile':
        return <EmployeeProfileView />;
      case 'leaves':
        return <LeavesView />;
      case 'payroll':
        return <PayrollView />;
      case 'projects':
        return <ProjectsView />;
      case 'project-detail':
        return <ProjectDetailView />;
      case 'timesheets':
        return <TimesheetsView />;
      case 'attendance':
        return <AttendanceView />;
      case 'reports':
        return role === 'admin' ? <ReportsView /> : <EmployeeDashboardView />;
      case 'appraisals':
        return <AppraisalsView />;
      case 'sales':
        return role === 'admin' || currentUser.salesAccess ? <SalesView /> : <EmployeeDashboardView />;
      default:
        return role === 'admin' ? <AdminDashboardView /> : <EmployeeDashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, backgroundColor: 'var(--bg-canvas)' }}>
        <Header />
        {authError && (
          <div role="alert" style={{ padding: '12px 24px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
            {authError}
          </div>
        )}
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehaviorY: 'contain' }}>
          <Suspense fallback={<SectionSkeleton rows={8} />}>
            {renderMainView()}
          </Suspense>
        </main>
      </div>
      {(successFeedback || pendingMutations.size > 0) && (
        <div className="mutation-feedback-toast" aria-live="polite">
          {successFeedback ? (
            <section className="mutation-feedback-card" role="status" aria-labelledby="mutation-feedback-title">
              <button
                type="button"
                className="mutation-feedback-close"
                aria-label="Dismiss confirmation"
                onClick={() => setSuccessFeedback(null)}
              >
                <X size={18} />
              </button>
              <div className="mutation-feedback-icon"><CheckCircle2 size={34} aria-hidden="true" /></div>
              <h2 id="mutation-feedback-title">{successFeedback.title}</h2>
              <p>{successFeedback.message}</p>
            </section>
          ) : (
            <section className="mutation-feedback-card" role="status" aria-busy="true">
              <div className="mutation-feedback-icon is-saving"><LoaderCircle size={34} aria-hidden="true" /></div>
              <h2>Saving changes</h2>
              <p>{pendingMutations.values().next().value ?? 'Please wait while your changes are saved.'}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
};

export default App;
