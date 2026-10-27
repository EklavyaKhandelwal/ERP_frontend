import React from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FigmaCompareModal } from './components/modals/FigmaCompareModal';

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
import { AppraisalsView } from './views/appraisals/AppraisalsView';

const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthLoading, authError, currentView, role } = useERP();

  if (window.location.pathname === '/account/setup') {
    return <AccountSetupView />;
  }

  if (window.location.pathname === '/account/password-reset') {
    return <PasswordResetView />;
  }

  if (isAuthLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>Checking your session…</div>;
  }

  // Wait until the API has checked the session before showing the app.
  if (!isAuthenticated) {
    return currentView === 'forgot-password' ? <ForgotPasswordView /> : <LoginView />;
  }

  // Active Main View Router
  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return role === 'admin' ? <AdminDashboardView /> : <EmployeeDashboardView />;
      case 'employees':
        return <EmployeesView />;
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
      case 'appraisals':
        return <AppraisalsView />;
      default:
        return role === 'admin' ? <AdminDashboardView /> : <EmployeeDashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-canvas)' }}>
        <Header />
        {authError && (
          <div role="alert" style={{ padding: '12px 24px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
            {authError}
          </div>
        )}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderMainView()}
        </main>
      </div>

      {/* Global Figma Spec Comparison Modal */}
      <FigmaCompareModal />
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
