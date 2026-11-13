import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Briefcase, 
  Clock, 
  CalendarCheck,
  Award, 
  LogOut,
  UserRound,
  FileText,
  SlidersHorizontal,
  Handshake,
  Building2,
  Cpu,
  Activity,
  Target,
  BriefcaseBusiness,
  StickyNote,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AppView } from '../../types/erp';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentUser, logout, salesSection, setSalesSection } = useERP();
  const [isSalesExpanded, setIsSalesExpanded] = useState(currentView === 'sales');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const cancelLogoutButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showLogoutConfirmation) return;
    cancelLogoutButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoggingOut) setShowLogoutConfirmation(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirmation, isLoggingOut]);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirmation(false);
    }
  };

  const menuItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />
    },
    { 
      id: 'employees', 
      label: 'Employees',
      icon: <Users size={18} />
    },
    { 
      id: 'leaves', 
      label: 'Leaves & Calendar',
      icon: <Calendar size={18} />
    },
    { 
      id: 'payroll', 
      label: 'Payroll',
      icon: <CreditCard size={18} />
    },
    { 
      id: 'projects', 
      label: 'Projects',
      icon: <Briefcase size={18} />
    },
    { 
      id: 'timesheets', 
      label: 'Timesheets',
      icon: <Clock size={18} />
    },
    {
      id: 'attendance',
      label: currentUser.role === 'admin' ? 'Attendance' : 'My Attendance',
      icon: <CalendarCheck size={18} />,
    },
    ...(currentUser.role === 'admin' ? [{
      id: 'reports' as AppView,
      label: 'Reports',
      icon: <FileText size={18} />,
    }] : []),
    { 
      id: 'appraisals', 
      label: 'Appraisals',
      icon: <Award size={18} />
    },
    {
      id: 'resignation',
      label: 'Resignation',
      icon: <FileText size={18} />
    },
    ...(currentUser.role === 'admin' || currentUser.salesAccess ? [{
      id: 'sales' as AppView,
      label: 'Sales',
      icon: <Handshake size={18} />,
    }] : []),
  ];
  menuItems.push({ id: 'settings', label: 'Settings', icon: <SlidersHorizontal size={18} /> });
  menuItems.push({ id: 'my-profile', label: 'My Profile', icon: <UserRound size={18} /> });

  return (
    <aside className="app-sidebar" style={{
      width: '260px',
      height: '100dvh',
      backgroundColor: 'var(--dark-sidebar)',
      borderRight: '1px solid var(--dark-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--dark-border)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: '18px',
          boxShadow: '0 4px 12px rgba(0, 82, 255, 0.4)'
        }}>
          A
        </div>
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            AAVIL ERP
          </div>
          <div style={{ color: 'var(--dark-text-muted)', fontSize: '11px', fontWeight: '500' }}>Enterprise Suite</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5B616E', fontWeight: '600', padding: '8px 12px', letterSpacing: '0.05em' }}>
          Modules
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {menuItems.map(item => {
            const isActive = currentView === item.id;
            if (item.id === 'sales') {
              const sections = [
                { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
                { id: 'accounts' as const, label: 'Accounts', icon: <Building2 size={15} /> },
                { id: 'technology' as const, label: 'Technology', icon: <Cpu size={15} /> },
                { id: 'contacts' as const, label: 'Contacts', icon: <Users size={15} /> },
                { id: 'activities' as const, label: 'Activities', icon: <Activity size={15} /> },
                { id: 'leads' as const, label: 'Leads', icon: <Target size={15} /> },
                { id: 'opportunities' as const, label: 'Opportunities', icon: <BriefcaseBusiness size={15} /> },
                { id: 'notes' as const, label: 'Notes', icon: <StickyNote size={15} /> },
                ...(currentUser.role === 'admin' ? [{ id: 'updates' as const, label: 'Sales Updates', icon: <Activity size={15} /> }] : []),
              ];
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (isSalesExpanded) {
                        setIsSalesExpanded(false);
                        return;
                      }
                      setIsSalesExpanded(true);
                      if (!isActive) {
                        setSalesSection('dashboard');
                        setCurrentView('sales');
                      }
                    }}
                    aria-expanded={isSalesExpanded}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                      borderRadius: '8px', border: 'none', backgroundColor: isActive ? 'rgba(0, 82, 255, 0.12)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--dark-text-muted)', fontWeight: isActive ? '600' : '500',
                      fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span aria-hidden="true" style={{ fontSize: 11, transform: isSalesExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease' }}>›</span>
                  </button>
                  {isSalesExpanded && <div style={{ margin: '3px 0 8px 18px', paddingLeft: 9, borderLeft: '1px solid var(--dark-border)', display: 'grid', gap: 2 }}>
                    {sections.map(section => {
                      const selected = salesSection === section.id
                        || (section.id === 'accounts' && (salesSection === 'account-profile' || salesSection === 'account-information'));
                      return <button
                        key={section.id}
                        onClick={() => { setSalesSection(section.id); setCurrentView('sales'); setIsSalesExpanded(true); }}
                        aria-current={selected ? 'page' : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9, border: 0, borderRadius: 7,
                          padding: '8px 10px', textAlign: 'left', width: '100%', cursor: 'pointer',
                          color: selected ? '#FFFFFF' : 'var(--dark-text-muted)',
                          background: selected ? 'rgba(255,255,255,.09)' : 'transparent',
                          fontSize: 12.5, fontWeight: selected ? 600 : 500,
                        }}
                      ><span style={{ color: selected ? 'var(--primary)' : 'inherit' }}>{section.icon}</span>{section.label}</button>;
                    })}
                  </div>}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(0, 82, 255, 0.12)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--dark-text-muted)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--dark-text-muted)';
                  }
                }}
              >
                <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)'
                  }} />
                )}
              </button>
            );
          })}
        </div>

      </nav>

      {/* User Profile Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--dark-border)',
        backgroundColor: 'var(--dark-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.1)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.role === 'admin' ? 'HR' : currentUser.name}
            </div>
            <div style={{ color: 'var(--dark-text-muted)', fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.role === 'admin' ? 'Human Resources' : currentUser.designation}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirmation(true)}
          aria-label="Sign out"
          title="Sign out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--dark-text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.backgroundColor = 'rgba(207, 32, 47, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--dark-text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
      {showLogoutConfirmation && (
        createPortal(
          <div
            className="modal-overlay"
            role="presentation"
            onMouseDown={event => {
              if (event.target === event.currentTarget && !isLoggingOut) {
                setShowLogoutConfirmation(false);
              }
            }}
          >
            <section
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirmation-title"
              style={{ maxWidth: '420px', padding: '28px' }}
            >
              <h2 id="logout-confirmation-title" style={{ fontSize: '18px', margin: 0, color: 'var(--text-main)' }}>
                Sign out?
              </h2>
              <p style={{ margin: '10px 0 24px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to sign out of your account?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  ref={cancelLogoutButton}
                  type="button"
                  className="btn btn-secondary"
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isLoggingOut}
                  onClick={() => void confirmLogout()}
                >
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )
      )}
    </aside>
  );
};
