import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, FileText, Send, ShieldCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import {
  resignationsApi,
  type ResignationApplication,
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

function isOverdue(application: ResignationApplication): boolean {
  return application.status === 'Pending'
    && (application.escalationNotifiedAt !== null || Date.now() - Date.parse(application.createdAt) >= 7 * 86_400_000);
}

function StatusBadge({ application }: { application: ResignationApplication }) {
  if (isOverdue(application)) {
    return <span className="badge badge-danger"><span className="badge-dot" />Overdue · escalated</span>;
  }
  if (application.status === 'Approved') {
    return <span className="badge badge-success"><span className="badge-dot" />Approved</span>;
  }
  if (application.status === 'Rejected') {
    return <span className="badge badge-danger"><span className="badge-dot" />Rejected</span>;
  }
  return <span className="badge badge-warning"><span className="badge-dot" />Pending review</span>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [proposedLastDay, setProposedLastDay] = useState(() => localDateAfterDays(30));
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<ResignationReason>('Career growth');
  const [remarks, setRemarks] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const employee = employees.find(record => record.email.toLowerCase() === currentUser.email.toLowerCase());
  const sortedApplications = useMemo(
    () => [...applications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [applications],
  );
  const activeApplication = sortedApplications.find(application => (
    application.status === 'Pending' || application.status === 'Approved'
  ));
  const pendingCount = applications.filter(application => application.status === 'Pending').length;
  const overdueCount = applications.filter(isOverdue).length;

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

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!confirmed) {
      setError('Confirm that you understand the notice period and handover responsibilities before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resignationsApi.apply({ proposedLastDay, reason, remarks });
      setApplications(previous => [result.resignation, ...previous]);
      setSuccess('Your resignation application has been submitted to HR for review.');
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
    setError(null);
    setSuccess(null);
    try {
      const result = await resignationsApi.review(application.id, status, note);
      setApplications(previous => previous.map(existing => existing.id === application.id
        ? result.resignation
        : existing));
      setSuccess(`${application.employeeName}'s resignation application was ${status.toLowerCase()}.`);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review this application.');
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
      <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '12px' }}>
        Reporting manager<br /><strong style={{ color: 'var(--text-main)' }}>{employee.manager || 'Not provided'}</strong>
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
            ? 'Review employee requests. Pending applications are escalated to HR and the owner after 7 days.'
            : 'Submit your resignation request and track the review and notice period.'}
        </p>
      </div>

      {error && (
        <div role="alert" style={{ padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
          {error}
        </div>
      )}
      {success && (
        <div role="status" style={{ padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', color: 'var(--success)', background: 'var(--success-bg)' }}>
          {success}
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
                <StatusBadge application={activeApplication} />
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '12px 0 18px' }}>
                {activeApplication.status === 'Approved'
                  ? 'Your request was approved. Coordinate your handover with your manager and HR.'
                  : isOverdue(activeApplication)
                    ? 'Your application has been waiting for 7 days. HR and the company owner have been notified to follow up. It is not automatically approved.'
                    : 'Your application has been sent to HR for review. It remains pending until an administrator makes a decision.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Submitted</p><strong>{formatDate(activeApplication.resignationDate)}</strong></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Notice period</p><strong>{activeApplication.noticeDays} calendar days</strong></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Proposed last day</p><strong>{formatDate(activeApplication.approvedLastDay ?? activeApplication.proposedLastDay)}</strong></div>
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
                    <strong>{Math.min(100, Math.round(
                      (daysBetween(activeApplication.resignationDate, today)
                        / activeApplication.noticeDays) * 100,
                    ))}%</strong>
                  </div>
                  <progress
                    value={Math.min(activeApplication.noticeDays, daysBetween(
                      activeApplication.resignationDate,
                      today,
                    ))}
                    max={activeApplication.noticeDays}
                    style={{ width: '100%', height: '10px', accentColor: 'var(--primary)' }}
                  />
                </div>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '14px 0 0' }}>
                {activeApplication.reviewedBy
                  ? `Reviewed by ${activeApplication.reviewedBy}${activeApplication.reviewedAt ? ` on ${formatDate(activeApplication.reviewedAt)}` : ''}.`
                  : 'If no decision is recorded within 7 days, HR and the owner are notified. Silence never counts as approval.'}
              </p>
            </section>
          ) : (
            <form className="interactive-lift-card" onSubmit={event => void submitApplication(event)} style={{ ...cardStyle, marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 6px' }}>Your resignation application</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 18px' }}>
                Submit a proposed last working day at least 30 calendar days from today. HR will review the request; submitting does not automatically end your employment.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
                  Proposed last working day
                  <input
                    className="form-control"
                    type="date"
                    required
                    min={localDateAfterDays(30)}
                    value={proposedLastDay}
                    onChange={event => setProposedLastDay(event.target.value)}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                    Notice period: 30 calendar days
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
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '18px' }}>
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
              ['Overdue follow-up after 7 days', 'HR and the company owner are notified. Your request remains pending until reviewed.'],
              ['Complete your handover', 'After approval, coordinate your final work and handover with HR and your manager.'],
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
                    <StatusBadge application={application} />
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
            <div className="interactive-lift-card" style={cardStyle}><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Overdue · 7+ days</p><strong style={{ fontSize: '24px', color: overdueCount ? 'var(--danger)' : 'var(--text-main)' }}>{overdueCount}</strong></div>
          </div>
          {isLoading ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <CardGridSkeleton count={3} minHeight={90} />
              <SectionSkeleton rows={5} />
            </div>
          ) : applications.length === 0 ? (
            <section className="interactive-lift-card" style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No resignation applications have been submitted.
            </section>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {sortedApplications.map(application => (
                <section key={application.id} className="interactive-lift-card" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <img src={application.employeeAvatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <strong>{application.employeeName}</strong>
                      <p style={{ color: 'var(--text-secondary)', margin: '3px 0 0', fontSize: '12px' }}>
                        {application.employeeCode} · {application.designation} · {application.department}
                      </p>
                    </div>
                    <StatusBadge application={application} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Submitted</p><strong>{formatDate(application.resignationDate)}</strong></div>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Proposed last day</p><strong>{formatDate(application.proposedLastDay)}</strong></div>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Reason</p><strong>{application.reason}</strong></div>
                    <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Manager listed</p><strong>{application.manager || 'Not provided'}</strong></div>
                  </div>
                  <p style={{ margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{application.remarks}</p>
                  {isOverdue(application) && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', margin: '12px 0 0', fontSize: '13px' }}>
                      <AlertCircle size={15} /> Over 7 days without a decision. HR/owner escalation notification sent.
                    </p>
                  )}
                  {application.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                      <input
                        className="form-control"
                        aria-label={`Review note for ${application.employeeName}`}
                        placeholder="Review note (required to reject)"
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
                  ) : (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', margin: '12px 0 0', fontSize: '12px' }}>
                      {application.status === 'Approved' ? <ShieldCheck size={14} /> : <Clock3 size={14} />}
                      {application.status} by {application.reviewedBy ?? 'administrator'}
                      {application.reviewNote ? ` · ${application.reviewNote}` : ''}
                    </p>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
