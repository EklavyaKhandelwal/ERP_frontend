import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Users,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LeaveApprovalModal } from '../../components/modals/LeaveApprovalModal';
import { SectionSkeleton, SkeletonLine } from '../../components/feedback/LoadingSkeleton';
import { formatINR } from '../../lib/formatCurrency';
import { dashboardApi, type AdminDashboardSummary } from '../../lib/api';
import type { LeaveRequest } from '../../types/erp';

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const AdminDashboardView: React.FC = () => {
  const { setCurrentView } = useERP();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void dashboardApi.getSummary(dateKey(new Date()))
      .then(result => {
        if (!active) return;
        setSummary(result);
        setSummaryError(null);
      })
      .catch((error: unknown) => {
        if (active) setSummaryError(error instanceof Error ? error.message : 'Unable to load dashboard data.');
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const refreshSummary = () => {
    setSummaryLoading(true);
    setRefreshKey(key => key + 1);
  };

  const pendingLeaves = summary?.leaves.pending ?? [];
  const pendingTimesheets = summary?.timesheets.pending ?? [];
  const upcomingLeaves = summary?.leaves.upcoming ?? [];
  const departmentHeadcounts = summary?.employees.departments ?? [];
  const largestDepartment = departmentHeadcounts[0]?.count ?? 0;
  const isEmptyWorkspace = !summaryLoading && !summaryError && summary?.employees.total === 0;
  const latestPayrollPeriod = summary?.payroll.period ?? null;
  const latestPayrollTotal = summary?.payroll.netPay ?? null;
  const formattedPayrollPeriod = latestPayrollPeriod
    ? new Date(`${latestPayrollPeriod}-01T00:00:00.000Z`).toLocaleString('en', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    : null;

  const metricCard = (
    title: string,
    value: React.ReactNode,
    detail: React.ReactNode,
    icon: React.ReactNode,
    tone: 'blue' | 'green' | 'amber',
    view: 'employees' | 'projects' | 'leaves' | 'timesheets' | 'payroll',
  ) => (
    <button
      type="button"
      className="card admin-dashboard-metric"
      onClick={() => setCurrentView(view)}
    >
      <span className="admin-dashboard-metric-top">
        <span className="admin-dashboard-metric-title">{title}</span>
        <span className={`admin-dashboard-metric-icon ${tone}`}>{icon}</span>
      </span>
      <span className="admin-dashboard-metric-value">{value}</span>
      <span className="admin-dashboard-metric-detail">{detail}</span>
      <span className="admin-dashboard-metric-link">View details <ArrowRight size={13} /></span>
    </button>
  );

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-heading">
        <h2>HR & Administration Dashboard</h2>
        <p>Workforce overview and actions that need your attention.</p>
      </div>

      <div className="admin-dashboard-metrics">
        {metricCard(
          'Employees',
          summaryLoading ? <SkeletonLine width="44px" height={24} /> : summaryError ? '—' : summary?.employees.total ?? 0,
          summaryError ? 'Employee data unavailable' : `${summary?.employees.active ?? 0} active`,
          <Users size={18} />,
          'blue',
          'employees',
        )}
        {metricCard(
          'Active Projects',
          summaryLoading ? <SkeletonLine width="44px" height={24} /> : summaryError ? '—' : summary?.projects.active ?? 0,
          summaryError ? 'Project data unavailable' : summary?.projects.averageProgress === null ? 'No active projects' : `${summary?.projects.averageProgress ?? 0}% average completion`,
          <Briefcase size={18} />,
          'green',
          'projects',
        )}
        {metricCard(
          'Leave Requests to Review',
          summaryLoading ? <SkeletonLine width="44px" height={24} /> : summaryError ? '—' : summary?.leaves.pendingCount ?? 0,
          summaryError ? 'Leave data unavailable' : (summary?.leaves.pendingCount ?? 0) ? 'Requires review' : 'Nothing awaiting review',
          <Calendar size={18} />,
          'amber',
          'leaves',
        )}
        {metricCard(
          'Timesheets to Review',
          summaryLoading ? <SkeletonLine width="44px" height={24} /> : summaryError ? '—' : summary?.timesheets.pendingCount ?? 0,
          summaryError ? 'Timesheet data unavailable' : (summary?.timesheets.pendingCount ?? 0) ? 'Submitted for approval' : 'Nothing awaiting review',
          <Clock size={18} />,
          'amber',
          'timesheets',
        )}
        {metricCard(
          'Latest Period Net Pay',
          summaryLoading ? <SkeletonLine width="92px" height={24} /> : summaryError || latestPayrollTotal === null ? '—' : formatINR(latestPayrollTotal),
          summaryError ? 'Payroll data unavailable' : formattedPayrollPeriod ? `${formattedPayrollPeriod} · recorded, not payment confirmation` : 'No payroll run recorded',
          <CreditCard size={18} />,
          'blue',
          'payroll',
        )}
      </div>

      {isEmptyWorkspace ? (
        <section className="card dashboard-empty-state">
          <svg
            className="dashboard-empty-illustration"
            viewBox="0 0 160 140"
            role="img"
            aria-label="Add your first employee"
          >
            <circle cx="80" cy="72" r="58" fill="#F1F3F6" />
            <rect x="39" y="24" width="82" height="66" rx="13" fill="#FFFFFF" stroke="#E3E7ED" strokeWidth="2" />
            <rect x="31" y="35" width="82" height="66" rx="13" fill="#FFFFFF" stroke="#E3E7ED" strokeWidth="2" />
            <rect x="23" y="47" width="92" height="68" rx="14" fill="#FFFFFF" stroke="#DCE2EA" strokeWidth="2" />
            <circle cx="51" cy="76" r="13" fill="#E5EDFF" />
            <circle cx="51" cy="73" r="5" fill="#0757FF" />
            <path d="M41 84c2-6 6-8 10-8s8 2 10 8" fill="#0757FF" />
            <rect x="74" y="64" width="39" height="7" rx="3.5" fill="#22252B" />
            <rect x="74" y="77" width="29" height="6" rx="3" fill="#8A8F98" />
            <rect x="74" y="91" width="28" height="10" rx="5" fill="#E3F6EC" />
            <rect x="81" y="95" width="14" height="3" rx="1.5" fill="#05B169" />
            <circle cx="120" cy="43" r="17" fill="#0757FF" />
            <path d="M120 35v16M112 43h16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <h2>Welcome to AAVIL</h2>
          <p>Get started by adding your first employees and setting up departments.</p>
          <button onClick={() => setCurrentView('employees')} className="btn btn-primary">
            Add First Employee
          </button>
        </section>
      ) : (
        <div className="admin-dashboard-work-queues">
          <section className="card admin-dashboard-queue">
            <div className="admin-dashboard-section-heading">
              <div>
                <h3>Leave Applications to Review</h3>
                <p>Review requests and provide a decision note where needed.</p>
              </div>
              <button type="button" className="admin-dashboard-text-link" onClick={() => setCurrentView('leaves')}>
                View all ({summaryLoading ? '…' : summaryError ? '—' : summary?.leaves.pendingCount ?? 0}) <ArrowRight size={14} />
              </button>
            </div>
            {summaryError ? (
              <div role="alert" className="admin-dashboard-error">Unable to load dashboard data: {summaryError}</div>
            ) : summaryLoading ? (
              <SectionSkeleton rows={3} />
            ) : pendingLeaves.length === 0 ? (
              <div className="admin-dashboard-empty"><Check size={16} /> No pending leave applications.</div>
            ) : (
              <div className="admin-dashboard-list">
                {pendingLeaves.slice(0, 5).map(leave => (
                  <article className="admin-dashboard-list-item" key={leave.id}>
                    <img src={leave.employeeAvatar} alt="" />
                    <div className="admin-dashboard-list-content">
                      <strong>{leave.employeeName}</strong>
                      <span>{leave.leaveType} · {leave.days} day{leave.days === 1 ? '' : 's'} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)}</span>
                      <small>{leave.reason}</small>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedLeave(leave)}>
                      Review
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card admin-dashboard-queue">
            <div className="admin-dashboard-section-heading">
              <div>
                <h3>Timesheets to Review</h3>
                <p>Submitted weekly work reports waiting for HR review.</p>
              </div>
              <button type="button" className="admin-dashboard-text-link" onClick={() => setCurrentView('timesheets')}>
                View all ({summaryLoading ? '…' : summaryError ? '—' : summary?.timesheets.pendingCount ?? 0}) <ArrowRight size={14} />
              </button>
            </div>
            {summaryError ? (
              <div role="alert" className="admin-dashboard-error">Unable to load dashboard data: {summaryError}</div>
            ) : summaryLoading ? (
              <SectionSkeleton rows={3} />
            ) : pendingTimesheets.length === 0 ? (
              <div className="admin-dashboard-empty"><Check size={16} /> No timesheets awaiting review.</div>
            ) : (
              <div className="admin-dashboard-list">
                {pendingTimesheets.slice(0, 5).map(timesheet => (
                  <article className="admin-dashboard-list-item" key={timesheet.id}>
                    <img src={timesheet.employeeAvatar} alt="" />
                    <div className="admin-dashboard-list-content">
                      <strong>{timesheet.employeeName}</strong>
                      <span>{timesheet.department} · Week of {formatDate(timesheet.weekStart)} · {timesheet.totalHours} hrs</span>
                      <small>{timesheet.workCompleted || 'No weekly summary provided.'}</small>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentView('timesheets')}>
                      Open
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card admin-dashboard-queue">
            <div className="admin-dashboard-section-heading">
              <div>
                <h3>Upcoming Approved Leave</h3>
                <p>Approved time off that may affect team coverage.</p>
              </div>
              <button type="button" className="admin-dashboard-text-link" onClick={() => setCurrentView('leaves')}>
                Leave calendar <ArrowRight size={14} />
              </button>
            </div>
            {summaryError ? (
              <div role="alert" className="admin-dashboard-error">Unable to load dashboard data: {summaryError}</div>
            ) : summaryLoading ? (
              <SectionSkeleton rows={2} />
            ) : upcomingLeaves.length === 0 ? (
              <div className="admin-dashboard-empty">No upcoming approved leave.</div>
            ) : (
              <div className="admin-dashboard-list">
                {upcomingLeaves.slice(0, 5).map(leave => (
                  <div className="admin-dashboard-list-item" key={leave.id}>
                    <img src={leave.employeeAvatar} alt="" />
                    <div className="admin-dashboard-list-content">
                      <strong>{leave.employeeName}</strong>
                      <span>{leave.leaveType} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)}</span>
                    </div>
                    <span className="badge badge-success">{leave.days} days</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card admin-dashboard-queue">
            <div className="admin-dashboard-section-heading">
              <div>
                <h3>Workforce by Department</h3>
                <p>Current employees across your departments.</p>
              </div>
            </div>
            {summaryError ? (
              <div role="alert" className="admin-dashboard-error">Unable to load dashboard data: {summaryError}</div>
            ) : summaryLoading ? (
              <SectionSkeleton rows={4} />
            ) : departmentHeadcounts.length === 0 ? (
              <div className="admin-dashboard-empty">No current employees to show.</div>
            ) : (
              <div className="admin-dashboard-departments">
                {departmentHeadcounts.map(({ department, count }) => (
                  <div className="admin-dashboard-department" key={department}>
                    <span className="admin-dashboard-department-name" title={department}>{department}</span>
                    <div
                      className="admin-dashboard-department-track"
                      role="img"
                      aria-label={`${department}: ${count} ${count === 1 ? 'employee' : 'employees'}`}
                    >
                      <span
                        className="admin-dashboard-department-bar"
                        style={{ width: `${(count / largestDepartment) * 100}%` }}
                      />
                    </div>
                    <span className="admin-dashboard-department-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <LeaveApprovalModal
        key={selectedLeave?.id ?? 'closed'}
        leave={selectedLeave}
        onClose={() => setSelectedLeave(null)}
        onReviewed={refreshSummary}
      />
    </div>
  );
};
