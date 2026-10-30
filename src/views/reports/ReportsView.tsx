import React, { useCallback, useMemo, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { formatINR } from '../../lib/formatCurrency';
import type { PayrollRecord, TimesheetEntry } from '../../types/erp';

type ReportType = 'daily' | 'weekly' | 'leave' | 'payroll';
type ReportRow = Array<string | number>;

const reportOptions: Array<{ id: ReportType; label: string }> = [
  { id: 'daily', label: 'Daily timesheets' },
  { id: 'weekly', label: 'Weekly summaries' },
  { id: 'leave', label: 'Leave' },
  { id: 'payroll', label: 'Payroll' },
];

const weekdays: Array<{ key: keyof TimesheetEntry['hours']; label: string }> = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function displayDate(date: string): string {
  if (!date) return '—';
  return new Date(`${date.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function escapeSpreadsheetText(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function payrollPeriod(record: PayrollRecord): { start: string; end: string; label: string } {
  const monthNumber = new Date(`${record.month} 1, ${record.year}`).getMonth() + 1;
  const start = `${record.year}-${String(monthNumber).padStart(2, '0')}-01`;
  const end = new Date(Date.UTC(record.year, monthNumber, 0)).toISOString().slice(0, 10);
  return {
    start,
    end,
    label: new Date(`${start}T00:00:00.000Z`).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  };
}

function overlapsRange(start: string, end: string, from: string, to: string): boolean {
  return (!from || end >= from) && (!to || start <= to);
}

function matchesPerson(
  employeeId: string,
  department: string,
  selectedEmployee: string,
  selectedDepartment: string,
): boolean {
  return (!selectedEmployee || employeeId === selectedEmployee)
    && (!selectedDepartment || department === selectedDepartment);
}

function makeRows(records: Array<Array<string | number>>): ReportRow[] {
  return records.map(row => row.map(value => (
    typeof value === 'string' ? escapeSpreadsheetText(value) : value
  )));
}

export const ReportsView: React.FC = () => {
  const {
    role,
    employees,
    employeesLoading,
    leaves,
    leavesLoading,
    leavesError,
    timesheets,
    timesheetsLoading,
    timesheetsError,
    payroll,
    payrollLoading,
    payrollError,
  } = useERP();

  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [projectName, setProjectName] = useState('');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const departments = useMemo(
    () => [...new Set(employees.map(employee => employee.department).filter(Boolean))].sort(),
    [employees],
  );
  const projectNames = useMemo(
    () => [...new Set(timesheets.flatMap(sheet => sheet.entries.map(entry => entry.projectName)).filter(Boolean))].sort(),
    [timesheets],
  );

  const validDateRange = !dateFrom || !dateTo || dateFrom <= dateTo;
  const personMatches = useCallback(
    (id: string, team: string) => matchesPerson(id, team, employeeId, department),
    [employeeId, department],
  );
  const statusMatches = useCallback(
    (recordStatus: string) => !status || recordStatus === status,
    [status],
  );

  const matchingTimesheets = useMemo(() => timesheets.filter(sheet => {
    const projectMatches = !projectName || sheet.entries.some(entry => entry.projectName === projectName);
    return personMatches(sheet.employeeId, sheet.department)
      && overlapsRange(sheet.weekStart, sheet.weekEnd, dateFrom, dateTo)
      && projectMatches
      && statusMatches(sheet.status);
  }), [timesheets, personMatches, dateFrom, dateTo, projectName, statusMatches]);

  const dailyRows = useMemo(() => matchingTimesheets.flatMap(sheet => sheet.entries.flatMap(entry => (
    weekdays.flatMap((day, index) => {
      const date = shiftDate(sheet.weekStart, index);
      const hours = entry.hours[day.key];
      if (hours <= 0 || (dateFrom && date < dateFrom) || (dateTo && date > dateTo)) return [];
      return [[
        date,
        sheet.employeeName,
        sheet.department,
        entry.projectName,
        entry.taskDescription,
        day.label,
        entry.dailyDescriptions[day.key] || entry.taskDescription,
        hours,
        sheet.status,
      ]];
    })
  ))), [matchingTimesheets, dateFrom, dateTo]);

  const weeklyRows = useMemo(() => matchingTimesheets.map(sheet => [
    displayDate(sheet.weekStart),
    displayDate(sheet.weekEnd),
    sheet.employeeName,
    sheet.department,
    sheet.totalHours,
    sheet.status,
    sheet.workCompleted,
    sheet.nextWeekFocus,
    sheet.blockers,
  ]), [matchingTimesheets]);

  const matchingLeaves = useMemo(() => leaves.filter(leave => (
    personMatches(leave.employeeId, leave.department)
    && overlapsRange(leave.startDate, leave.endDate, dateFrom, dateTo)
    && statusMatches(leave.status)
  )), [leaves, personMatches, dateFrom, dateTo, statusMatches]);

  const leaveRows = useMemo(() => matchingLeaves.map(leave => [
    leave.employeeName,
    leave.department,
    leave.leaveType,
    displayDate(leave.startDate),
    displayDate(leave.endDate),
    leave.days,
    leave.status,
    displayDate(leave.appliedOn),
    leave.reason,
  ]), [matchingLeaves]);

  const matchingPayroll = useMemo(() => payroll.filter(record => {
    const period = payrollPeriod(record);
    return personMatches(record.employeeId, record.department)
      && overlapsRange(period.start, period.end, dateFrom, dateTo)
      && statusMatches(record.status);
  }), [payroll, personMatches, dateFrom, dateTo, statusMatches]);

  const payrollRows = useMemo(() => matchingPayroll.map(record => [
    record.employeeName,
    record.employeeCode,
    record.department,
    payrollPeriod(record).label,
    record.totalEarnings,
    record.totalDeductions,
    record.netPay,
    record.status,
    record.paymentDate ? displayDate(record.paymentDate) : '—',
  ]), [matchingPayroll]);

  const columns = {
    daily: ['Date', 'Employee', 'Department', 'Project', 'Task', 'Day', 'Work description', 'Hours', 'Timesheet status'],
    weekly: ['Week starts', 'Week ends', 'Employee', 'Department', 'Total hours', 'Status', 'Work completed', 'Next week focus', 'Blockers'],
    leave: ['Employee', 'Department', 'Leave type', 'Start date', 'End date', 'Days', 'Status', 'Applied on', 'Reason'],
    payroll: ['Employee', 'Employee code', 'Department', 'Pay period', 'Earnings (INR)', 'Deductions (INR)', 'Net pay (INR)', 'Status', 'Payment date'],
  } satisfies Record<ReportType, string[]>;
  const rowsByType: Record<ReportType, ReportRow[]> = {
    daily: dailyRows,
    weekly: weeklyRows,
    leave: leaveRows,
    payroll: payrollRows,
  };
  const rows = rowsByType[reportType];
  const isTimesheetReport = reportType === 'daily' || reportType === 'weekly';
  const activeLoading = employeesLoading || (
    isTimesheetReport ? timesheetsLoading
      : reportType === 'leave' ? leavesLoading
        : payrollLoading
  );
  const activeError = isTimesheetReport ? timesheetsError
    : reportType === 'leave' ? leavesError
      : payrollError;
  const peopleCount = reportType === 'daily' || reportType === 'weekly'
    ? new Set(matchingTimesheets.map(sheet => sheet.employeeId)).size
    : reportType === 'leave'
      ? new Set(matchingLeaves.map(leave => leave.employeeId)).size
      : new Set(matchingPayroll.map(record => record.employeeId)).size;
  const volumeLabel = isTimesheetReport ? 'Reported hours'
    : reportType === 'leave' ? 'Leave days'
      : 'Net payroll';
  const volume = reportType === 'daily'
    ? dailyRows.reduce((total, row) => total + Number(row[7]), 0)
    : reportType === 'weekly'
      ? matchingTimesheets.reduce((total, sheet) => total + sheet.totalHours, 0)
      : reportType === 'leave'
        ? matchingLeaves.reduce((total, leave) => total + leave.days, 0)
        : matchingPayroll.reduce((total, record) => total + record.netPay, 0);

  const exportReport = async () => {
    if (role !== 'admin' || rows.length === 0 || !validDateRange) return;
    setExportError(null);
    setExporting(true);
    try {
      const XLSX = await import('@e965/xlsx');
      const workbook = XLSX.utils.book_new();
      const data = [
        [`${reportOptions.find(option => option.id === reportType)?.label ?? 'HR'} report`],
        [`Generated: ${new Date().toLocaleString('en-IN')}`],
        [`Date range: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`],
        [],
        columns[reportType],
        ...makeRows(rows),
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      worksheet['!cols'] = columns[reportType].map(column => ({ wch: Math.min(Math.max(column.length + 4, 14), 36) }));
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType === 'daily' ? 'Daily timesheets' : reportType === 'weekly' ? 'Weekly summaries' : reportType === 'leave' ? 'Leave' : 'Payroll');
      XLSX.writeFile(workbook, `hr-${reportType}-report.xlsx`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to export this report.');
    } finally {
      setExporting(false);
    }
  };

  if (role !== 'admin') {
    return <div style={{ padding: 32 }} role="alert">Reports are available to HR administrators only.</div>;
  }

  return (
    <div className="reports-page">
      <div className="reports-intro">
        <div>
          <h2>Workforce reports</h2>
          <p>Review and export existing timesheet, leave, and payroll records.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void exportReport()}
          disabled={exporting || rows.length === 0 || !validDateRange}
        >
          {exporting ? <FileSpreadsheet size={16} /> : <Download size={16} />}
          {exporting ? 'Preparing export…' : 'Export Excel'}
        </button>
      </div>

      <div className="reports-tabs" role="tablist" aria-label="Report type">
        {reportOptions.map(option => (
          <button
            type="button"
            role="tab"
            aria-selected={reportType === option.id}
            className={reportType === option.id ? 'reports-tab active' : 'reports-tab'}
            key={option.id}
            onClick={() => {
              setReportType(option.id);
              setStatus('');
              setProjectName('');
              setExportError(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="reports-filters card" aria-label="Report filters">
        <label>
          From
          <input type="date" className="form-control" value={dateFrom} max={dateTo || undefined} onChange={event => setDateFrom(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" className="form-control" value={dateTo} min={dateFrom || undefined} onChange={event => setDateTo(event.target.value)} />
        </label>
        <label>
          Department
          <select className="form-control" value={department} onChange={event => {
            setDepartment(event.target.value);
            setEmployeeId('');
          }}>
            <option value="">All departments</option>
            {departments.map(team => <option value={team} key={team}>{team}</option>)}
          </select>
        </label>
        <label>
          Employee
          <select className="form-control" value={employeeId} onChange={event => setEmployeeId(event.target.value)}>
            <option value="">All employees</option>
            {employees
              .filter(employee => !department || employee.department === department)
              .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
              .map(employee => <option value={employee.id} key={employee.id}>{employee.firstName} {employee.lastName}</option>)}
          </select>
        </label>
        {isTimesheetReport && (
          <label>
            Project
            <select className="form-control" value={projectName} onChange={event => setProjectName(event.target.value)}>
              <option value="">All projects</option>
              {projectNames.map(name => <option value={name} key={name}>{name}</option>)}
            </select>
          </label>
        )}
        <label>
          Status
          <select className="form-control" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {(reportType === 'daily' || reportType === 'weekly'
              ? ['Draft', 'Submitted', 'Approved', 'Rejected']
              : reportType === 'leave'
                ? ['Pending', 'Approved', 'Rejected']
                : ['Paid', 'Processing', 'Pending']
            ).map(value => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </section>

      {!validDateRange && <div className="reports-error" role="alert">The start date must be on or before the end date.</div>}
      {activeError && <div className="reports-error" role="alert">{activeError}</div>}
      {exportError && <div className="reports-error" role="alert">{exportError}</div>}

      <div className="reports-metrics">
        <article className="card">
          <span>Matching records</span>
          <strong>{rows.length}</strong>
        </article>
        <article className="card">
          <span>Employees represented</span>
          <strong>{peopleCount}</strong>
        </article>
        <article className="card">
          <span>{volumeLabel}</span>
          <strong>{reportType === 'payroll' ? formatINR(volume) : `${volume.toLocaleString('en-IN')} ${reportType === 'leave' ? 'days' : 'hrs'}`}</strong>
        </article>
      </div>

      <section className="card reports-table-card">
        <div className="reports-table-heading">
          <div>
            <h3>{reportOptions.find(option => option.id === reportType)?.label}</h3>
            <p>{reportType === 'payroll' ? 'Payroll amounts are recorded for review and are not calculated or paid by this report.' : 'Results reflect the filters selected above.'}</p>
          </div>
          <span className="badge badge-neutral">{rows.length} records</span>
        </div>
        {activeLoading ? (
          <div className="reports-empty" aria-live="polite">Loading report data…</div>
        ) : rows.length === 0 ? (
          <div className="reports-empty">No records match the selected filters.</div>
        ) : (
          <div className="reports-table-scroll">
            <table className="reports-table">
              <thead>
                <tr>{columns[reportType].map(column => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`${reportType}-${rowIndex}`}>
                    {row.map((value, columnIndex) => (
                      <td key={`${rowIndex}-${columnIndex}`}>
                        {reportType === 'payroll' && (columnIndex === 4 || columnIndex === 5 || columnIndex === 6)
                          ? formatINR(Number(value))
                          : value || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
