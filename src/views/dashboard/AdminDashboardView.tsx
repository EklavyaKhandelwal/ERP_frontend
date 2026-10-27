import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Check, 
  X, 
  Briefcase, 
  Clock,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const AdminDashboardView: React.FC = () => {
  const { 
    employees, 
    employeesLoading,
    authError,
    leaves, 
    leavesLoading,
    leavesError,
    reviewLeave, 
    projects, 
    projectsLoading,
    projectsError,
    payroll,
    payrollLoading,
    payrollError,
    setCurrentView, 
    setFigmaOverlayAsset 
  } = useERP();

  const [dashboardState, setDashboardState] = useState<'default' | 'empty' | 'loading'>('default');

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress');
  const activeEmployees = employees.filter(employee => employee.status !== 'Inactive');
  const employeesUnavailable = employeesLoading || Boolean(authError);
  const projectProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length)
    : null;
  const latestPayrollPeriod = payroll.reduce<string | null>((latest, record) => {
    const period = `${record.year}-${String(new Date(`${record.month} 1, ${record.year}`).getMonth() + 1).padStart(2, '0')}`;
    return !latest || period > latest ? period : latest;
  }, null);
  const latestPayrollTotal = latestPayrollPeriod
    ? payroll.filter(record => {
      const period = `${record.year}-${String(new Date(`${record.month} 1, ${record.year}`).getMonth() + 1).padStart(2, '0')}`;
      return period === latestPayrollPeriod;
    }).reduce((total, record) => total + record.netPay, 0)
    : null;
  const formattedPayrollPeriod = latestPayrollPeriod
    ? new Date(`${latestPayrollPeriod}-01T00:00:00.000Z`).toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    : null;

  return (
    <div style={{ padding: '32px' }}>
      {/* Design State Switcher (Figma States) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        background: '#FFFFFF',
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#0052FF" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Figma View Variations:</span>
          <div style={{ display: 'flex', gap: '4px', background: '#F1F3F5', padding: '3px', borderRadius: '6px' }}>
            <button
              onClick={() => setDashboardState('default')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: dashboardState === 'default' ? '#0052FF' : 'transparent',
                color: dashboardState === 'default' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Default
            </button>
            <button
              onClick={() => setDashboardState('empty')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: dashboardState === 'empty' ? '#0052FF' : 'transparent',
                color: dashboardState === 'empty' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Empty State
            </button>
            <button
              onClick={() => setDashboardState('loading')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: dashboardState === 'loading' ? '#0052FF' : 'transparent',
                color: dashboardState === 'loading' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Loading Skeleton
            </button>
          </div>
        </div>

        <button
          onClick={() => setFigmaOverlayAsset(
            dashboardState === 'empty'
              ? '/design-assets/Admin/Admin Dashboard — Empty.svg'
              : dashboardState === 'loading'
              ? '/design-assets/Admin/Admin Dashboard — Loading.svg'
              : '/design-assets/Admin/Admin Dashboard — Default.svg'
          )}
          className="btn btn-sm btn-secondary"
        >
          Compare Figma Spec ↗
        </button>
      </div>

      {dashboardState === 'loading' ? (
        /* Loading skeleton state matching Figma Admin Dashboard — Loading.svg */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card" style={{ padding: '24px', height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '80px', height: '12px', backgroundColor: '#EEF0F3', borderRadius: '4px' }} />
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#E2E5EA', borderRadius: '8px' }} />
                </div>
                <div style={{ width: '100px', height: '32px', backgroundColor: '#E2E5EA', borderRadius: '6px' }} />
                <div style={{ width: '120px', height: '12px', backgroundColor: '#EEF0F3', borderRadius: '4px' }} />
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #E2E5EA', borderTopColor: '#0052FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ marginTop: '16px', fontWeight: '600', color: 'var(--text-main)' }}>Synchronizing enterprise workforce data...</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Querying personnel records and active cycles</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : dashboardState === 'empty' ? (
        /* Empty state matching Figma Admin Dashboard — Empty.svg */
        <div className="card" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#8A8F98' }}>
            <Users size={32} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A0B0D', margin: 0 }}>No Organization Data Found</h3>
          <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '8px', lineHeight: '1.5' }}>
            Add employees and projects to begin using your live organization dashboard.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button onClick={() => setCurrentView('employees')} className="btn btn-primary">
              <UserPlus size={16} />
              <span>Add First Employee</span>
            </button>
            <button onClick={() => setDashboardState('default')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Default state matching Figma Admin Dashboard — Default.svg */
        <div>
          {/* KPI Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {/* Metric 1 */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Total Employees</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E5EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0052FF' }}>
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.02em' }}>
                {employeesLoading ? '…' : authError ? '—' : employees.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12.5px', color: '#05B169' }}>
                <span style={{ fontWeight: '600' }}>{employeesUnavailable ? '—' : activeEmployees.length}</span>
                <span style={{ color: 'var(--text-muted)' }}>{authError ? 'Employee data unavailable' : 'active employees'}</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Active Projects</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E3F6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05B169' }}>
                  <Briefcase size={18} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.02em' }}>
                {projectsLoading ? '…' : projectsError ? '—' : activeProjects.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12.5px', color: '#05B169' }}>
                <span style={{ fontWeight: '600' }}>{projectsLoading ? '…' : projectsError || projectProgress === null ? '—' : `${projectProgress}%`}</span>
                <span style={{ color: 'var(--text-muted)' }}>average completion</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Pending Leaves</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF6E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                  <Calendar size={18} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.02em' }}>
                {leavesLoading ? '…' : leavesError ? '—' : pendingLeaves.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12.5px', color: '#B45309' }}>
                <Clock size={14} />
                <span style={{ fontWeight: '600' }}>{leavesLoading ? 'Loading requests' : leavesError ? 'Request data unavailable' : pendingLeaves.length ? 'Requires review' : 'No requests to review'}</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Latest Payroll Total</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E5EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0052FF' }}>
                  <CreditCard size={18} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.02em' }}>
                {payrollLoading ? '…' : payrollError || latestPayrollTotal === null ? '—' : `$${latestPayrollTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <span>{payrollLoading ? 'Loading payroll records' : payrollError ? 'Payroll data unavailable' : formattedPayrollPeriod ? `Pay period: ${formattedPayrollPeriod}` : 'No payroll runs recorded'}</span>
              </div>
            </div>
          </div>

          {/* Main Grid: Pending Approvals & Project Velocity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Pending Leave Requests */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                    Pending Leave Applications
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Employee time-off requests awaiting administrative action
                  </p>
                </div>
                <button 
                  onClick={() => setCurrentView('leaves')} 
                  style={{ fontSize: '12.5px', color: '#0052FF', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  View all ({leavesLoading ? '…' : leaves.length}) →
                </button>
              </div>

              {leavesError ? (
                <div role="alert" style={{ padding: '24px 0', textAlign: 'center', color: '#CF202F', fontSize: '13.5px' }}>
                  Unable to load leave requests: {leavesError}
                </div>
              ) : leavesLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Loading leave requests…
                </div>
              ) : pendingLeaves.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  ✓ No pending leave applications.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingLeaves.map(leave => (
                    <div 
                      key={leave.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#F8F9FB',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={leave.employeeAvatar} 
                          alt={leave.employeeName} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-main)' }}>
                            {leave.employeeName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: '500', color: '#0052FF' }}>{leave.leaveType}</span> • {leave.days} day{leave.days > 1 ? 's' : ''} ({leave.startDate} to {leave.endDate})
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            "{leave.reason}"
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => reviewLeave(leave.id, 'Approved', 'Approved via Admin Quick Actions')}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#E3F6EC', color: '#05B169', border: '1px solid #A3E6C5' }}
                          title="Approve leave"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => reviewLeave(leave.id, 'Rejected', 'Insufficient coverage')}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#FEECEE', color: '#CF202F', border: '1px solid #F7BAC0' }}
                          title="Reject leave"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Project Health / Budget Allocation */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Key Project Velocity
                </h3>
                <button 
                  onClick={() => setCurrentView('projects')} 
                  style={{ fontSize: '12.5px', color: '#0052FF', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  All Projects →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {projectsLoading ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading projects…</div>
                ) : projectsError ? (
                  <div role="alert" style={{ padding: '20px 0', textAlign: 'center', color: '#CF202F', fontSize: '13px' }}>Unable to load projects: {projectsError}</div>
                ) : activeProjects.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No active projects.</div>
                ) : activeProjects.slice(0, 3).map(proj => (
                  <div key={proj.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-main)' }}>{proj.name}</span>
                      <span className="badge badge-primary">{proj.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#EEF0F3', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${proj.progress}%`, height: '100%', backgroundColor: '#0052FF', borderRadius: '3px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      <span>Spent: ${proj.spent.toLocaleString()} / ${proj.budget.toLocaleString()}</span>
                      <span>Lead: {proj.leadName}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Panel */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Quick Administrative Actions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentView('employees')}
                    className="btn btn-sm btn-secondary"
                    style={{ justifyContent: 'flex-start', fontSize: '12px' }}
                  >
                    <UserPlus size={14} color="#0052FF" />
                    <span>+ Add Employee</span>
                  </button>
                  <button 
                    onClick={() => setCurrentView('payroll')}
                    className="btn btn-sm btn-secondary"
                    style={{ justifyContent: 'flex-start', fontSize: '12px' }}
                  >
                    <CreditCard size={14} color="#05B169" />
                    <span>Process Payroll</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
