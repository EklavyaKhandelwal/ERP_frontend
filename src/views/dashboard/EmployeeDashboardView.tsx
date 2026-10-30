import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  ArrowRight, 
  Plus,
  CalendarDays,
  FileText,
  UserRound,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SectionSkeleton, SkeletonLine } from '../../components/feedback/LoadingSkeleton';
import { formatINR } from '../../lib/formatCurrency';
import { dashboardApi, type EmployeeDashboardSummary } from '../../lib/api';

function mondayOf(date: Date): string {
  const monday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): Date {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const EmployeeDashboardView: React.FC = () => {
  const { 
    currentUser, 
    setCurrentView, 
    setSelectedProjectId,
  } = useERP();

  const [now, setNow] = useState<Date | null>(null);
  const [dashboard, setDashboard] = useState<EmployeeDashboardSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(new Date()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    dashboardApi.getEmployeeSummary(dateKey(new Date()))
      .then(summary => {
        if (active) setDashboard(summary);
      })
      .catch(error => {
        if (active) setDashboardError(error instanceof Error ? error.message : 'Unable to load dashboard data.');
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });
    return () => { active = false; };
  }, []);

  const myProjects = dashboard?.projects.records ?? [];
  const currentWeekStart = now ? mondayOf(now) : null;
  const currentWeekEnd = currentWeekStart ? shiftDate(currentWeekStart, 6).toISOString().slice(0, 10) : null;
  const currentWeekLabel = currentWeekStart && currentWeekEnd
    ? `${formatDate(currentWeekStart)} – ${formatDate(currentWeekEnd)}`
    : '';
  const myCurrentTimesheet = dashboard?.timesheet ?? null;
  const latestPayslip = dashboard?.payslip ?? null;
  const greeting = !now || now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const todayLabel = now?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) ?? '';
  const leaveBalance = dashboard?.leaveBalance;
  const pendingLeaveCount = dashboard?.leaves.pendingCount ?? 0;
  const pendingLeave = dashboard?.leaves.pending ?? null;
  const upcomingLeave = dashboard?.leaves.upcoming ?? null;

  return (
    <div className="employee-dashboard-page" style={{ padding: '32px' }}>
      {/* Welcome Banner */}
      <div className="employee-dashboard-welcome" style={{
        background: 'linear-gradient(135deg, #0A0B0D 0%, #16181C 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2 }}>
          <div style={{ fontSize: '13px', color: '#8A8F98', fontWeight: '500' }}>
            {todayLabel}
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', letterSpacing: '-0.02em' }}>
            {greeting}, {currentUser.name.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: '14px', color: '#B5BAC2', marginTop: '6px', maxWidth: '520px' }}>
            {dashboardLoading
              ? <SkeletonLine width="260px" />
              : <>You are assigned to <strong>{dashboard?.projects.activeCount ?? 0} active {(dashboard?.projects.activeCount ?? 0) === 1 ? 'project' : 'projects'}</strong>.</>}
            {' '}
            {dashboardLoading
              ? <SkeletonLine width="210px" />
              : dashboardError
                ? 'Your payslip data is currently unavailable.'
                : latestPayslip
              ? `Your latest recorded payslip is ${latestPayslip.month} ${latestPayslip.year} (${latestPayslip.status}).`
              : 'No payslip has been recorded for you yet.'}
          </p>
        </div>

        <div className="employee-dashboard-welcome-actions" style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <button
            onClick={() => setCurrentView('my-profile')}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            <UserRound size={16} />
            <span>My Profile</span>
          </button>
          <button 
            onClick={() => setCurrentView('leaves')} 
            className="btn btn-primary"
            style={{ padding: '10px 18px' }}
          >
            <Plus size={16} />
            <span>Apply for Leave</span>
          </button>
          <button 
            onClick={() => setCurrentView('timesheets')} 
            className="btn btn-secondary"
            style={{ padding: '10px 18px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            <Clock size={16} />
            <span>Log Timesheet</span>
          </button>
        </div>
      </div>

      {/* Leave Balance Quotas */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Time-Off Allowances & Quota
          </h3>
          <button 
            onClick={() => setCurrentView('leaves')} 
            style={{ fontSize: '12.5px', color: '#0052FF', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}
          >
            Leave History & Rules →
          </button>
        </div>

        <div className="employee-leave-balance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Annual Leave */}
          <div className="card interactive-lift-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '4px solid #E5EDFF',
              borderTopColor: '#0052FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
              color: '#0052FF',
              flexShrink: 0
            }}>
              {dashboardLoading ? <SkeletonLine width="24px" height={18} /> : leaveBalance?.annual ?? '—'}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Annual Leave{leaveBalance?.year ? ` (${leaveBalance.year})` : ''}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {dashboardLoading ? <SkeletonLine width="155px" /> : leaveBalance ? `${leaveBalance.annual} remaining of ${leaveBalance.annualTotal} · ${Math.max(0, leaveBalance.annualTotal - leaveBalance.annual)} used${leaveBalance.annualPending ? ` · ${leaveBalance.annualPending} pending` : ''}` : 'Balance unavailable'}
              </div>
            </div>
          </div>

          {/* Sick Leave */}
          <div className="card interactive-lift-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '4px solid #E3F6EC',
              borderTopColor: '#05B169',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
              color: '#05B169',
              flexShrink: 0
            }}>
              {dashboardLoading ? <SkeletonLine width="24px" height={18} /> : leaveBalance?.sick ?? '—'}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Sick Leave{leaveBalance?.year ? ` (${leaveBalance.year})` : ''}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {dashboardLoading ? <SkeletonLine width="155px" /> : leaveBalance ? `${leaveBalance.sick} remaining of ${leaveBalance.sickTotal} · ${Math.max(0, leaveBalance.sickTotal - leaveBalance.sick)} used${leaveBalance.sickPending ? ` · ${leaveBalance.sickPending} pending` : ''}` : 'Balance unavailable'}
              </div>
            </div>
          </div>

          {/* Casual Leave */}
          <div className="card interactive-lift-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '4px solid #FEF6E0',
              borderTopColor: '#F4B000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
              color: '#B45309',
              flexShrink: 0
            }}>
              {dashboardLoading ? <SkeletonLine width="24px" height={18} /> : leaveBalance?.casual ?? '—'}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Casual / Personal{leaveBalance?.year ? ` (${leaveBalance.year})` : ''}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {dashboardLoading ? <SkeletonLine width="155px" /> : leaveBalance ? `${leaveBalance.casual} remaining of ${leaveBalance.casualTotal} · ${Math.max(0, leaveBalance.casualTotal - leaveBalance.casual)} used${leaveBalance.casualPending ? ` · ${leaveBalance.casualPending} pending` : ''}` : 'Balance unavailable'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="employee-dashboard-grid">
        <section className="card employee-dashboard-card">
          <div className="employee-dashboard-card-header">
            <h3>Current Week Timesheet</h3>
            {myCurrentTimesheet && (
              <span className={`badge ${
                myCurrentTimesheet.status === 'Approved' ? 'badge-success'
                  : myCurrentTimesheet.status === 'Rejected' ? 'badge-danger'
                    : myCurrentTimesheet.status === 'Draft' ? 'badge-neutral' : 'badge-warning'
              }`}>
                <span className="badge-dot" />
                {myCurrentTimesheet.status}
              </span>
            )}
          </div>
          {dashboardLoading || !now ? (
            <SectionSkeleton rows={2} />
          ) : dashboardError ? (
            <div role="alert" className="employee-dashboard-message error">Unable to load dashboard data: {dashboardError}</div>
          ) : (
            <>
              <div className="employee-dashboard-period">
                <span>This week</span>
                <strong>{currentWeekLabel}</strong>
                {myCurrentTimesheet && <strong>{myCurrentTimesheet.totalHours} hrs logged</strong>}
              </div>
              <p className="employee-dashboard-description">
                {!myCurrentTimesheet
                  ? 'You have not started this week’s report.'
                  : myCurrentTimesheet.status === 'Draft'
                    ? 'Your report is saved as a draft and still needs to be submitted.'
                    : myCurrentTimesheet.status === 'Rejected'
                      ? 'Your report was returned. Update it and submit it again.'
                      : `This week’s report is ${myCurrentTimesheet.status.toLowerCase()}.`}
              </p>
              <button
                type="button"
                onClick={() => setCurrentView('timesheets')}
                className="btn btn-outline-primary employee-dashboard-action"
              >
                <span>{!myCurrentTimesheet ? 'Start This Week’s Report' : myCurrentTimesheet.status === 'Draft' || myCurrentTimesheet.status === 'Rejected' ? 'Continue This Week’s Report' : 'View This Week’s Report'}</span>
                <ArrowRight size={15} />
              </button>
            </>
          )}
        </section>

        <section className="card employee-dashboard-card">
          <div className="employee-dashboard-card-header">
            <h3>My Leave</h3>
            <button type="button" className="employee-dashboard-text-link" onClick={() => setCurrentView('leaves')}>Leave history <ArrowRight size={14} /></button>
          </div>
          {dashboardLoading ? (
            <SectionSkeleton rows={2} />
          ) : dashboardError ? (
            <div role="alert" className="employee-dashboard-message error">Unable to load dashboard data: {dashboardError}</div>
          ) : (
            <div className="employee-dashboard-leave-content">
              {upcomingLeave ? (
                <div className="employee-dashboard-highlight">
                  <span className="employee-dashboard-eyebrow">NEXT APPROVED LEAVE</span>
                  <strong>{upcomingLeave.leaveType}</strong>
                  <span>{formatDate(upcomingLeave.startDate)} – {formatDate(upcomingLeave.endDate)}</span>
                </div>
              ) : (
                <div className="employee-dashboard-empty">No upcoming approved leave.</div>
              )}
              <div className="employee-dashboard-pending">
                <span className={`badge ${pendingLeaveCount ? 'badge-warning' : 'badge-neutral'}`}>
                  <span className="badge-dot" />
                  {pendingLeaveCount} pending {pendingLeaveCount === 1 ? 'request' : 'requests'}
                </span>
                {pendingLeave && <span>{pendingLeave.leaveType} · {formatDate(pendingLeave.startDate)}</span>}
              </div>
            </div>
          )}
          <button type="button" onClick={() => setCurrentView('leaves')} className="btn btn-outline-primary employee-dashboard-action">
            <CalendarDays size={15} />
            <span>View Leave Calendar</span>
          </button>
        </section>

        <section className="card employee-dashboard-card">
          <div className="employee-dashboard-card-header">
            <h3>Latest Payslip</h3>
          </div>
          {dashboardLoading ? (
            <SectionSkeleton rows={2} />
          ) : dashboardError ? (
            <div role="alert" className="employee-dashboard-message error">Unable to load dashboard data: {dashboardError}</div>
          ) : latestPayslip ? (
            <>
              <div className="employee-dashboard-payslip">
                <span className="employee-dashboard-eyebrow">{latestPayslip.month} {latestPayslip.year}</span>
                <strong>{formatINR(latestPayslip.netPay)}</strong>
                <span className={`badge ${latestPayslip.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  <span className="badge-dot" />
                  {latestPayslip.status}
                </span>
              </div>
              <button type="button" onClick={() => setCurrentView('payroll')} className="btn btn-outline-primary employee-dashboard-action">
                <FileText size={15} />
                <span>View Payslip Details</span>
                <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <div className="employee-dashboard-empty">No payslip has been recorded yet.</div>
          )}
        </section>

        <section className="card employee-dashboard-card">
          <div className="employee-dashboard-card-header">
            <h3>My Active Projects</h3>
            <button type="button" className="employee-dashboard-text-link" onClick={() => setCurrentView('projects')}>All projects <ArrowRight size={14} /></button>
          </div>
          {dashboardLoading ? (
            <SectionSkeleton rows={3} />
          ) : dashboardError ? (
            <div role="alert" className="employee-dashboard-message error">Unable to load dashboard data: {dashboardError}</div>
          ) : myProjects.length === 0 ? (
            <div className="employee-dashboard-empty">You have no active project assignments.</div>
          ) : (
            <div className="employee-dashboard-project-list">
              {myProjects.slice(0, 3).map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  className="employee-project-item"
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setCurrentView('project-detail');
                  }}
                >
                  <span className="employee-project-main">
                    <strong>{project.name}</strong>
                    <small>{project.code} · {project.progress}% complete</small>
                  </span>
                  <span className="employee-project-deadline">
                    <small>{index === 0 ? 'Nearest deadline' : 'Deadline'}</small>
                    <strong>{formatDate(project.deadline)}</strong>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
