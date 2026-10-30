import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  CheckCircle2
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const Header: React.FC = () => {
  const { 
    currentView, 
    currentUser, 
    role, 
    notifications, 
    notificationError,
    markNotificationsRead
  } = useERP();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(notification => !notification.readAt).length;

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
        <div style={{
          position: 'relative',
          width: '280px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search employees, projects, tickets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-canvas)',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 82, 255, 0.1)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.backgroundColor = 'var(--bg-canvas)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
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
