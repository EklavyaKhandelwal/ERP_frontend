import React from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Auth Views
import { LoginView } from './views/auth/LoginView';
import { AccountSetupView } from './views/auth/AccountSetupView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { PasswordResetView } from './views/auth/PasswordResetView';

// App Views
import { AdminDashboardView } from './views/dashboard/AdminDashboardView';
import { EmployeeDashboardView } from './views/dashboard/EmployeeDashboardView';
import { EmployeesView } from './views/employees/EmployeesView';
import { EmployeeProfileView } from './views/employees/EmployeeProfileView';
import { LeavesView } from './views/leaves/LeavesView';
import { PayrollView } from './views/payroll/PayrollView';
import { ProjectsView } from './views/projects/ProjectsView';
import { ProjectDetailView } from './views/projects/ProjectDetailView';
import { TimesheetsView } from './views/timesheets/TimesheetsView';
import { ReportsView } from './views/reports/ReportsView';
import { AppraisalsView } from './views/appraisals/AppraisalsView';
import { AdminAccessView } from './views/admin/AdminAccessView';
import { MyProfileView } from './views/profile/MyProfileView';
import { ResignationView } from './views/resignation/ResignationView';
import { SettingsView } from './views/settings/SettingsView';
import { AppLoadingSkeleton } from './components/feedback/LoadingSkeleton';

const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthLoading, authError, currentView, role, currentUser } = useERP();

  if (window.location.pathname === '/account/setup' || window.location.pathname === '/account/admin-setup') {
    return <AccountSetupView adminInvite={window.location.pathname === '/account/admin-setup'} />;
  }

  if (window.location.pathname === '/account/password-reset') {
    return <PasswordResetView />;
  }

  if (isAuthLoading) {
    return <AppLoadingSkeleton />;
  }

  // Wait until the API has checked the session before showing the app.
  if (!isAuthenticated) {
    return currentView === 'forgot-password' ? <ForgotPasswordView /> : <LoginView />;
  }

  if (role === 'employee' && !currentUser.onboardingComplete) {
    return <AccountSetupView employeeOnboarding />;
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
      case 'admin-access':
        return currentUser.isOwner ? <AdminAccessView /> : <AdminDashboardView />;
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
      case 'reports':
        return role === 'admin' ? <ReportsView /> : <EmployeeDashboardView />;
      case 'appraisals':
        return <AppraisalsView />;
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
          {renderMainView()}
        </main>
      </div>
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
