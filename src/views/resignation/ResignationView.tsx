import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, FileText, History, Search, Send, ShieldCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import {
  resignationsApi,
  type ResignationApplication,
  type ResignationChecklistItem,
  type ResignationReason,
  type ResignationStatus,
} from '../../lib/api';
import { CardGridSkeleton, SectionSkeleton } from '../../components/feedback/LoadingSkeleton';

const reasons: ResignationReason[] = [
  'Career growth',
  'Higher studies',
  'Personal reasons',
  'Relocation',
  'Health reasons',
  'Other',
];

function localDateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not set';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Not set'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysBetween(start: string, end: string): number {
  return Math.max(0, Math.ceil(
    (Date.parse(`${end.slice(0, 10)}T00:00:00Z`) - Date.parse(`${start.slice(0, 10)}T00:00:00Z`))
    / 86_400_000,
  ));
}

function approvedNoticeDays(application: ResignationApplication): number {
  return application.approvedNoticeDays
    ?? daysBetween(application.resignationDate, application.approvedLastDay ?? application.proposedLastDay);
}

function noticeProgressValue(application: ResignationApplication, today: string): number {
  const duration = approvedNoticeDays(application);
  return duration === 0
    ? 1
    : Math.min(duration, daysBetween(application.resignationDate, today));
}

function isOverdue(application: ResignationApplication, reminderDays: number): boolean {
  return application.status === 'Pending'
    && (application.escalationNotifiedAt !== null || Date.now() - Date.parse(application.createdAt) >= reminderDays * 86_400_000);
}

function StatusBadge({ application, reminderDays }: { application: ResignationApplication; reminderDays: number }) {
  if (isOverdue(application, reminderDays)) {
    return <span className="badge badge-danger"><span className="badge-dot" />Overdue{application.escalationNotifiedAt ? ' · escalated' : ' · follow-up due'}</span>;
  }
  if (application.status === 'Approved') {
    return <span className="badge badge-success"><span className="badge-dot" />Approved</span>;
  }
  if (application.status === 'Rejected') {
    return <span className="badge badge-danger"><span className="badge-dot" />Rejected</span>;
  }
  return <span className="badge badge-warning"><span className="badge-dot" />Pending review</span>;
}

