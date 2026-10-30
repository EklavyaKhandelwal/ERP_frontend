import React, { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LeaveRequest } from '../../types/erp';
import { ApplyLeaveModal } from '../../components/modals/ApplyLeaveModal';
import { LeaveApprovalModal } from '../../components/modals/LeaveApprovalModal';
import { TableSkeletonRows } from '../../components/feedback/LoadingSkeleton';

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const currentDate = new Date();
const today = dateKey(currentDate);
const upcomingBoundary = dateKey(new Date(currentDate.getTime() + 30 * 86_400_000));

export const LeavesView: React.FC = () => {
  const { 
    leaves, 
    leavesLoading,
    leavesError,
    leaveBalance,
    role,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [activeView, setActiveView] = useState<'Calendar' | 'Requests'>('Calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedReviewLeave, setSelectedReviewLeave] = useState<LeaveRequest | null>(null);

  const displayedLeaves = leaves.filter(l => {
    if (activeTab === 'All') return true;
    return l.status === activeTab;
  });
  const calendarDays = useMemo(() => {
    const firstOfMonth = calendarMonth;
    const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
    const firstVisibleDate = new Date(Date.UTC(
      firstOfMonth.getUTCFullYear(),
      firstOfMonth.getUTCMonth(),
      1 - mondayOffset,
    ));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisibleDate);
      date.setUTCDate(firstVisibleDate.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }, [calendarMonth]);
  const monthLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(calendarMonth);
  const calendarLeaves = leaves.filter(leave => leave.status !== 'Rejected');
  const pendingCount = leaves.filter(leave => leave.status === 'Pending').length;
  const onLeaveToday = new Set(calendarLeaves
    .filter(leave => leave.status === 'Approved' && leave.startDate <= today && leave.endDate >= today)
    .map(leave => leave.employeeId)).size;
  const upcomingCount = calendarLeaves.filter(leave =>
    leave.status === 'Approved' && leave.startDate > today
    && leave.startDate <= upcomingBoundary,
  ).length;

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Approved':
        return <span className="badge badge-success"><span className="badge-dot" />Approved</span>;
      case 'Pending':
        return <span className="badge badge-warning"><span className="badge-dot" />Pending Review</span>;
      case 'Rejected':
        return <span className="badge badge-danger"><span className="badge-dot" />Rejected</span>;
    }
  };

  return (
    <div className="leaves-page" style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              {role === 'admin' ? 'Time-Off Administration & Approvals' : 'My Leave Allowances & History'}
            </h2>
            <span className="badge badge-neutral">{leaves.length} Total Requests</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {role === 'admin' 
              ? 'Review, approve, or reject employee annual, medical, and personal leave applications.' 
              : 'Track accrued time-off balances and submit vacation requests.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      <div className="leaves-summary-grid">
        {role === 'admin' ? (
          <>
            <div className="card interactive-lift-card leaves-summary-card">
              <span className="leaves-summary-label">PENDING REVIEW</span>
              <div className="leaves-summary-value" style={{ color: '#B45309' }}>{pendingCount}</div>
              <div className="leaves-summary-caption">Requests awaiting a decision</div>
            </div>
            <div className="card interactive-lift-card leaves-summary-card">
              <span className="leaves-summary-label">ON LEAVE TODAY</span>
              <div className="leaves-summary-value" style={{ color: '#0052FF' }}>{onLeaveToday}</div>
              <div className="leaves-summary-caption">Employees with approved leave</div>
            </div>
            <div className="card interactive-lift-card leaves-summary-card">
              <span className="leaves-summary-label">UPCOMING (30 DAYS)</span>
              <div className="leaves-summary-value" style={{ color: '#05B169' }}>{upcomingCount}</div>
              <div className="leaves-summary-caption">Approved requests starting soon</div>
            </div>
            <div className="card interactive-lift-card leaves-summary-card">
              <span className="leaves-summary-label">TOTAL REQUESTS</span>
              <div className="leaves-summary-value">{leaves.length}</div>
              <div className="leaves-summary-caption">Across all request statuses</div>
            </div>
          </>
        ) : (
          <>
        <div className="card interactive-lift-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>ANNUAL LEAVE {leaveBalance?.year ? `(${leaveBalance.year})` : ''}</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0052FF', marginTop: '4px' }}>
            {leaveBalance ? `${leaveBalance.annual} / ${leaveBalance.annualTotal}` : '— / —'} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>days · {leaveBalance ? `${Math.max(0, leaveBalance.annualTotal - leaveBalance.annual)} used` : ''}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {leaveBalance?.annualPending ? `${leaveBalance.annualPending} days pending approval` : `Calendar-year balance${leaveBalance?.year ? ` · ${leaveBalance.year}` : ''}`}
          </div>
        </div>

        <div className="card interactive-lift-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>SICK / MEDICAL</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#05B169', marginTop: '4px' }}>
            {leaveBalance ? `${leaveBalance.sick} / ${leaveBalance.sickTotal}` : '— / —'} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>days · {leaveBalance ? `${Math.max(0, leaveBalance.sickTotal - leaveBalance.sick)} used` : ''}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {leaveBalance?.sickPending ? `${leaveBalance.sickPending} days pending approval` : `Calendar-year balance${leaveBalance?.year ? ` · ${leaveBalance.year}` : ''}`}
          </div>
        </div>

        <div className="card interactive-lift-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>CASUAL / PERSONAL</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#F4B000', marginTop: '4px' }}>
            {leaveBalance ? `${leaveBalance.casual} / ${leaveBalance.casualTotal}` : '— / —'} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>days · {leaveBalance ? `${Math.max(0, leaveBalance.casualTotal - leaveBalance.casual)} used` : ''}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {leaveBalance?.casualPending ? `${leaveBalance.casualPending} days pending approval` : `Calendar-year balance${leaveBalance?.year ? ` · ${leaveBalance.year}` : ''}`}
          </div>
        </div>

        <div className="card interactive-lift-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>PENDING DECISIONS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>
            {leaves.filter(l => l.status === 'Pending').length} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>awaiting</span>
          </div>
          <div style={{ fontSize: '12px', color: '#B45309', marginTop: '4px' }}>Awaiting administrator review</div>
        </div>
          </>
        )}
      </div>

      <div className="leaves-view-tabs" role="tablist" aria-label="Leave views">
        {(['Calendar', 'Requests'] as const).map(view => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={`leaves-view-tab ${activeView === view ? 'active' : ''}`}
            onClick={() => setActiveView(view)}
          >
            {view === 'Calendar' && <CalendarDays size={16} />}
            {view}
          </button>
        ))}
      </div>

      {leavesError && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {leavesError}
        </div>
      )}
      {activeView === 'Calendar' ? (
        <section className="card leaves-calendar" aria-label={`${monthLabel} leave calendar`}>
          <div className="leaves-calendar-header">
            <div>
              <h3>{monthLabel}</h3>
              <p>{role === 'admin' ? 'Approved and pending team leave' : 'Your approved and pending leave'}</p>
            </div>
            <div className="leaves-calendar-controls">
              <button type="button" className="btn btn-secondary btn-sm" aria-label="Previous month" onClick={() => setCalendarMonth(month => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                const now = new Date();
                setCalendarMonth(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
              }}>Today</button>
              <button type="button" className="btn btn-secondary btn-sm" aria-label="Next month" onClick={() => setCalendarMonth(month => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="leaves-calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div className="leaves-calendar-weekday" key={day}>{day}</div>
            ))}
            {calendarDays.map(date => {
              const dateObject = new Date(`${date}T00:00:00.000Z`);
              const isCurrentMonth = dateObject.getUTCMonth() === calendarMonth.getUTCMonth();
              const dayLeaves = calendarLeaves.filter(leave => leave.startDate <= date && leave.endDate >= date);
              return (
                <div className={`leaves-calendar-day${isCurrentMonth ? '' : ' outside-month'}${date === today ? ' today' : ''}`} key={date}>
                  <span className="leaves-calendar-date">{dateObject.getUTCDate()}</span>
                  <div className="leaves-calendar-events">
                    {dayLeaves.slice(0, 2).map(leave => (
                      <button
                        type="button"
                        key={leave.id}
                        className={`leaves-calendar-event ${leave.status.toLowerCase()}`}
                        title={`${leave.employeeName} · ${leave.leaveType} · ${leave.status}`}
                        onClick={() => setSelectedReviewLeave(leave)}
                      >
                        <span>{role === 'admin' ? leave.employeeName : leave.leaveType}</span>
                      </button>
                    ))}
                    {dayLeaves.length > 2 && <span className="leaves-calendar-more">+{dayLeaves.length - 2} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="leaves-calendar-legend">
            <span><i className="approved" /> Approved</span>
            <span><i className="pending" /> Pending</span>
            {leavesLoading && <span>Loading requests…</span>}
          </div>
        </section>
      ) : (
        <>
      <div className="tabs-container">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} Requests ({leaves.filter(l => tab === 'All' ? true : l.status === tab).length})
          </button>
        ))}
      </div>
      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Category</th>
              <th>Dates & Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {leavesLoading ? (
              <TableSkeletonRows columns={7} rows={5} />
            ) : displayedLeaves.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No leave requests in this category.
                </td>
              </tr>
            ) : (
              displayedLeaves.map(leave => (
                <tr key={leave.id} className="arrow-lift-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={leave.employeeAvatar} 
                        alt={leave.employeeName} 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{leave.employeeName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{leave.department}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#0052FF' }}>{leave.leaveType}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {leave.days} Business Days
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {leave.startDate} → {leave.endDate}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }} title={leave.reason}>
                      {leave.reason.length > 45 ? `${leave.reason.slice(0, 45)}...` : leave.reason}
                    </span>
                    {leave.reviewNote && (
                      <div style={{ fontSize: '11px', color: '#05B169', marginTop: '2px' }}>
                        Note: {leave.reviewNote}
                      </div>
                    )}
                  </td>
                  <td>
                    {getStatusBadge(leave.status)}
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{leave.appliedOn}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {role === 'admin' && leave.status === 'Pending' ? (
                      <button
                        onClick={() => setSelectedReviewLeave(leave)}
                        className="btn btn-sm btn-primary"
                        style={{ padding: '6px 12px' }}
                      >
                        <span>Review</span>
                        <ChevronRight className="arrow-lift-trigger" size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedReviewLeave(leave)}
                        className="btn btn-sm btn-ghost"
                      >
                        <span>View Details</span>
                        <ChevronRight className="arrow-lift-trigger" size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
      <ApplyLeaveModal 
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />

      <LeaveApprovalModal 
        key={selectedReviewLeave?.id ?? 'closed'}
        leave={selectedReviewLeave}
        onClose={() => setSelectedReviewLeave(null)}
      />
    </div>
  );
};
