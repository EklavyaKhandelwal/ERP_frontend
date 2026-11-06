import React, { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarPlus, Pencil, Trash2, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { CompanyHoliday, LeaveRequest } from '../../types/erp';
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
    companyHolidays,
    saveCompanyHoliday,
    deleteCompanyHoliday,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [activeView, setActiveView] = useState<'Calendar' | 'Requests'>('Calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedReviewLeave, setSelectedReviewLeave] = useState<LeaveRequest | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<CompanyHoliday | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState(today);
  const [holidayEndDate, setHolidayEndDate] = useState(today);
  const [holidayDescription, setHolidayDescription] = useState('');
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [isSavingHoliday, setIsSavingHoliday] = useState(false);
  const [isDeletingHoliday, setIsDeletingHoliday] = useState(false);

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
  const openHolidayEditor = (holiday?: CompanyHoliday) => {
    setEditingHoliday(holiday ?? null);
    setIsHolidayModalOpen(true);
    setHolidayName(holiday?.name ?? '');
    setHolidayStartDate(holiday?.startDate ?? today);
    setHolidayEndDate(holiday?.endDate ?? today);
    setHolidayDescription(holiday?.description ?? '');
    setHolidayError(null);
  };
  const submitHoliday = async (event: React.FormEvent) => {
    event.preventDefault();
    setHolidayError(null);
    if (holidayEndDate < holidayStartDate) {
      setHolidayError('End date must be on or after the start date.');
      return;
    }
    setIsSavingHoliday(true);
    try {
      await saveCompanyHoliday({
        name: holidayName,
        startDate: holidayStartDate,
        endDate: holidayEndDate,
        description: holidayDescription,
      }, editingHoliday?.id);
      setIsHolidayModalOpen(false);
    } catch (saveError) {
      setHolidayError(saveError instanceof Error ? saveError.message : 'Unable to save the company holiday.');
    } finally {
      setIsSavingHoliday(false);
    }
  };
  const removeHoliday = (holiday: CompanyHoliday) => {
    setHolidayError(null);
    setHolidayToDelete(holiday);
  };
  const confirmRemoveHoliday = async () => {
    if (!holidayToDelete) return;
    setHolidayError(null);
    setIsDeletingHoliday(true);
    try {
      await deleteCompanyHoliday(holidayToDelete.id);
      if (editingHoliday?.id === holidayToDelete.id) setIsHolidayModalOpen(false);
      setHolidayToDelete(null);
    } catch (deleteError) {
      setHolidayError(deleteError instanceof Error ? deleteError.message : 'Unable to remove the company holiday.');
    }
    finally {
      setIsDeletingHoliday(false);
    }
  };

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
              {role === 'admin' ? 'HR Leave Approvals' : 'My Leave Allowances & History'}
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
          {role === 'admin' && activeView === 'Calendar' && (
            <button type="button" className="btn btn-primary" onClick={() => openHolidayEditor()}>
              <CalendarPlus size={16} /> <span>Add Holiday</span>
            </button>
          )}
          {role === 'employee' && (
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Apply Leave</span>
            </button>
          )}
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
      {holidayError && !isHolidayModalOpen && !holidayToDelete && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {holidayError}
        </div>
      )}
      {activeView === 'Calendar' ? (
        <section className="card leaves-calendar" aria-label={`${monthLabel} leave calendar`}>
          <div className="leaves-calendar-header">
            <div>
              <h3>{monthLabel}</h3>
              <p>{role === 'admin' ? 'Company holidays, approved and pending team leave' : 'Company holidays and your approved and pending leave'}</p>
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
              const dayHolidays = companyHolidays.filter(holiday => holiday.startDate <= date && holiday.endDate >= date);
              const visibleHolidays = dayHolidays.slice(0, 2);
              const visibleLeaves = dayLeaves.slice(0, Math.max(0, 2 - visibleHolidays.length));
              const eventCount = dayHolidays.length + dayLeaves.length;
              return (
                <div className={`leaves-calendar-day${isCurrentMonth ? '' : ' outside-month'}${date === today ? ' today' : ''}`} key={date}>
                  <span className="leaves-calendar-date">{dateObject.getUTCDate()}</span>
                  <div className="leaves-calendar-events">
                    {visibleHolidays.map(holiday => (
                      <button
                        type="button"
                        key={holiday.id}
                        className="leaves-calendar-event holiday"
                        title={`${holiday.name}${holiday.description ? ` · ${holiday.description}` : ''}`}
                        onClick={() => role === 'admin' && openHolidayEditor(holiday)}
                        aria-label={`Company holiday: ${holiday.name}${role === 'admin' ? ', edit holiday' : ''}`}
                      >
                        <span>Holiday · {holiday.name}</span>
                      </button>
                    ))}
                    {visibleLeaves.map(leave => (
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
                    {eventCount > visibleHolidays.length + visibleLeaves.length && (
                      <span className="leaves-calendar-more">+{eventCount - visibleHolidays.length - visibleLeaves.length} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="leaves-calendar-legend">
            <span><i className="holiday" /> Company holiday</span>
            <span><i className="approved" /> Approved</span>
            <span><i className="pending" /> Pending</span>
            {leavesLoading && <span>Loading requests…</span>}
          </div>
          {role === 'admin' && companyHolidays.length > 0 && (
            <div className="company-holiday-list">
              <h4>Company holidays</h4>
              {companyHolidays.map(holiday => (
                <div className="company-holiday-row" key={holiday.id}>
                  <div>
                    <strong>{holiday.name}</strong>
                    <span>
                      {holiday.startDate === holiday.endDate
                        ? holiday.startDate
                        : `${holiday.startDate} – ${holiday.endDate}`}
                      {holiday.description ? ` · ${holiday.description}` : ''}
                    </span>
                  </div>
                  <div className="company-holiday-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openHolidayEditor(holiday)} aria-label={`Edit ${holiday.name}`}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeHoliday(holiday)} aria-label={`Remove ${holiday.name}`}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      {role === 'employee' && (
        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
        />
      )}

      <LeaveApprovalModal 
        key={selectedReviewLeave?.id ?? 'closed'}
        leave={selectedReviewLeave}
        onClose={() => setSelectedReviewLeave(null)}
      />
      {isHolidayModalOpen && role === 'admin' ? (
        <div className="modal-overlay" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !isSavingHoliday) setIsHolidayModalOpen(false);
        }}>
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="holiday-modal-title" style={{ maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2 id="holiday-modal-title" style={{ margin: 0, fontSize: '18px' }}>{editingHoliday ? 'Edit Company Holiday' : 'Add Company Holiday'}</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  This holiday is shown to everyone and excluded from leave days deducted.
                </p>
              </div>
              <button type="button" aria-label="Close holiday form" onClick={() => setIsHolidayModalOpen(false)} disabled={isSavingHoliday} style={{ border: 0, background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={event => void submitHoliday(event)} style={{ display: 'grid', gap: '14px', marginTop: '20px' }}>
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">Holiday name *</span>
                <input required maxLength={150} className="form-control" value={holidayName} onChange={event => setHolidayName(event.target.value)} placeholder="e.g. Independence Day" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="form-group" style={{ margin: 0 }}>
                  <span className="form-label">From date *</span>
                  <input required type="date" className="form-control" value={holidayStartDate} onChange={event => setHolidayStartDate(event.target.value)} />
                </label>
                <label className="form-group" style={{ margin: 0 }}>
                  <span className="form-label">To date *</span>
                  <input required type="date" className="form-control" value={holidayEndDate} onChange={event => setHolidayEndDate(event.target.value)} />
                </label>
              </div>
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">Description (optional)</span>
                <textarea rows={3} maxLength={1000} className="form-control" value={holidayDescription} onChange={event => setHolidayDescription(event.target.value)} placeholder="Optional details for employees" />
              </label>
              {holidayError && <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontSize: '12px' }}>{holidayError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                {editingHoliday && (
                  <button type="button" className="btn btn-secondary" disabled={isSavingHoliday} onClick={() => removeHoliday(editingHoliday)}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
                <button type="button" className="btn btn-secondary" disabled={isSavingHoliday} onClick={() => setIsHolidayModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSavingHoliday}>
                  {isSavingHoliday ? 'Saving…' : editingHoliday ? 'Save changes' : 'Add holiday'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {holidayToDelete && (
        <div className="holiday-delete-backdrop">
          <section
            className="holiday-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="holiday-delete-title"
            aria-describedby="holiday-delete-message"
          >
            <div className="holiday-delete-icon"><Trash2 size={21} /></div>
            <h2 id="holiday-delete-title">Are you sure you want to remove this holiday?</h2>
            <p id="holiday-delete-message">
              <strong>{holidayToDelete.name}</strong> will be removed from the company calendar. This may change leave-day calculations.
            </p>
            {holidayError && <p className="holiday-delete-error" role="alert">{holidayError}</p>}
            <div className="holiday-delete-actions">
              <button type="button" className="btn btn-secondary" disabled={isDeletingHoliday} onClick={() => {
                setHolidayToDelete(null);
                setHolidayError(null);
              }}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" disabled={isDeletingHoliday} onClick={() => void confirmRemoveHoliday()}>
                {isDeletingHoliday ? 'Removing…' : 'Remove holiday'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
