import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Search, 
  Bell, 
  CheckCircle2
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { AppView } from '../../types/erp';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  view: AppView;
  employeeId?: string;
  projectId?: string;
}

export const Header: React.FC = () => {
  const { 
    currentView, 
    currentUser, 
    role, 
    employees,
    leaves,
    timesheets,
    payroll,
    projects,
    appraisals,
    setCurrentView,
    setSelectedEmployeeId,
    setSelectedProjectId,
    notifications, 
    notificationError,
    markNotificationsRead
  } = useERP();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeSearchOnOutsideClick = (event: PointerEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('pointerdown', closeSearchOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeSearchOnOutsideClick);
  }, []);

  const unreadCount = notifications.filter(notification => !notification.readAt).length;
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (query.length < 2) return [];

    const results: SearchResult[] = [];
    const add = (result: SearchResult, searchableText: string) => {
      if (searchableText.toLocaleLowerCase().includes(query)) results.push(result);
    };

    for (const employee of employees) {
      add({
        id: `employee-${employee.id}`,
        title: `${employee.firstName} ${employee.lastName}`,
        description: `${employee.employeeCode} · ${employee.department} · ${employee.email}`,
        category: 'Employee',
        view: 'employee-profile',
        employeeId: employee.id,
      }, `${employee.firstName} ${employee.lastName} ${employee.employeeCode} ${employee.department} ${employee.designation} ${employee.email}`);
    }

    for (const project of projects) {
      add({
        id: `project-${project.id}`,
        title: project.name,
        description: `${project.code} · ${project.client} · ${project.status}`,
        category: 'Project',
        view: 'project-detail',
        projectId: project.id,
      }, `${project.name} ${project.code} ${project.client} ${project.status} ${project.description} ${project.tasks.map(task => `${task.title} ${task.description}`).join(' ')}`);
    }

    for (const leave of leaves) {
      add({
        id: `leave-${leave.id}`,
        title: `${leave.employeeName} · ${leave.leaveType}`,
        description: `${leave.status} · ${leave.startDate} to ${leave.endDate}`,
        category: 'Leave request',
        view: 'leaves',
      }, `${leave.employeeName} ${leave.leaveType} ${leave.status} ${leave.reason} ${leave.startDate} ${leave.endDate}`);
    }

    for (const timesheet of timesheets) {
      add({
        id: `timesheet-${timesheet.id}`,
        title: `${timesheet.employeeName} · Week of ${timesheet.weekStart}`,
        description: `${timesheet.status} · ${timesheet.totalHours} hours`,
        category: 'Timesheet',
        view: 'timesheets',
      }, `${timesheet.employeeName} ${timesheet.weekStart} ${timesheet.weekEnd} ${timesheet.status} ${timesheet.entries.map(entry => `${entry.projectName} ${entry.taskDescription}`).join(' ')}`);
    }

    for (const record of payroll) {
      add({
        id: `payroll-${record.id}`,
        title: `${record.employeeName} · ${record.month} ${record.year}`,
        description: `${record.employeeCode} · ${record.status}`,
        category: 'Payroll',
        view: 'payroll',
      }, `${record.employeeName} ${record.employeeCode} ${record.department} ${record.month} ${record.year} ${record.status}`);
    }

    for (const appraisal of appraisals) {
      add({
        id: `appraisal-${appraisal.id}`,
        title: `${appraisal.employeeName} · ${appraisal.cycle}`,
        description: `${appraisal.status} · ${appraisal.department}`,
        category: 'Appraisal',
        view: 'appraisals',
        employeeId: appraisal.employeeId,
      }, `${appraisal.employeeName} ${appraisal.cycle} ${appraisal.status} ${appraisal.department} ${appraisal.designation}`);
    }

    return results.slice(0, 10);
  }, [searchQuery, employees, projects, leaves, timesheets, payroll, appraisals]);

  const selectSearchResult = (result: SearchResult) => {
    if (result.employeeId) setSelectedEmployeeId(result.employeeId);
    if (result.projectId) setSelectedProjectId(result.projectId);
    setCurrentView(result.view);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    settings: {
      title: 'Settings',
      subtitle: 'Organization information, notification preferences, and workplace policies'
    },
    'my-profile': {
      title: 'My Profile',
      subtitle: 'View your account and employment information'
    },
    'dashboard': {
      title: role === 'admin' ? 'Executive Admin Dashboard' : 'My Workspace',
      subtitle: role === 'admin' ? 'Company health, workforce metrics, and pending actions' : 'Your day, leave balance, active projects, and timesheet'
    },
    'employees': {
      title: 'Employee Directory',
      subtitle: 'Manage organizational staff, roles, departments, and records'
    },
    'admin-access': {
      title: 'HR Admin Access',
      subtitle: 'Invite and manage individual HR administrator accounts'
    },
    'leaves': {
      title: role === 'admin' ? 'Leaves & Attendance Management' : 'My Leave Balances & Time Off',
      subtitle: role === 'admin' ? 'Review time off applications and team calendar' : 'Track accrued annual, sick, and casual allowances'
    },
    'payroll': {
      title: role === 'admin' ? 'Payroll Overview & Disbursements' : 'My Compensation & Payslips',
      subtitle: role === 'admin' ? 'Monthly salary calculation, tax withholdings, and processing' : 'Historical payslips, breakdown of allowances, and deductions'
    },
    'projects': {
      title: 'Projects & Resource Allocation',
      subtitle: 'Track team deliverables, budgets, deadlines, and milestone velocity'
    },
    'timesheets': {
      title: role === 'admin' ? 'Timesheet Approvals' : 'Weekly Timesheet Logger',
      subtitle: role === 'admin' ? 'Validate logged hours across projects before payroll cutoff' : 'Log billable hours against active client and internal initiatives'
    },
    'reports': {
      title: 'HR Reports',
      subtitle: 'Review and export daily work, weekly summaries, leave, and payroll records'
    },
    'appraisals': {
      title: 'Performance & Appraisals',
      subtitle: 'Quarterly review cycles, competency assessments, and career goals'
    },
    'resignation': {
      title: role === 'admin' ? 'Resignation Applications' : 'Resignation',
      subtitle: role === 'admin' ? 'Review employee resignation requests and track overdue applications' : 'Submit and track your resignation application'
    }
  };

  const currentMeta = viewTitles[currentView] || {
    title: 'Workspace',
    subtitle: 'AAVIL Integrated Management System'
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Title & Context */}
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
          {currentMeta.title}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Bar */}
        <div ref={searchContainerRef} style={{ position: 'relative', width: 'min(360px, 36vw)' }}>
          <form
            role="search"
            onSubmit={event => {
              event.preventDefault();
              setShowSearchResults(true);
              if (searchResults[0]) selectSearchResult(searchResults[0]);
            }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="search"
              aria-label="Search employees, projects, and records"
              aria-expanded={showSearchResults && searchQuery.trim().length >= 2}
              aria-controls="global-search-results"
              placeholder="Search employees, projects, and records..."
              value={searchQuery}
              onChange={event => {
                setSearchQuery(event.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={event => {
                if (event.key === 'Escape') setShowSearchResults(false);
              }}
              style={{
                width: '100%',
                padding: '8px 42px 8px 36px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-canvas)',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocusCapture={event => {
                event.currentTarget.style.borderColor = 'var(--primary)';
                event.currentTarget.style.backgroundColor = '#FFFFFF';
                event.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 82, 255, 0.1)';
              }}
              onBlur={event => {
                event.currentTarget.style.borderColor = 'var(--border-default)';
                event.currentTarget.style.backgroundColor = 'var(--bg-canvas)';
                event.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              aria-label="Search"
              title="Search"
              style={{
                position: 'absolute',
                right: '5px',
                width: '30px',
                height: '30px',
                border: 0,
                borderRadius: '6px',
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Search size={15} />
            </button>
          </form>
          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div
              id="global-search-results"
              role="listbox"
              aria-label="Search results"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(440px, 90vw)',
                maxHeight: 'min(480px, 70vh)',
                overflowY: 'auto',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-modal)',
                zIndex: 110,
              }}
            >
              {searchResults.length === 0 ? (
                <div style={{ padding: '18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No matching employees, projects, or records.
                </div>
              ) : searchResults.map(result => (
                <button
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => selectSearchResult(result)}
                  style={{
                    width: '100%',
                    display: 'block',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 0,
                    borderBottom: '1px solid var(--border-light)',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={event => { event.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={event => { event.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-main)', fontWeight: 600, fontSize: '13px' }}>
                    <span>{result.title}</span>
                    <span style={{ flexShrink: 0, color: 'var(--primary)', fontSize: '11px', fontWeight: 500 }}>{result.category}</span>
                  </span>
                  <span style={{ display: 'block', marginTop: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>{result.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotifications}
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '46px',
              width: '320px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
              zIndex: 100
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => void markNotificationsRead()}
                    style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notificationError && (
                <div role="alert" style={{ padding: '10px 16px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '12px' }}>
                  {notificationError}
                </div>
              )}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No notifications yet.
                  </div>
                ) : notifications.map(n => (
                  <div 
                    key={n.id} 
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: n.readAt ? '#FFFFFF' : '#FAFCFF',
                      display: 'flex',
                      gap: '10px'
                    }}
                  >
                    <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: n.readAt ? '400' : '600' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="header-account">
          <div className="header-account-avatar" aria-hidden="true">
            <span>{currentUser.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <img
              src={currentUser.avatar}
              alt=""
              onError={event => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <span className="header-account-name">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
};
