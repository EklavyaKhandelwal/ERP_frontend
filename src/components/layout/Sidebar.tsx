import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Briefcase, 
  Clock, 
  Award, 
  LogOut, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AppView } from '../../types/erp';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentUser, role, logout, setFigmaOverlayAsset } = useERP();

  const menuItems: { id: AppView; label: string; icon: React.ReactNode; specAsset?: string }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard size={18} />, 
      specAsset: role === 'admin' ? '/design-assets/Admin/Admin Dashboard — Default.svg' : '/design-assets/Dashboard/Employee Dashboard — Default.svg' 
    },
    { 
      id: 'employees', 
      label: 'Employees', 
      icon: <Users size={18} />, 
      specAsset: '/design-assets/Employees/Employees — Directory.svg' 
    },
    { 
      id: 'leaves', 
      label: 'Leaves & Calendar', 
      icon: <Calendar size={18} />, 
      specAsset: role === 'admin' ? '/design-assets/Leaves/Leaves — Admin Dashboard.svg' : '/design-assets/Leaves/Employee — Leave Balance.svg' 
    },
    { 
      id: 'payroll', 
      label: 'Payroll', 
      icon: <CreditCard size={18} />, 
      specAsset: role === 'admin' ? '/design-assets/Payroll/Payroll — Overview.svg' : '/design-assets/Payroll/Employee — My Payslips.svg' 
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: <Briefcase size={18} />, 
      specAsset: '/design-assets/Projects/Projects — List.svg' 
    },
    { 
      id: 'timesheets', 
      label: 'Timesheets', 
      icon: <Clock size={18} />, 
      specAsset: role === 'admin' ? '/design-assets/Timesheets/Timesheets — Admin Approval.svg' : '/design-assets/Timesheets/Timesheets — Weekly View.svg' 
    },
    { 
      id: 'appraisals', 
      label: 'Appraisals', 
      icon: <Award size={18} />, 
      specAsset: '/design-assets/Appraisals/Appraisals — Overview.svg' 
    }
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
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
            <span style={{ fontSize: '10px', background: 'rgba(0, 82, 255, 0.25)', color: '#3880FF', padding: '1px 6px', borderRadius: '4px' }}>v2.0</span>
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
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.specAsset) setFigmaOverlayAsset(null);
                }}
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

        {/* Figma Spec Quick Action */}
        <div style={{ marginTop: '20px', padding: '0 8px' }}>
          <button
            onClick={() => {
              const current = menuItems.find(m => m.id === currentView);
              if (current?.specAsset) {
                setFigmaOverlayAsset(current.specAsset);
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'linear-gradient(135deg, rgba(0, 82, 255, 0.15) 0%, rgba(138, 56, 245, 0.15) 100%)',
              border: '1px solid rgba(0, 82, 255, 0.3)',
              borderRadius: '8px',
              color: '#9BB8FF',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={14} color="#0052FF" />
            <span>Compare Figma Spec</span>
          </button>
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
              {currentUser.name}
            </div>
            <div style={{ color: 'var(--dark-text-muted)', fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.designation}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
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
    </aside>
  );
};
