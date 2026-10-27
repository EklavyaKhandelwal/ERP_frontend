import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, Send, Sparkles, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { Timesheet, TimesheetEntry } from '../../types/erp';

const weekdays: Array<{ key: keyof TimesheetEntry['hours']; label: string }> = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

type DraftRow = {
  key: string;
  projectId: string;
  taskDescription: string;
  hours: TimesheetEntry['hours'];
};

function zeroHours(): TimesheetEntry['hours'] {
  return { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
}

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

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const TimesheetsView: React.FC = () => {
  const {
    timesheets,
    timesheetsLoading,
    timesheetsError,
    projects,
    employees,
    role,
    currentUser,
    saveTimesheet,
    reviewTimesheet,
    setFigmaOverlayAsset,
  } = useERP();
  const [viewMode, setViewMode] = useState<'weekly' | 'approval'>('weekly');
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [draftState, setDraftState] = useState<{ weekStart: string; rows: DraftRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ownEmployee = employees.find(employee => employee.email === currentUser.email);
  const myTimesheet = timesheets.find(sheet => sheet.employeeId === ownEmployee?.id && sheet.weekStart === weekStart);
  const canEdit = !myTimesheet || myTimesheet.status === 'Draft' || myTimesheet.status === 'Rejected';
  const pendingTimesheets = timesheets.filter(sheet => sheet.status === 'Submitted');
  const initialRows = useMemo(() => myTimesheet
    ? myTimesheet.entries.map(entry => ({
      key: entry.id,
      projectId: entry.projectId,
      taskDescription: entry.taskDescription,
      hours: { ...entry.hours },
    }))
    : projects[0]
      ? [{ key: crypto.randomUUID(), projectId: projects[0].id, taskDescription: '', hours: zeroHours() }]
      : [], [myTimesheet, projects]);
  const rows = draftState?.weekStart === weekStart ? draftState.rows : initialRows;
  const totalHours = rows.reduce((sum, row) => sum + Object.values(row.hours).reduce((rowSum, hours) => rowSum + hours, 0), 0);
  const dayHeaders = useMemo(() => weekdays.map((day, index) => ({
    ...day,
    date: formatDate(shiftDate(weekStart, index)),
  })), [weekStart]);

  const updateRows = (update: (current: DraftRow[]) => DraftRow[]) => {
    setDraftState({ weekStart, rows: update(rows) });
  };

  const updateRow = (key: string, update: Partial<DraftRow>) => {
    updateRows(current => current.map(row => row.key === key ? { ...row, ...update } : row));
  };

  const addRow = () => {
    if (projects.length === 0) return;
    updateRows(current => [...current, {
      key: crypto.randomUUID(),
      projectId: projects[0].id,
      taskDescription: '',
      hours: zeroHours(),
    }]);
  };

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    setError(null);
    setSubmitting(true);
    try {
      const entries = rows.map(({ projectId, taskDescription, hours }) => ({
        projectId,
        taskDescription: taskDescription.trim()
          || projects.find(project => project.id === projectId)?.name
          || 'Project work',
        hours,
      }));
      const saved = await saveTimesheet(weekStart, status, entries);
      setDraftState({
        weekStart,
        rows: saved.entries.map(entry => ({
          key: entry.id,
          projectId: entry.projectId,
          taskDescription: entry.taskDescription,
          hours: { ...entry.hours },
        })),
      });
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (sheet: Timesheet, status: 'Approved' | 'Rejected') => {
    setError(null);
    try {
      await reviewTimesheet(sheet.id, status);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review timesheet.');
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            {viewMode === 'approval' ? 'Timesheet Approvals Queue' : 'Weekly Timesheet'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Record hours against projects assigned to you. Administrators review submitted timesheets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {role === 'admin' && (
            <button
              onClick={() => setViewMode(viewMode === 'approval' ? 'weekly' : 'approval')}
              className="btn btn-secondary btn-sm"
            >
              {viewMode === 'approval' ? 'Weekly View' : `Admin Approval (${pendingTimesheets.length})`}
            </button>
          )}
          <button
            onClick={() => setFigmaOverlayAsset(
              viewMode === 'approval'
                ? '/design-assets/Timesheets/Timesheets — Admin Approval.svg'
                : '/design-assets/Timesheets/Timesheets — Weekly View.svg'
            )}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#0052FF" />
            <span>Compare Figma Spec</span>
          </button>
        </div>
      </div>

      {(error || timesheetsError) && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {error ?? timesheetsError}
        </div>
      )}

      {viewMode === 'approval' && role === 'admin' ? (
        <section className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Submitted Timesheets
            </h3>
            <span className="badge badge-warning">{pendingTimesheets.length} Pending</span>
          </div>
          {timesheetsLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading timesheets…</div>
          ) : pendingTimesheets.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No submitted timesheets are awaiting review.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingTimesheets.map(sheet => (
                <div key={sheet.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', borderRadius: '10px', backgroundColor: '#F8F9FA', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={sheet.employeeAvatar} alt={sheet.employeeName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{sheet.employeeName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {sheet.department} · {sheet.weekStart} to {sheet.weekEnd} · {sheet.submittedOn}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <strong>{sheet.totalHours.toFixed(1)} hrs</strong>
                    <button onClick={() => void handleReview(sheet, 'Approved')} className="btn btn-sm" style={{ backgroundColor: '#E3F6EC', color: '#05B169', border: '1px solid #A3E6C5' }}>
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => void handleReview(sheet, 'Rejected')} className="btn btn-sm" style={{ backgroundColor: '#FEECEE', color: '#CF202F', border: '1px solid #F7BAC0' }}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-sm btn-secondary" aria-label="Previous week" onClick={() => setWeekStart(shiftDate(weekStart, -7).toISOString().slice(0, 10))}>
                <ChevronLeft size={14} />
              </button>
              <strong>{formatDate(new Date(`${weekStart}T00:00:00.000Z`))} — {formatDate(shiftDate(weekStart, 6))}, {weekStart.slice(0, 4)}</strong>
              <button className="btn btn-sm btn-secondary" aria-label="Next week" onClick={() => setWeekStart(shiftDate(weekStart, 7).toISOString().slice(0, 10))}>
                <ChevronRight size={14} />
              </button>
              {myTimesheet && <span className={`badge ${myTimesheet.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>{myTimesheet.status}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Total: <strong style={{ color: '#0052FF' }}>{totalHours.toFixed(1)} hrs</strong></span>
              {canEdit && (
                <>
                  <button disabled={submitting || projects.length === 0} className="btn btn-secondary btn-sm" onClick={() => void handleSave('Draft')}>Save Draft</button>
                  <button disabled={submitting || projects.length === 0} className="btn btn-primary btn-sm" onClick={() => void handleSave('Submitted')}>
                    <Send size={14} /> Submit
                  </button>
                </>
              )}
            </div>
          </div>

          {!ownEmployee && !timesheetsLoading && (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>Your account does not have a linked employee profile.</div>
          )}
          {timesheetsLoading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading timesheets…</div>
          ) : projects.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active projects are assigned to you. Ask an administrator to add you to a project team.
            </div>
          ) : (
            <div className="table-container">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th style={{ width: '280px' }}>Project & Task</th>
                    {dayHeaders.map(day => (
                      <th key={day.key} style={{ textAlign: 'center', minWidth: '70px' }}>
                        <div>{day.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.date}</div>
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', width: '80px' }}>Total</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const rowHours = Object.values(row.hours).reduce((sum, hours) => sum + hours, 0);
                    return (
                      <tr key={row.key}>
                        <td>
                          <select
                            className="form-control"
                            disabled={!canEdit}
                            value={row.projectId}
                            onChange={event => updateRow(row.key, { projectId: event.target.value })}
                          >
                            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                          </select>
                          <input
                            className="form-control"
                            style={{ marginTop: '6px' }}
                            placeholder="Task description (optional)"
                            maxLength={500}
                            disabled={!canEdit}
                            value={row.taskDescription}
                            onChange={event => updateRow(row.key, { taskDescription: event.target.value })}
                          />
                        </td>
                        {dayHeaders.map(day => (
                          <td key={day.key} style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              disabled={!canEdit}
                              value={row.hours[day.key] || ''}
                              onChange={event => updateRow(row.key, {
                                hours: { ...row.hours, [day.key]: Number(event.target.value) || 0 },
                              })}
                              style={{ width: '54px', height: '36px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--border-default)', fontSize: '13.5px', fontWeight: '600' }}
                            />
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}><strong>{rowHours.toFixed(1)}h</strong></td>
                        {canEdit && (
                          <td>
                            <button className="btn btn-secondary btn-sm" aria-label="Remove entry" onClick={() => updateRows(current => current.filter(item => item.key !== row.key))}>
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: '#F8F9FA', fontWeight: '700' }}>
                    <td>
                      {canEdit && <button className="btn btn-secondary btn-sm" onClick={addRow}><Plus size={14} /> Add project task</button>}
                      {!canEdit && 'Daily Total'}
                    </td>
                    {dayHeaders.map(day => {
                      const total = rows.reduce((sum, row) => sum + row.hours[day.key], 0);
                      return <td key={day.key} style={{ textAlign: 'center', color: total > 24 ? '#CF202F' : '#0052FF' }}>{total.toFixed(1)}h</td>;
                    })}
                    <td style={{ textAlign: 'center', color: '#0052FF' }}>{totalHours.toFixed(1)}h</td>
                    {canEdit && <td />}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {myTimesheet?.reviewNote && (
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: '#FFF7E6' }}>
              Reviewer note: {myTimesheet.reviewNote}
            </div>
          )}
        </>
      )}
    </div>
  );
};