function ActivityHistory({ application }: { application: ResignationApplication }) {
  if (!application.events.length) return null;
  return (
    <details style={{ marginTop: '16px' }}>
      <summary style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontWeight: 600 }}>
        <History size={15} /> Activity history ({application.events.length})
      </summary>
      <ol style={{ display: 'grid', gap: '10px', paddingLeft: '22px', margin: '12px 0 0' }}>
        {application.events.map(event => (
          <li key={event.id}>
            <strong>{event.eventType}</strong>
            <p style={{ margin: '3px 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{event.description}</p>
            <small style={{ color: 'var(--text-muted)' }}>
              {event.actorName ?? 'Former user'} · {new Date(event.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ol>
    </details>
  );
}

function OffboardingChecklistSummary({ application }: { application: ResignationApplication }) {
  if (!application.checklist.length) return null;
  const completed = application.checklist.filter(item => item.status === 'Completed').length;
  return (
    <section style={{ marginTop: '18px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
      <h4 style={{ margin: '0 0 10px' }}>Offboarding checklist · {completed}/{application.checklist.length} complete</h4>
      <ul style={{ display: 'grid', gap: '9px', paddingLeft: '20px', margin: 0 }}>
        {application.checklist.map(item => (
          <li key={item.id}>
            <strong>{item.title}</strong> · {item.status}
            {item.responsibleParty && <span style={{ color: 'var(--text-secondary)' }}> · {item.responsibleParty}</span>}
            {item.dueDate && <span style={{ color: 'var(--text-secondary)' }}> · Due {formatDate(item.dueDate)}</span>}
            {item.note && <p style={{ margin: '3px 0', color: 'var(--text-secondary)' }}>{item.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '14px',
  padding: '22px',
};

export const ResignationView: React.FC = () => {
  const { currentUser, employees, role } = useERP();
  const [applications, setApplications] = useState<ResignationApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noticeDays, setNoticeDays] = useState(30);
  const [reviewReminderDays, setReviewReminderDays] = useState(7);
  const [isNoticePolicyLoaded, setIsNoticePolicyLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposedLastDay, setProposedLastDay] = useState(() => localDateAfterDays(30));
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<ResignationReason>('Career growth');
  const [remarks, setRemarks] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewDates, setReviewDates] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ResignationStatus>('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [submittedAfter, setSubmittedAfter] = useState('');
  const [submittedBefore, setSubmittedBefore] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, Partial<ResignationChecklistItem>>>({});
  const [savingChecklist, setSavingChecklist] = useState<Record<string, boolean>>({});
  const employee = employees.find(record => record.email.toLowerCase() === currentUser.email.toLowerCase());
  const sortedApplications = useMemo(
    () => [...applications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [applications],
  );
  const activeApplication = sortedApplications.find(application => (
    application.status === 'Pending' || application.status === 'Approved'
  ));
  const pendingCount = applications.filter(application => application.status === 'Pending').length;
  const overdueCount = applications.filter(application => isOverdue(application, reviewReminderDays)).length;
  const departments = useMemo(
    () => [...new Set(applications.map(application => application.department))].sort((a, b) => a.localeCompare(b)),
    [applications],
  );
  const filteredApplications = useMemo(() => sortedApplications.filter(application => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch = !searchText
      || application.employeeName.toLowerCase().includes(searchText)
      || application.employeeCode.toLowerCase().includes(searchText)
      || application.employeeEmail.toLowerCase().includes(searchText);
    const submittedOn = application.createdAt.slice(0, 10);
    return matchesSearch
      && (statusFilter === 'All' || application.status === statusFilter)
      && (departmentFilter === 'All' || application.department === departmentFilter)
      && (!submittedAfter || submittedOn >= submittedAfter)
      && (!submittedBefore || submittedOn <= submittedBefore)
      && (!overdueOnly || isOverdue(application, reviewReminderDays));
  }), [sortedApplications, search, statusFilter, departmentFilter, submittedAfter, submittedBefore, overdueOnly, reviewReminderDays]);

  useEffect(() => {
    let active = true;
    void resignationsApi.list()
      .then(records => {
        if (active) setApplications(records);
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load resignation applications.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [currentUser.id]);

  useEffect(() => {
    let active = true;
    void resignationsApi.getPolicy()
      .then(policy => {
        if (active) {
          setNoticeDays(policy.noticeDays);
          setReviewReminderDays(policy.reviewReminderDays);
          setProposedLastDay(localDateAfterDays(policy.noticeDays));
          setIsNoticePolicyLoaded(true);
        }
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load the company notice period.');
      });
    return () => { active = false; };
  }, []);

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isNoticePolicyLoaded) {
      setError('Wait for the current company notice period to load before submitting.');
      return;
    }
    if (!confirmed) {
      setError('Confirm that you understand the notice period and handover responsibilities before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resignationsApi.apply({ proposedLastDay, reason, remarks });
      setApplications(previous => [result.resignation, ...previous]);
      setRemarks('');
      setConfirmed(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit your resignation application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewApplication = async (application: ResignationApplication, status: ResignationStatus) => {
    const note = reviewNotes[application.id] ?? '';
    const approvedLastDay = reviewDates[application.id] ?? application.proposedLastDay;
    if (status === 'Approved' && approvedLastDay !== application.proposedLastDay && !note.trim()) {
      setError('Add a review note explaining the change to the proposed last working day.');
      return;
    }
    setError(null);
    try {
      const result = await resignationsApi.review(
        application.id,
        status,
        note,
        status === 'Approved' ? approvedLastDay : undefined,
      );
      setApplications(previous => previous.map(existing => existing.id === application.id
        ? result.resignation
        : existing));
      try {
        setApplications(await resignationsApi.list());
      } catch (refreshError) {
        setError(`Decision saved, but activity could not be refreshed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error.'}`);
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review this application.');
    }
  };

  const updateChecklistItem = async (application: ResignationApplication, item: ResignationChecklistItem) => {
    const draft = checklistDrafts[item.id];
    if (!draft) return;
    setSavingChecklist(previous => ({ ...previous, [item.id]: true }));
    setError(null);
    try {
      await resignationsApi.updateChecklistItem(application.id, item.id, draft);
      try {
        setApplications(await resignationsApi.list());
      } catch (refreshError) {
        setError(`Checklist task saved, but activity could not be refreshed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error.'}`);
      }
      setChecklistDrafts(previous => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the offboarding checklist.');
    } finally {
      setSavingChecklist(previous => ({ ...previous, [item.id]: false }));
    }
  };

  const profile = employee ? (
    <div className="interactive-lift-card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
      <img
        src={employee.avatar}
        alt={employee.firstName}
        style={{ width: '54px', height: '54px', borderRadius: '14px', objectFit: 'cover', background: 'var(--bg-subtle)' }}
      />
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '17px', margin: 0 }}>{employee.firstName} {employee.lastName}</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '3px 0 0' }}>
          {employee.designation} · {employee.department} · {employee.employeeCode}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '19px', margin: 0 }}>
          {role === 'admin' ? 'Resignation applications' : 'Plan your next step'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          {role === 'admin'
            ? `Review and track employee exits. Pending applications are escalated to HR after ${reviewReminderDays} days.`
            : 'Submit your resignation request and track the review and notice period.'}
        </p>
      </div>

      {error && (
        <div role="alert" style={{ padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
          {error}
        </div>
      )}
      {role === 'employee' ? (
        <>
          {profile}
          {isLoading ? (
            <SectionSkeleton rows={5} />
          ) : activeApplication ? (
            <section className="interactive-lift-card" style={{ ...cardStyle, marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', margin: 0 }}>
                  <FileText size={18} color="var(--primary)" /> Your resignation application
                </h3>
                <StatusBadge application={activeApplication} reminderDays={reviewReminderDays} />
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '12px 0 18px' }}>
                {activeApplication.status === 'Approved'
                  ? 'Your request was approved. Coordinate your handover and clearance with HR.'
                  : isOverdue(activeApplication, reviewReminderDays)
                    ? activeApplication.escalationNotifiedAt
                      ? `Your application has been waiting for ${reviewReminderDays} days. HR has been notified to follow up. It is not automatically approved.`
                      : `Your application has reached the ${reviewReminderDays}-day follow-up threshold. HR will be notified by the next hourly check. It is not automatically approved.`
                    : 'Your application has been sent to HR for review. It remains pending until HR makes a decision.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Submitted</p><strong>{formatDate(activeApplication.resignationDate)}</strong></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{activeApplication.status === 'Approved' ? 'Confirmed notice period' : 'Required notice period'}</p><strong>{activeApplication.status === 'Approved'
                  ? approvedNoticeDays(activeApplication)
                  : activeApplication.noticeDays} calendar days</strong></div>
                {activeApplication.status === 'Approved' && activeApplication.approvedLastDay !== activeApplication.proposedLastDay && (
                  <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Your proposed last day</p><strong>{formatDate(activeApplication.proposedLastDay)}</strong></div>
                )}
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{activeApplication.status === 'Approved' ? 'Confirmed last day' : 'Proposed last day'}</p><strong>{formatDate(activeApplication.approvedLastDay ?? activeApplication.proposedLastDay)}</strong></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Reason</p><strong>{activeApplication.reason}</strong></div>
              </div>
              {activeApplication.reviewNote && (
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>HR review note</p>
                  <p style={{ margin: '4px 0 0' }}>{activeApplication.reviewNote}</p>
                </div>
              )}
              {activeApplication.status === 'Approved' && (
                <div style={{ marginTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '7px' }}>
                    <span>Notice period progress</span>
                    <strong>{approvedNoticeDays(activeApplication) === 0
                      ? 100
                      : Math.min(100, Math.round(
                        (daysBetween(activeApplication.resignationDate, today) / approvedNoticeDays(activeApplication)) * 100,
                      ))}%</strong>
                  </div>
                  <progress
                    value={noticeProgressValue(activeApplication, today)}
                    max={Math.max(1, approvedNoticeDays(activeApplication))}
                    style={{ width: '100%', height: '10px', accentColor: 'var(--primary)' }}
                  />
                </div>
              )}
              {activeApplication.status === 'Approved' && <OffboardingChecklistSummary application={activeApplication} />}
              <ActivityHistory application={activeApplication} />
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '14px 0 0' }}>
                {activeApplication.reviewedBy
                  ? `Reviewed by ${activeApplication.reviewedBy}${activeApplication.reviewedAt ? ` on ${formatDate(activeApplication.reviewedAt)}` : ''}.`
                  : `If no decision is recorded within ${reviewReminderDays} days, HR is notified. Silence never counts as approval.`}
              </p>
            </section>
          ) : (
            <form className="interactive-lift-card" onSubmit={event => void submitApplication(event)} style={{ ...cardStyle, marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 6px' }}>Your resignation application</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 18px' }}>
                Submit a proposed last working day at least {noticeDays} calendar days from today. HR will review the request; submitting does not automatically end your employment.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
                  Proposed last working day
                  <input
                    className="form-control"
                    type="date"
                    required
                    min={localDateAfterDays(noticeDays)}
                    value={proposedLastDay}
                    onChange={event => setProposedLastDay(event.target.value)}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                    Notice period: {noticeDays} calendar days
                  </span>
                </label>
                <label style={{ display: 'grid', alignContent: 'start', gap: '6px', fontWeight: 600 }}>
                  Reason for leaving
                  <select className="form-control" value={reason} onChange={event => setReason(event.target.value as ResignationReason)}>
                    {reasons.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: 'grid', gap: '6px', marginTop: '16px', fontWeight: 600 }}>
                Remarks
                <textarea
                  className="form-control"
                  rows={4}
                  maxLength={2000}
                  required
                  value={remarks}
                  onChange={event => setRemarks(event.target.value)}
                  placeholder="Share any information HR should consider and your handover plans."
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginTop: '16px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
                I understand that my request requires HR review and I agree to coordinate my notice period and handover.
              </label>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isNoticePolicyLoaded} style={{ marginTop: '18px' }}>
                <Send size={15} />
                {isSubmitting ? 'Submitting…' : 'Submit resignation'}
              </button>
            </form>
          )}

          <section className="interactive-lift-card" style={cardStyle}>
            <h3 style={{ fontSize: '15px', margin: '0 0 14px' }}>How the process works</h3>
            {[
              ['Submit your application', 'Provide your proposed last working day, reason, and remarks.'],
              ['HR reviews your request', 'HR receives a notification and confirms or responds to the proposed date.'],
              [`Overdue follow-up after ${reviewReminderDays} days`, 'HR is notified. Your request remains pending until reviewed.'],
              ['Complete your handover', 'After approval, use the offboarding checklist to track handover and clearance with HR.'],
            ].map(([title, detail], index) => (
              <div key={title} style={{ display: 'flex', gap: '12px', marginTop: index === 0 ? 0 : '14px' }}>
                <span style={{ width: '24px', height: '24px', display: 'grid', placeItems: 'center', borderRadius: '7px', color: 'var(--primary)', background: 'var(--info-bg)', fontWeight: 700 }}>{index + 1}</span>
                <div><strong>{title}</strong><p style={{ color: 'var(--text-secondary)', margin: '2px 0 0', fontSize: '12px' }}>{detail}</p></div>
              </div>
            ))}
          </section>

          {sortedApplications.some(application => application.status === 'Rejected') && (
            <section className="interactive-lift-card" style={{ ...cardStyle, marginTop: '18px' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 12px' }}>Previous applications</h3>
              {sortedApplications.filter(application => application.status === 'Rejected').map(application => (
                <div key={application.id} style={{ padding: '12px 0', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <span>{formatDate(application.resignationDate)} · Proposed last day {formatDate(application.proposedLastDay)}</span>
                    <StatusBadge application={application} reminderDays={reviewReminderDays} />
                  </div>
                  {application.reviewNote && <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>Review note: {application.reviewNote}</p>}
                </div>
              ))}
            </section>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div className="interactive-lift-card" style={cardStyle}><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Total applications</p><strong style={{ fontSize: '24px' }}>{applications.length}</strong></div>
            <div className="interactive-lift-card" style={cardStyle}><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting review</p><strong style={{ fontSize: '24px' }}>{pendingCount}</strong></div>
            <div className="interactive-lift-card" style={cardStyle}><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Overdue · {reviewReminderDays}+ days</p><strong style={{ fontSize: '24px', color: overdueCount ? 'var(--danger)' : 'var(--text-main)' }}>{overdueCount}</strong></div>
          </div>
          <section className="interactive-lift-card" style={{ ...cardStyle, marginBottom: '18px' }} aria-label="Filter resignation applications">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Search employee
                <span style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', top: '11px', left: '10px', color: 'var(--text-muted)' }} />
                  <input className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, employee code, email" style={{ paddingLeft: '34px' }} />
                </span>
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Status
                <select className="form-control" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'All' | ResignationStatus)}>
                  <option value="All">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Department
                <select className="form-control" value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}>
                  <option value="All">All departments</option>
                  {departments.map(department => <option key={department}>{department}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Submitted from
                <input type="date" className="form-control" value={submittedAfter} onChange={event => setSubmittedAfter(event.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Submitted to
                <input type="date" className="form-control" value={submittedBefore} onChange={event => setSubmittedBefore(event.target.value)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input type="checkbox" checked={overdueOnly} onChange={event => setOverdueOnly(event.target.checked)} />
                Overdue only
              </label>
            </div>
          </section>
          {isLoading ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <CardGridSkeleton count={3} minHeight={90} />
              <SectionSkeleton rows={5} />
            </div>
          ) : applications.length === 0 ? (
            <section className="interactive-lift-card" style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No resignation applications have been submitted.
            </section>
          ) : filteredApplications.length === 0 ? (
            <section className="interactive-lift-card" style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No applications match these filters.
            </section>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredApplications.map(application => (
                <section key={application.id} className="interactive-lift-card" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <img src={application.employeeAvatar} alt={application.employeeName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <strong>{application.employeeName}</strong>
                      <p style={{ color: 'var(--text-secondary)', margin: '3px 0 0', fontSize: '12px' }}>
                        {application.employeeCode} · {application.designation} · {application.department}
                      </p>
                      <p style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '12px' }}>{application.employeeEmail}</p>
                    </div>
                    <StatusBadge application={application} reminderDays={reviewReminderDays} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Submitted</p><strong>{formatDate(application.resignationDate)}</strong></div>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Required notice</p><strong>{application.noticeDays} calendar days</strong></div>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Proposed last day</p><strong>{formatDate(application.proposedLastDay)}</strong></div>
                    {application.status === 'Approved' && (
                      <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Confirmed last day</p><strong>{formatDate(application.approvedLastDay)}</strong></div>
                    )}
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Reason</p><strong>{application.reason}</strong></div>
                  </div>
                  <p style={{ margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{application.remarks}</p>
                  {isOverdue(application, reviewReminderDays) && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', margin: '12px 0 0', fontSize: '13px' }}>
                      <AlertCircle size={15} /> No decision after {reviewReminderDays} days. {application.escalationNotifiedAt ? 'HR follow-up notification sent.' : 'HR notification is due on the next hourly check.'}
                    </p>
                  )}
                  {application.status === 'Pending' ? (
                    <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                      <label style={{ display: 'grid', gap: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        Confirmed last working day
                        <input
                          className="form-control"
                          type="date"
                          min={application.resignationDate}
                          value={reviewDates[application.id] ?? application.proposedLastDay}
                          onChange={event => setReviewDates(previous => ({ ...previous, [application.id]: event.target.value }))}
                        />
                      </label>
                      <input
                        className="form-control"
                        aria-label={`Review note for ${application.employeeName}`}
                        placeholder="Review note (required to reject or change date)"
                        value={reviewNotes[application.id] ?? ''}
                        onChange={event => setReviewNotes(previous => ({ ...previous, [application.id]: event.target.value }))}
                        style={{ flex: 1, minWidth: '220px' }}
                      />
                      <button className="btn btn-secondary" onClick={() => void reviewApplication(application, 'Rejected')}>
                        Reject
                      </button>
                      <button className="btn btn-primary" onClick={() => void reviewApplication(application, 'Approved')}>
                        <CheckCircle2 size={15} /> Approve
                      </button>
                    </div>
                    </>
                  ) : (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', margin: '12px 0 0', fontSize: '12px' }}>
                      {application.status === 'Approved' ? <ShieldCheck size={14} /> : <Clock3 size={14} />}
                      {application.status} by {application.reviewedBy ?? 'HR'}
                      {application.reviewNote ? ` · ${application.reviewNote}` : ''}
                    </p>
                  )}
                  {application.status === 'Approved' && application.checklist.length > 0 && (
                    <section style={{ marginTop: '18px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <h3 style={{ fontSize: '15px', margin: '0 0 12px' }}>
                        Offboarding checklist · {application.checklist.filter(item => item.status === 'Completed').length}/{application.checklist.length} complete
                      </h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {application.checklist.map(item => {
                          const draft = checklistDrafts[item.id] ?? {};
                          const hasChanges = Object.keys(draft).length > 0;
                          return (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '9px', padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                              <strong style={{ alignSelf: 'center' }}>{item.title}</strong>
                              <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                                Status
                                <select
                                  className="form-control"
                                  value={draft.status ?? item.status}
                                  onChange={event => setChecklistDrafts(previous => ({
                                    ...previous,
                                    [item.id]: { ...previous[item.id], status: event.target.value as ResignationChecklistItem['status'] },
                                  }))}
                                >
                                  <option>Pending</option>
                                  <option>In progress</option>
                                  <option>Completed</option>
                                </select>
                              </label>
                              <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                                Responsible person or team
                                <input
                                  className="form-control"
                                  maxLength={150}
                                  value={draft.responsibleParty ?? item.responsibleParty}
                                  onChange={event => setChecklistDrafts(previous => ({
                                    ...previous,
                                    [item.id]: { ...previous[item.id], responsibleParty: event.target.value },
                                  }))}
                                />
                              </label>
                              <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                                Due date
                                <input
                                  type="date"
                                  className="form-control"
                                  value={draft.dueDate ?? item.dueDate ?? ''}
                                  onChange={event => setChecklistDrafts(previous => ({
                                    ...previous,
                                    [item.id]: { ...previous[item.id], dueDate: event.target.value || null },
                                  }))}
                                />
                              </label>
                              <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                                Note
                                <input
                                  className="form-control"
                                  maxLength={2000}
                                  value={draft.note ?? item.note}
                                  onChange={event => setChecklistDrafts(previous => ({
                                    ...previous,
                                    [item.id]: { ...previous[item.id], note: event.target.value },
                                  }))}
                                />
                              </label>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={!hasChanges || savingChecklist[item.id]}
                                onClick={() => void updateChecklistItem(application, item)}
                                style={{ alignSelf: 'end' }}
                              >
                                {savingChecklist[item.id] ? 'Saving…' : 'Save task'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                  <ActivityHistory application={application} />
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
