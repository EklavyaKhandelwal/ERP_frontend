import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Plus, Send, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SectionSkeleton } from '../../components/feedback/LoadingSkeleton';
import type { Timesheet, TimesheetEntry, TimesheetStatus } from '../../types/erp';

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
  dailyDescriptions: TimesheetEntry['dailyDescriptions'];
  hours: TimesheetEntry['hours'];
};

type WeeklySummary = Pick<Timesheet, 'workCompleted' | 'nextWeekFocus' | 'blockers'>;

function emptyDailyDescriptions(): TimesheetEntry['dailyDescriptions'] {
  return { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' };
}

function emptySummary(): WeeklySummary {
  return { workCompleted: '', nextWeekFocus: '', blockers: '' };
}

function safeExportText(value: string): string {
  return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

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

function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = shiftDate(weekStart, 6);
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(startYear !== endYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${startLabel} – ${endLabel}`;
}

export const TimesheetsView: React.FC = () => {
  const {
    timesheets,
    timesheetsLoading,
    timesheetsError,
    projects,
    projectsLoading,
    employees,
    employeesLoading,
    role,
    currentUser,
    saveTimesheet,
    reviewTimesheet,
  } = useERP();
  const viewMode = role === 'admin' ? 'approval' : 'weekly';
  const [currentWeekStart] = useState(() => mondayOf(new Date()));
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [draftState, setDraftState] = useState<{ weekStart: string; rows: DraftRow[] } | null>(null);
  const [draftSummary, setDraftSummary] = useState<{ weekStart: string; summary: WeeklySummary } | null>(null);
  const [reviewWeek, setReviewWeek] = useState('');
  const [reviewDateFrom, setReviewDateFrom] = useState('');
  const [reviewDateTo, setReviewDateTo] = useState('');
  const [reviewEmployee, setReviewEmployee] = useState('');
  const [reviewProject, setReviewProject] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'All' | TimesheetStatus>('All');
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingSheetId, setReviewingSheetId] = useState<string | null>(null);
  const [exportingReport, setExportingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState<'Draft' | 'Submitted' | null>(null);

  const ownEmployee = employees.find(employee => employee.email === currentUser.email);
  const myTimesheet = timesheets.find(sheet => sheet.employeeId === ownEmployee?.id && sheet.weekStart === weekStart);
  const canEdit = !myTimesheet || myTimesheet.status === 'Draft' || myTimesheet.status === 'Rejected';
  const initialRows = useMemo(() => myTimesheet
    ? myTimesheet.entries.map(entry => ({
      key: entry.id,
      projectId: entry.projectId,
      taskDescription: entry.taskDescription,
      dailyDescriptions: { ...entry.dailyDescriptions },
      hours: { ...entry.hours },
    }))
    : projects[0]
      ? [{
        key: crypto.randomUUID(),
        projectId: projects[0].id,
        taskDescription: '',
        dailyDescriptions: emptyDailyDescriptions(),
        hours: zeroHours(),
      }]
      : [], [myTimesheet, projects]);
  const rows = draftState?.weekStart === weekStart ? draftState.rows : initialRows;
  const summary = draftSummary?.weekStart === weekStart
    ? draftSummary.summary
    : myTimesheet
      ? {
        workCompleted: myTimesheet.workCompleted,
        nextWeekFocus: myTimesheet.nextWeekFocus,
        blockers: myTimesheet.blockers,
      }
      : emptySummary();
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
      dailyDescriptions: emptyDailyDescriptions(),
      hours: zeroHours(),
    }]);
  };

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    setError(null);
    if (rows.length === 0) {
      setError('Add at least one project or task entry before saving this timesheet.');
      return;
    }
    if (status === 'Submitted') {
      if (!summary.workCompleted.trim()) {
        setError('Describe the work completed this week before submitting.');
        return;
      }
      if (!summary.nextWeekFocus.trim()) {
        setError('Describe next week’s focus before submitting.');
        return;
      }
      const missingDay = weekdays.find(day => rows.some(row => (
        row.hours[day.key] > 0 && !row.dailyDescriptions[day.key].trim()
      )));
      if (missingDay) {
        setError(`Add a work description for every project with hours on ${missingDay.label}.`);
        return;
      }
      const overLimitDay = weekdays.find(day => rows.reduce((total, row) => total + row.hours[day.key], 0) > 24);
      if (overLimitDay) {
        setError(`Logged hours cannot exceed 24 hours on ${overLimitDay.label}.`);
        return;
      }
    }
    setSubmittingStatus(status);
    try {
      const entries = rows.map(({ projectId, taskDescription, dailyDescriptions, hours }) => ({
        projectId,
        taskDescription: taskDescription.trim()
          || projects.find(project => project.id === projectId)?.name
          || 'Project work',
        dailyDescriptions,
        hours,
      }));
      const saved = await saveTimesheet(weekStart, status, entries, summary);
      setDraftState({
        weekStart,
        rows: saved.entries.map(entry => ({
          key: entry.id,
          projectId: entry.projectId,
          taskDescription: entry.taskDescription,
          dailyDescriptions: { ...entry.dailyDescriptions },
          hours: { ...entry.hours },
        })),
      });
      setDraftSummary({
        weekStart,
        summary: {
          workCompleted: saved.workCompleted,
          nextWeekFocus: saved.nextWeekFocus,
          blockers: saved.blockers,
        },
      });
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save timesheet.');
    } finally {
      setSubmittingStatus(null);
    }
  };

  const handleReview = async (sheet: Timesheet, status: 'Approved' | 'Rejected') => {
    setError(null);
    if (status === 'Rejected' && !reviewNote.trim()) {
      setSelectedSheetId(sheet.id);
      setError('Add a review note before returning this report.');
      return;
    }
    setReviewingSheetId(sheet.id);
    try {
      await reviewTimesheet(sheet.id, status, reviewNote);
      setReviewNote('');
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review timesheet.');
    } finally {
      setReviewingSheetId(null);
    }
  };

  const isCustomDateRange = reviewWeek === '__custom__';
  const customDateRangeIsValid = !isCustomDateRange
    || (Boolean(reviewDateFrom) && Boolean(reviewDateTo) && reviewDateFrom <= reviewDateTo);
  const filteredByOtherCriteria = timesheets.filter(sheet => (
    (isCustomDateRange
      ? customDateRangeIsValid && sheet.weekStart <= reviewDateTo && sheet.weekEnd >= reviewDateFrom
      : (!reviewWeek || sheet.weekStart === reviewWeek))
    && (!reviewEmployee || sheet.employeeId === reviewEmployee)
    && (!reviewProject || sheet.entries.some(entry => entry.projectId === reviewProject))
  ));
  const statusCounts = filteredByOtherCriteria.reduce<Record<'All' | TimesheetStatus, number>>((counts, sheet) => {
    counts.All += 1;
    counts[sheet.status] += 1;
    return counts;
  }, { All: 0, Draft: 0, Submitted: 0, Approved: 0, Rejected: 0 });
  const filteredTimesheets = filteredByOtherCriteria.filter(sheet => (
    reviewStatus === 'All' || sheet.status === reviewStatus
  ));
  const availableWeeks = [...new Set(timesheets.map(sheet => sheet.weekStart))].sort().reverse();
  const employeeOptions = [...new Map([
    ...employees
      .filter(employee => employee.accountStatus !== 'Admin account')
      .map(employee => [employee.id, {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        department: employee.department,
      }] as const),
    ...timesheets.map(sheet => [sheet.employeeId, {
      id: sheet.employeeId,
      name: sheet.employeeName,
      department: sheet.department,
    }] as const),
  ]).values()].sort((first, second) => first.name.localeCompare(second.name));
  const clearReviewFilters = () => {
    setReviewWeek('');
    setReviewDateFrom('');
    setReviewDateTo('');
    setReviewEmployee('');
    setReviewProject('');
    setReviewStatus('All');
  };
  const entriesForReport = (sheet: Timesheet) => reviewProject
    ? sheet.entries.filter(entry => entry.projectId === reviewProject)
    : sheet.entries;
  const hoursForReport = (sheet: Timesheet) => entriesForReport(sheet)
    .reduce((sum, entry) => sum + Object.values(entry.hours).reduce((entrySum, hours) => entrySum + hours, 0), 0);

  const downloadWeeklyReport = async () => {
    setExportingReport(true);
    setError(null);
    try {
      const XLSX = await import('@e965/xlsx');
      const filterDescription = [
        isCustomDateRange
          ? `Custom dates: ${reviewDateFrom} to ${reviewDateTo}`
          : reviewWeek ? `Week: ${formatWeekRange(reviewWeek)}` : 'Week: All',
        reviewEmployee
          ? `Employee: ${employees.find(employee => employee.id === reviewEmployee)?.firstName ?? ''} ${employees.find(employee => employee.id === reviewEmployee)?.lastName ?? ''}`.trim()
          : 'Employee: All',
        reviewProject
          ? `Project: ${projects.find(project => project.id === reviewProject)?.name ?? ''}`
          : 'Project: All',
        `Status: ${reviewStatus}`,
      ];
      const totalReportHours = filteredTimesheets.reduce((sum, sheet) => sum + hoursForReport(sheet), 0);
      const overviewRows = [
        ['WEEKLY EMPLOYEE WORK REPORT'],
        ['Generated', new Date().toLocaleString()],
        ['Filters', filterDescription.join(' | ')],
        [],
        ['Reports included', filteredTimesheets.length],
        ['Total hours', totalReportHours],
        ['Awaiting review', filteredTimesheets.filter(sheet => sheet.status === 'Submitted').length],
        ['Approved', filteredTimesheets.filter(sheet => sheet.status === 'Approved').length],
        ['Returned', filteredTimesheets.filter(sheet => sheet.status === 'Rejected').length],
        [],
        ['Workbook guide'],
        ['Weekly Summary', 'One row per employee report, with outcomes, next steps, blockers, and review status.'],
        ['Project Breakdown', 'One row per project/task entry, including daily work descriptions and hours.'],
        ['Daily Details', 'One row per day with logged hours, for filtering and payroll cross-checks.'],
      ];
      const summaryRows = [
        ['Employee', 'Department', 'Week start', 'Week end', 'Submitted on', 'Status', 'Total hours', 'Work completed', 'Next week focus', 'Blockers', 'Reviewed by', 'Review note'],
        ...filteredTimesheets.map(sheet => [
          safeExportText(sheet.employeeName),
          safeExportText(sheet.department),
          safeExportText(sheet.weekStart),
          safeExportText(sheet.weekEnd),
          safeExportText(sheet.submittedOn ?? ''),
          safeExportText(sheet.status),
          hoursForReport(sheet),
          safeExportText(sheet.workCompleted),
          safeExportText(sheet.nextWeekFocus),
          safeExportText(sheet.blockers),
          safeExportText(sheet.reviewedBy ?? ''),
          safeExportText(sheet.reviewNote ?? ''),
        ]),
      ];
      const projectRows = [
        ['Employee', 'Department', 'Week start', 'Project', 'Task / work area', 'Total task hours', 'Daily work and hours'],
        ...filteredTimesheets.flatMap(sheet => entriesForReport(sheet).map(entry => [
          safeExportText(sheet.employeeName),
          safeExportText(sheet.department),
          safeExportText(sheet.weekStart),
          safeExportText(entry.projectName),
          safeExportText(entry.taskDescription),
          Object.values(entry.hours).reduce((sum, hours) => sum + hours, 0),
          safeExportText(weekdays
            .filter(day => entry.hours[day.key] > 0)
            .map(day => `${day.label} (${entry.hours[day.key]}h): ${entry.dailyDescriptions[day.key] || 'Legacy report'}`)
            .join(' | ')),
        ])),
      ];
      const detailRows = [
        ['Employee', 'Department', 'Week start', 'Date', 'Day', 'Project', 'Task / work area', 'Daily work description', 'Hours', 'Status'],
        ...filteredTimesheets.flatMap(sheet => entriesForReport(sheet).flatMap(entry => weekdays.flatMap((day, index) => {
          const hours = entry.hours[day.key];
          if (!hours) return [];
          return [[
            safeExportText(sheet.employeeName),
            safeExportText(sheet.department),
            safeExportText(sheet.weekStart),
            safeExportText(shiftDate(sheet.weekStart, index).toISOString().slice(0, 10)),
            safeExportText(day.label),
            safeExportText(entry.projectName),
            safeExportText(entry.taskDescription),
            safeExportText(entry.dailyDescriptions[day.key]),
            hours,
            safeExportText(sheet.status),
          ]];
        }))),
      ];
      const workbook = XLSX.utils.book_new();
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
      overviewSheet['!cols'] = [{ wch: 26 }, { wch: 88 }];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet['!cols'] = [
        { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
        { wch: 12 }, { wch: 52 }, { wch: 52 }, { wch: 42 }, { wch: 24 }, { wch: 42 },
      ];
      const projectSheet = XLSX.utils.aoa_to_sheet(projectRows);
      projectSheet['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 32 }, { wch: 38 }, { wch: 16 }, { wch: 90 }];
      const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
      detailSheet['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 32 }, { wch: 38 }, { wch: 72 }, { wch: 10 }, { wch: 14 }];
      for (const [sheet, rows] of [[summarySheet, summaryRows], [projectSheet, projectRows], [detailSheet, detailRows]] as const) {
        if (rows.length > 1) {
          const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
          sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: range.e.r, c: range.e.c } }) };
        }
      }
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Weekly Summary');
      XLSX.utils.book_append_sheet(workbook, projectSheet, 'Project Breakdown');
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Daily Details');
      const filenameSuffix = isCustomDateRange
        ? `-${reviewDateFrom}-to-${reviewDateTo}`
        : reviewWeek ? `-${reviewWeek}` : '';
      XLSX.writeFile(workbook, `weekly-work-reports${filenameSuffix}.xlsx`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Unable to create the weekly report workbook.');
    } finally {
      setExportingReport(false);
    }
  };

  return (
    <div className="timesheet-page">
      <div className="timesheet-page-heading">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            {role === 'admin' ? 'Weekly Work Reports' : 'Weekly Timesheet'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {role === 'admin'
              ? 'Review employee hours, daily work, weekly summaries, and blockers.'
              : 'Log hours with a description for each day, then add your weekly summary for HR.'}
          </p>
        </div>
      </div>

      {(error || timesheetsError) && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {error ?? timesheetsError}
        </div>
      )}

      {role === 'admin' || viewMode === 'approval' ? (
        <section className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Weekly Work Reports</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>Review daily work, hours, blockers, and weekly plans.</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void downloadWeeklyReport()} disabled={filteredTimesheets.length === 0 || exportingReport}>
              {exportingReport ? 'Preparing Excel…' : 'Download Excel'}
            </button>
          </div>
          <div className="timesheet-review-filters">
            <label className="form-group timesheet-review-filter" style={{ margin: 0 }}>
              <span className="form-label">Week ({availableWeeks.length} with reports)</span>
              <select className="form-control" value={reviewWeek} onChange={event => setReviewWeek(event.target.value)}>
                <option value="">All weeks</option>
                {availableWeeks.map(week => (
                  <option value={week} key={week}>{formatWeekRange(week)}</option>
                ))}
                <option value="__custom__">Custom date range…</option>
              </select>
            </label>
            <label className="form-group timesheet-review-filter" style={{ margin: 0 }}>
              <span className="form-label">Employee</span>
              <select className="form-control timesheet-review-employee" value={reviewEmployee} onChange={event => setReviewEmployee(event.target.value)}>
                <option value="">All employees</option>
                {employeeOptions.map(employee => (
                  <option value={employee.id} key={employee.id}>
                    {employee.name}{employee.department ? ` · ${employee.department}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group timesheet-review-filter" style={{ margin: 0 }}>
              <span className="form-label">Project</span>
              <select className="form-control" value={reviewProject} onChange={event => setReviewProject(event.target.value)}>
                <option value="">All projects</option>
                {projects.map(project => <option value={project.id} key={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="form-group timesheet-review-filter" style={{ margin: 0 }}>
              <span className="form-label">Status</span>
              <select className="form-control" value={reviewStatus} onChange={event => {
                const status = event.target.value;
                if (status === 'All' || status === 'Draft' || status === 'Submitted' || status === 'Approved' || status === 'Rejected') {
                  setReviewStatus(status);
                }
              }}>
                <option value="All">All statuses ({statusCounts.All})</option>
                <option value="Submitted">Submitted · Awaiting review ({statusCounts.Submitted})</option>
                <option value="Approved">Approved ({statusCounts.Approved})</option>
                <option value="Rejected">Returned ({statusCounts.Rejected})</option>
                <option value="Draft">Draft ({statusCounts.Draft})</option>
              </select>
            </label>
            <button type="button" className="btn btn-secondary btn-sm timesheet-review-clear" onClick={clearReviewFilters}
              disabled={!reviewWeek && !reviewEmployee && !reviewProject && reviewStatus === 'All' && !reviewDateFrom && !reviewDateTo}>
              Clear filters
            </button>
          </div>
          {isCustomDateRange && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: '10px', marginBottom: '18px', padding: '14px', border: '1px solid var(--border-light)', borderRadius: '10px', background: 'var(--bg-hover)' }}>
              <label className="form-group" style={{ width: 'min(100%, 220px)', margin: 0 }}>
                <span className="form-label">From date</span>
                <input className="form-control" type="date" value={reviewDateFrom} max={reviewDateTo || undefined} onChange={event => setReviewDateFrom(event.target.value)} />
              </label>
              <label className="form-group" style={{ width: 'min(100%, 220px)', margin: 0 }}>
                <span className="form-label">To date</span>
                <input className="form-control" type="date" value={reviewDateTo} min={reviewDateFrom || undefined} onChange={event => setReviewDateTo(event.target.value)} />
              </label>
              <span style={{ flex: '1 1 260px', paddingBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                Reports are included when their Monday–Sunday week overlaps these dates.
              </span>
              {!customDateRangeIsValid && (
                <span role="alert" style={{ flexBasis: '100%', color: 'var(--danger)', fontSize: '12px' }}>
                  Choose both dates and make sure the start date is on or before the end date.
                </span>
              )}
            </div>
          )}
          {!timesheetsLoading && (
            <div className="timesheet-review-result-count" role="status">
              Showing <strong>{filteredTimesheets.length}</strong> of {timesheets.length} reports
              {' · '}
              <strong>{filteredTimesheets.reduce((sum, sheet) => sum + hoursForReport(sheet), 0).toFixed(1)} hours</strong>
            </div>
          )}
          {timesheetsLoading ? (
            <SectionSkeleton rows={3} />
          ) : filteredTimesheets.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No weekly reports match these filters.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTimesheets.map(sheet => {
                const isSelected = selectedSheetId === sheet.id;
                const visibleEntries = entriesForReport(sheet);
                const sheetHours = hoursForReport(sheet);
                return (
                  <article key={sheet.id} style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-light)', boxShadow: '0 2px 8px rgba(16, 24, 40, 0.04)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={sheet.employeeAvatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span>
                          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-main)' }}>{sheet.employeeName}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sheet.department} · {formatWeekRange(sheet.weekStart)}</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <strong>{sheetHours.toFixed(1)} hrs</strong>
                        <span className={`badge ${sheet.status === 'Approved' ? 'badge-success' : sheet.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{sheet.status}</span>
                        {sheet.status === 'Submitted' && (
                          <>
                            <button type="button" disabled={reviewingSheetId === sheet.id} onClick={() => void handleReview(sheet, 'Approved')} className="btn btn-sm" style={{ backgroundColor: '#E3F6EC', color: '#05B169', border: '1px solid #A3E6C5' }}>
                              <Check size={14} /> Approve
                            </button>
                            <button type="button" disabled={reviewingSheetId === sheet.id} onClick={() => void handleReview(sheet, 'Rejected')} className="btn btn-sm" style={{ backgroundColor: '#FEECEE', color: '#CF202F', border: '1px solid #F7BAC0' }}>
                              <X size={14} /> Return
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {visibleEntries.length > 0 ? visibleEntries.map(entry => {
                        const taskHours = Object.values(entry.hours).reduce((sum, hours) => sum + hours, 0);
                        return (
                          <div key={entry.id} style={{ padding: '12px', borderRadius: '9px', background: '#F8FAFC', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div>
                                <strong style={{ color: 'var(--text-main)' }}>{entry.projectName}</strong>
                                <div style={{ marginTop: '3px', fontSize: '12px', color: 'var(--text-secondary)' }}>{entry.taskDescription || 'Task not specified'}</div>
                              </div>
                              <strong style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{taskHours.toFixed(1)}h</strong>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '42px 78px 42px minmax(0, 1fr)', gap: '6px 8px', alignItems: 'start', marginTop: '10px', paddingTop: '9px', borderTop: '1px solid var(--border-light)' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Day</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hours</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Work done</span>
                              {weekdays.flatMap((day, index) => entry.hours[day.key] > 0 ? (
                                <React.Fragment key={day.key}>
                                  <span style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{day.label}</span>
                                  <span style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(shiftDate(sheet.weekStart, index))}</span>
                                  <span style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{entry.hours[day.key]}h</span>
                                  <span style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{entry.dailyDescriptions[day.key] || 'Legacy report — no daily description provided'}</span>
                                </React.Fragment>
                              ) : [])}
                            </div>
                          </div>
                        );
                      }) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No project/task entries were recorded.</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {visibleEntries.length} project/task {visibleEntries.length === 1 ? 'entry' : 'entries'} · {sheetHours.toFixed(1)} total hours
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-expanded={isSelected}
                        onClick={() => {
                          setSelectedSheetId(isSelected ? null : sheet.id);
                          setReviewNote('');
                        }}
                      >
                        {isSelected ? 'Hide weekly details' : 'View weekly summary & full daily details'}
                      </button>
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          <div><strong>Work completed</strong><p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{sheet.workCompleted || 'Not provided'}</p></div>
                          <div><strong>Next week’s focus</strong><p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{sheet.nextWeekFocus || 'Not provided'}</p></div>
                          <div><strong>Blockers</strong><p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{sheet.blockers || 'None reported'}</p></div>
                        </div>
                        <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                          <table className="erp-table">
                            <thead><tr><th>Date</th><th>Project</th><th>Task / work area</th><th>Daily work description</th><th>Hours</th></tr></thead>
                            <tbody>
                              {visibleEntries.flatMap(entry => weekdays.flatMap((day, index) => entry.hours[day.key] > 0 ? (
                                <tr key={`${entry.id}-${day.key}`}>
                                  <td>{shiftDate(sheet.weekStart, index).toISOString().slice(0, 10)}</td>
                                  <td>{entry.projectName}</td>
                                  <td>{entry.taskDescription}</td>
                                  <td>{entry.dailyDescriptions[day.key] || 'Legacy report'}</td>
                                  <td>{entry.hours[day.key].toFixed(1)}</td>
                                </tr>
                              ) : []))}
                            </tbody>
                          </table>
                        </div>
                        {sheet.reviewNote && <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)' }}>Review note: {sheet.reviewNote}</p>}
                        {sheet.status === 'Submitted' && (
                          <label className="form-group" style={{ display: 'block', maxWidth: '560px', margin: '12px 0 0' }}>
                            <span className="form-label">Review note (required when returning)</span>
                            <textarea className="form-control" maxLength={2000} rows={2} value={reviewNote} onChange={event => setReviewNote(event.target.value)} />
                          </label>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : employeesLoading || timesheetsLoading || projectsLoading ? (
        <SectionSkeleton rows={5} />
      ) : !ownEmployee ? (
        <section className="card timesheet-profile-notice" role="status">
          <div className="timesheet-profile-notice-icon"><AlertCircle size={21} aria-hidden="true" /></div>
          <div>
            <h3>Employee profile not linked</h3>
            <p>Your timesheet cannot be connected to an employee record yet. Please contact HR or an administrator to link your account, then reload this page.</p>
          </div>
        </section>
      ) : (
        <>
          <div className="card timesheet-week-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-sm btn-secondary" aria-label="Previous week" onClick={() => setWeekStart(shiftDate(weekStart, -7).toISOString().slice(0, 10))}>
                <ChevronLeft size={14} />
              </button>
              <strong className="timesheet-week-label">{formatDate(new Date(`${weekStart}T00:00:00.000Z`))} — {formatDate(shiftDate(weekStart, 6))}, {weekStart.slice(0, 4)}</strong>
              <button className="btn btn-sm btn-secondary" aria-label="Next week" disabled={weekStart >= currentWeekStart} onClick={() => setWeekStart(shiftDate(weekStart, 7).toISOString().slice(0, 10))}>
                <ChevronRight size={14} />
              </button>
              {myTimesheet && <span className={`badge ${myTimesheet.status === 'Approved' ? 'badge-success' : myTimesheet.status === 'Rejected' ? 'badge-danger' : myTimesheet.status === 'Submitted' ? 'badge-warning' : 'badge-neutral'}`}>{myTimesheet.status}</span>}
            </div>
            <div className="timesheet-week-actions">
              <span className="timesheet-total-hours">Week total <strong>{totalHours.toFixed(1)} hrs</strong></span>
              {canEdit && (
                <>
                  <button disabled={submittingStatus !== null || projects.length === 0} className="btn btn-secondary btn-sm" onClick={() => void handleSave('Draft')}>
                    {submittingStatus === 'Draft' ? 'Saving draft…' : 'Save draft'}
                  </button>
                  <button disabled={submittingStatus !== null || projects.length === 0} className="btn btn-primary btn-sm" onClick={() => void handleSave('Submitted')}>
                    <Send size={14} /> {submittingStatus === 'Submitted' ? 'Submitting…' : 'Submit week'}
                  </button>
                </>
              )}
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active projects are assigned to you. Ask an administrator to add you to a project team.
            </div>
          ) : (
            <div className="timesheet-entry-list">
              <div className="timesheet-entry-list-inner">
                {rows.map(row => {
                  const rowHours = Object.values(row.hours).reduce((sum, hours) => sum + hours, 0);
                  return (
                    <section key={row.key} className="card timesheet-entry-card">
                      <div className="timesheet-entry-header">
                        <label className="form-group" style={{ margin: 0 }}>
                          <span className="form-label">Project</span>
                          <select
                            className="form-control"
                            disabled={!canEdit}
                            value={row.projectId}
                            onChange={event => updateRow(row.key, { projectId: event.target.value })}
                          >
                            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                          </select>
                        </label>
                        <label className="form-group" style={{ margin: 0 }}>
                          <span className="form-label">Task / work area</span>
                          <input
                            className="form-control"
                            placeholder="Task / work area"
                            maxLength={500}
                            disabled={!canEdit}
                            value={row.taskDescription}
                            onChange={event => updateRow(row.key, { taskDescription: event.target.value })}
                          />
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Task total</span>
                          <strong style={{ fontSize: '16px', color: '#0052FF' }}>{rowHours.toFixed(1)}h</strong>
                          {canEdit && (
                            <button className="btn btn-secondary btn-sm" aria-label="Remove entry" onClick={() => updateRows(current => current.filter(item => item.key !== row.key))}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="timesheet-day-grid">
                        {dayHeaders.map(day => (
                          <div key={day.key} className={`timesheet-day-card${row.hours[day.key] > 0 && !row.dailyDescriptions[day.key].trim() ? ' needs-description' : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '13px' }}>{day.label}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{day.date}</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              aria-label={`${day.label} hours`}
                              disabled={!canEdit}
                              value={row.hours[day.key] || ''}
                              onChange={event => updateRow(row.key, {
                                hours: { ...row.hours, [day.key]: Number(event.target.value) || 0 },
                              })}
                              className="form-control"
                              style={{ height: '38px', fontWeight: '600' }}
                            />
                            <textarea
                              className="form-control timesheet-day-description"
                              aria-label={`${day.label} work description`}
                              aria-required={row.hours[day.key] > 0}
                              placeholder={row.hours[day.key] > 0 ? 'Describe work done (required)' : 'Daily work (if hours logged)'}
                              maxLength={500}
                              rows={3}
                              disabled={!canEdit}
                              value={row.dailyDescriptions[day.key]}
                              onChange={event => updateRow(row.key, {
                                dailyDescriptions: { ...row.dailyDescriptions, [day.key]: event.target.value },
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
                <div className="timesheet-week-totals">
                  {canEdit && <button className="btn btn-secondary btn-sm" onClick={addRow}><Plus size={14} /> Add project task</button>}
                  {!canEdit && <strong>Weekly totals</strong>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px' }}>
                    {dayHeaders.map(day => {
                      const total = rows.reduce((sum, row) => sum + row.hours[day.key], 0);
                      return <span key={day.key} style={{ fontSize: '12px', color: total > 24 ? '#CF202F' : 'var(--text-secondary)' }}>{day.label}: <strong>{total.toFixed(1)}h</strong></span>;
                    })}
                    <span style={{ color: '#0052FF' }}>Week: <strong>{totalHours.toFixed(1)}h</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            For each project/day where you log hours, describe the task you worked on that day before submitting.
          </p>
          <section className="card timesheet-summary-card">
            <div className="timesheet-summary-heading">
              <div>
                <h3>Weekly summary</h3>
                <p>Wrap up your work and let HR know what comes next.</p>
              </div>
              <span className="timesheet-summary-required">Required to submit</span>
            </div>
            <div className="timesheet-summary-fields">
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">Work completed this week <span aria-hidden="true">*</span></span>
                <textarea className="form-control" rows={4} maxLength={5000} disabled={!canEdit} value={summary.workCompleted}
                  onChange={event => setDraftSummary({ weekStart, summary: { ...summary, workCompleted: event.target.value } })}
                  placeholder="Summarize your completed work..." />
                <span className="timesheet-character-count">{summary.workCompleted.length}/5000</span>
              </label>
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">Focus for next week <span aria-hidden="true">*</span></span>
                <textarea className="form-control" rows={4} maxLength={5000} disabled={!canEdit} value={summary.nextWeekFocus}
                  onChange={event => setDraftSummary({ weekStart, summary: { ...summary, nextWeekFocus: event.target.value } })}
                  placeholder="Describe your planned priorities..." />
                <span className="timesheet-character-count">{summary.nextWeekFocus.length}/5000</span>
              </label>
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">Blockers <span className="timesheet-optional">(optional)</span></span>
                <textarea className="form-control" rows={4} maxLength={3000} disabled={!canEdit} value={summary.blockers}
                  onChange={event => setDraftSummary({ weekStart, summary: { ...summary, blockers: event.target.value } })}
                  placeholder="Mention blockers or support needed..." />
                <span className="timesheet-character-count">{summary.blockers.length}/3000</span>
              </label>
            </div>
          </section>
          {myTimesheet?.reviewNote && (
            <div className="timesheet-review-note">
              Reviewer note: {myTimesheet.reviewNote}
            </div>
          )}
        </>
      )}
    </div>
  );
};
