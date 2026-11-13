import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock3, LogIn, LogOut, Save, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { attendanceApi, employeesApi } from '../../lib/api';
import type { AttendanceRecord, Employee } from '../../types/erp';
import { SectionSkeleton } from '../../components/feedback/LoadingSkeleton';

type ActiveRecord = { id: string; clockInAt: string };

function companyDateTimeInput(value: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

function localInputToIso(value: string, timeZone: string): string | null {
  if (!value) return null;
  const [date, time] = value.split('T');
  if (!date || !time) throw new Error('Enter a valid attendance time.');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    throw new Error('Enter a valid attendance time.');
  }
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(instant));
    const fields = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
    return Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second)
      - Math.floor(instant / 1000) * 1000;
  };
  const initialInstant = wallTime - offsetAt(wallTime);
  const correctedInstant = wallTime - offsetAt(initialInstant);
  return new Date(correctedInstant).toISOString();
}

function formatTime(value: string | null, timeZone: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

function formatCompanyDate(value: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function formatDuration(start: string, end: string | null, now: number): string {
  const elapsedMinutes = Math.max(0, Math.floor(((end ? new Date(end).getTime() : now) - new Date(start).getTime()) / 60_000));
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function isBeforeToday(value: string, today: string, timeZone: string): boolean {
  const date = companyDateTimeInput(value, timeZone).slice(0, 10);
  return date < today;
}

function describeCorrections(record: AttendanceRecord, timeZone: string): React.ReactNode {
  if (!record.adjustments.length) return null;
  return (
    <details style={{ marginTop: '8px', fontSize: '11px' }}>
      <summary style={{ cursor: 'pointer', color: 'var(--primary)' }}>
        {record.adjustments.length} HR {record.adjustments.length === 1 ? 'correction' : 'corrections'}
      </summary>
      <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
        {record.adjustments.map(adjustment => (
          <div key={adjustment.id} style={{ padding: '9px', borderRadius: '7px', background: 'var(--bg-canvas)' }}>
            <strong>{adjustment.changedBy}</strong> · {new Intl.DateTimeFormat('en-IN', {
              timeZone,
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(adjustment.createdAt))}
            <div style={{ marginTop: '3px' }}>{adjustment.reason}</div>
            <div style={{ marginTop: '3px', color: 'var(--text-muted)' }}>
              {formatTime(adjustment.previousClockInAt, timeZone)}–{formatTime(adjustment.previousClockOutAt, timeZone)}
              {' → '}
              {formatTime(adjustment.newClockInAt, timeZone)}–{formatTime(adjustment.newClockOutAt, timeZone)}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export const AttendanceView: React.FC = () => {
  const { role } = useERP();
  const isAdmin = role === 'admin';
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null);
  const [canClock, setCanClock] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [todayDate, setTodayDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [followsToday, setFollowsToday] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ startDate: '', endDate: '', employeeId: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isClockActionPending, setIsClockActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(0);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editClockInAt, setEditClockInAt] = useState('');
  const [editClockOutAt, setEditClockOutAt] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      const currentDate = formatCompanyDate(currentTime, timeZone);
      if (followsToday && todayDate && currentDate !== todayDate) {
        setTodayDate(currentDate);
        setStartDate(currentDate);
        setEndDate(currentDate);
        setIsLoading(true);
        setError(null);
        setAppliedFilters({
          startDate: currentDate,
          endDate: currentDate,
          employeeId: selectedEmployeeId,
        });
      }
    }, 30_000);
    return () => window.clearInterval(timerId);
  }, [followsToday, selectedEmployeeId, timeZone, todayDate]);

  useEffect(() => {
    let active = true;
    void attendanceApi.list({
      ...(appliedFilters.startDate ? { startDate: appliedFilters.startDate } : {}),
      ...(appliedFilters.endDate ? { endDate: appliedFilters.endDate } : {}),
      ...(appliedFilters.employeeId ? { employeeId: appliedFilters.employeeId } : {}),
    }).then(result => {
      if (!active) return;
      setRecords(result.records);
      setActiveRecord(result.activeRecord);
      setCanClock(result.canClock);
      setTruncated(result.truncated);
      setTimeZone(result.timeZone);
      setTodayDate(result.todayDate);
      setNow(new Date(result.serverNow).getTime());
      setStartDate(current => current || result.todayDate);
      setEndDate(current => current || result.todayDate);
      setError(null);
    }).catch(loadError => {
      if (active) {
        setRecords([]);
        setTruncated(false);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load attendance records.');
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [appliedFilters, refreshKey]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void employeesApi.list().then(result => {
      if (active) setEmployees(result);
    }).catch(loadError => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load employee profiles.');
    });
    return () => { active = false; };
  }, [isAdmin]);

  const submitFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (startDate > endDate) {
      setError('Start date must be on or before end date.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setFollowsToday(startDate === todayDate && endDate === todayDate);
    setAppliedFilters({ startDate, endDate, employeeId: selectedEmployeeId });
  };

  const selectEmployee = (employeeId: string) => {
    if (startDate && endDate && startDate > endDate) {
      setError('Start date must be on or before end date before changing employees.');
      return;
    }
    setSelectedEmployeeId(employeeId);
    setError(null);
    setIsLoading(true);
    setAppliedFilters(current => ({
      startDate: startDate || current.startDate,
      endDate: endDate || current.endDate,
      employeeId,
    }));
  };

  const showToday = () => {
    setFollowsToday(true);
    setStartDate(todayDate);
    setEndDate(todayDate);
    setError(null);
    setIsLoading(true);
    setAppliedFilters(current => ({ ...current, startDate: todayDate, endDate: todayDate }));
  };

  const updateClock = async (action: 'in' | 'out') => {
    setIsClockActionPending(true);
    setError(null);
    setIsLoading(true);
    try {
      if (action === 'in') {
        await attendanceApi.clockIn();
      } else {
        await attendanceApi.clockOut();
      }
      setRefreshKey(current => current + 1);
    } catch (actionError) {
      setIsLoading(false);
      setError(actionError instanceof Error ? actionError.message : 'Unable to update your attendance.');
    } finally {
      setIsClockActionPending(false);
    }
  };

  const beginCorrection = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditClockInAt(companyDateTimeInput(record.clockInAt, timeZone));
    setEditClockOutAt(record.clockOutAt ? companyDateTimeInput(record.clockOutAt, timeZone) : '');
    setEditReason('');
  };

  const saveCorrection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRecord) return;
    setIsSavingCorrection(true);
    setError(null);
    setIsLoading(true);
    try {
      const clockInAt = localInputToIso(editClockInAt, timeZone);
      if (!clockInAt) throw new Error('Clock-in time is required.');
      await attendanceApi.adjust(editingRecord.id, {
        clockInAt,
        clockOutAt: localInputToIso(editClockOutAt, timeZone),
        reason: editReason,
      });
      setEditingRecord(null);
      setRefreshKey(current => current + 1);
    } catch (saveError) {
      setIsLoading(false);
      setError(saveError instanceof Error ? saveError.message : 'Unable to correct the attendance record.');
    } finally {
      setIsSavingCorrection(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {isAdmin ? 'Attendance' : 'My Attendance'}
          </h2>
          <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            {isAdmin ? 'Review employee clock-in and clock-out times.' : 'Record your work session separately from signing in to the app.'}
            {' '}Times shown in {timeZone}.
          </p>
        </div>
      </div>

      {error && <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: 'var(--danger)', background: 'var(--danger-bg)' }}>{error}</div>}
      {truncated && <div role="status" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: 'var(--warning-text)', background: 'var(--warning-bg)' }}>Showing the latest 500 records. Narrow the date range to view a smaller selection.</div>}

      {canClock && (
        <section className="card" style={{ padding: '24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', display: 'grid', placeItems: 'center', borderRadius: '14px', color: activeRecord ? 'var(--success)' : 'var(--primary)', background: activeRecord ? 'var(--success-bg)' : 'var(--primary-light)' }}>
              <Clock3 size={23} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {activeRecord ? 'You are clocked in' : 'No active work session'}
              </div>
              <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {activeRecord
                  ? `Started at ${formatTime(activeRecord.clockInAt, timeZone)} · ${now ? `${formatDuration(activeRecord.clockInAt, null, now)} elapsed` : 'calculating duration…'}`
                  : 'Clock in when you begin work and clock out when you finish.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`btn ${activeRecord ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => void updateClock(activeRecord ? 'out' : 'in')}
            disabled={isClockActionPending}
          >
            {activeRecord ? <LogOut size={16} /> : <LogIn size={16} />}
            {isClockActionPending ? 'Saving…' : activeRecord ? 'Clock out' : 'Clock in'}
          </button>
          {activeRecord && isBeforeToday(activeRecord.clockInAt, todayDate, timeZone) && (
            <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', color: 'var(--danger)', background: 'var(--danger-bg)', fontSize: '12px' }}>
              <AlertCircle size={16} /> This session started on an earlier day and has no clock-out. Please clock out or contact HR to correct it.
            </div>
          )}
        </section>
      )}

      <section className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <form onSubmit={submitFilters} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: '12px' }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">From date</span>
            <input required type="date" className="form-control" value={startDate} onChange={event => {
              setStartDate(event.target.value);
              setFollowsToday(false);
            }} />
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">To date</span>
            <input required type="date" className="form-control" value={endDate} onChange={event => {
              setEndDate(event.target.value);
              setFollowsToday(false);
            }} />
          </label>
          {isAdmin && (
            <label className="form-group" style={{ minWidth: '220px', margin: 0 }}>
              <span className="form-label">Employee</span>
              <select className="form-control" value={selectedEmployeeId} onChange={event => selectEmployee(event.target.value)}>
                <option value="">All employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} · {employee.employeeCode}</option>
                ))}
              </select>
            </label>
          )}
          <button className="btn btn-secondary" type="submit" disabled={isLoading}>
            <CalendarCheck size={16} /> {isLoading ? 'Updating…' : 'Apply filters'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={showToday} disabled={!todayDate || (followsToday && startDate === todayDate && endDate === todayDate)}>
            Today
          </button>
          <span style={{ flexBasis: '100%', color: 'var(--text-muted)', fontSize: '11px' }}>
            Employee selection updates the list immediately. Choose a date range and select Apply filters; Today resets the range and follows the current company date automatically.
          </span>
        </form>
      </section>

      {isLoading ? <SectionSkeleton rows={5} /> : records.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No attendance records found for the selected dates.
        </div>
      ) : (
        <section className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--bg-canvas)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                  {['Employee', 'Date', 'Clock in', 'Clock out', 'Duration', 'Status', ...(isAdmin ? ['Actions'] : [])].map(label => (
                    <th key={label} style={{ padding: '13px 15px', fontWeight: 700 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const date = companyDateTimeInput(record.clockInAt, timeZone).slice(0, 10);
                  return (
                    <React.Fragment key={record.id}>
                      <tr style={{ borderTop: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '13px' }}>
                        <td style={{ padding: '14px 15px' }}>
                          <strong>{record.employeeName}</strong>
                          {isAdmin && <span style={{ display: 'block', marginTop: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>{record.department} · #{record.employeeCode}</span>}
                          {describeCorrections(record, timeZone)}
                        </td>
                        <td style={{ padding: '14px 15px', whiteSpace: 'nowrap' }}>{date}</td>
                        <td style={{ padding: '14px 15px', whiteSpace: 'nowrap' }}>{formatTime(record.clockInAt, timeZone)}</td>
                        <td style={{ padding: '14px 15px', whiteSpace: 'nowrap' }}>{formatTime(record.clockOutAt, timeZone)}</td>
                        <td style={{ padding: '14px 15px', whiteSpace: 'nowrap' }}>{formatDuration(record.clockInAt, record.clockOutAt, now)}</td>
                        <td style={{ padding: '14px 15px' }}>
                          <span className={`badge ${record.clockOutAt ? 'badge-success' : 'badge-warning'}`}>
                            {record.clockOutAt ? 'Complete' : 'Needs clock-out'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '14px 15px' }}>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => beginCorrection(record)}>Correct</button>
                          </td>
                        )}
                      </tr>
                      {isAdmin && editingRecord?.id === record.id && (
                        <tr>
                          <td colSpan={7} style={{ padding: '14px', background: 'var(--bg-canvas)' }}>
                            <form onSubmit={event => void saveCorrection(event)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                              <label className="form-group" style={{ margin: 0 }}>
                                <span className="form-label">Clock in ({timeZone})</span>
                                <input required type="datetime-local" className="form-control" value={editClockInAt} onChange={event => setEditClockInAt(event.target.value)} />
                              </label>
                              <label className="form-group" style={{ margin: 0 }}>
                                <span className="form-label">Clock out ({timeZone})</span>
                                <input type="datetime-local" className="form-control" value={editClockOutAt} onChange={event => setEditClockOutAt(event.target.value)} />
                              </label>
                              <label className="form-group" style={{ margin: 0 }}>
                                <span className="form-label">Reason for correction *</span>
                                <input required maxLength={1000} className="form-control" value={editReason} onChange={event => setEditReason(event.target.value)} placeholder="e.g. Employee forgot to clock out" />
                              </label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-primary btn-sm" type="submit" disabled={isSavingCorrection}>
                                  <Save size={14} /> {isSavingCorrection ? 'Saving…' : 'Save correction'}
                                </button>
                                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditingRecord(null)} disabled={isSavingCorrection}>
                                  <X size={14} /> Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 15px', borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '11px' }}>
            Open sessions are not treated as complete. HR corrections require a reason and are retained in the audit history.
          </div>
        </section>
      )}
      {!canClock && !isAdmin && (
        <p style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-muted)', fontSize: '12px' }}>
          <CheckCircle2 size={15} /> Attendance clocking requires an employee profile linked to your account.
        </p>
      )}
    </div>
  );
};
