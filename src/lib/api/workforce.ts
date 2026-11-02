import type { AttendanceRecord, Timesheet } from '../../types/erp';
import { request } from './request';
import type { TimesheetInput, TimesheetResponse } from './types';

export const timesheetsApi = {
  list: async () => (await request<{ timesheets: Timesheet[] }>('/timesheets')).timesheets,
  create: (timesheet: TimesheetInput) => request<TimesheetResponse>('/timesheets', {
    method: 'POST',
    body: JSON.stringify(timesheet),
  }),
  update: (id: string, timesheet: Pick<TimesheetInput, 'status' | 'entries' | 'workCompleted' | 'nextWeekFocus' | 'blockers'>) => (
    request<TimesheetResponse>(`/timesheets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(timesheet),
    })
  ),
  review: (id: string, status: 'Approved' | 'Rejected', note = '') => (
    request<TimesheetResponse>(`/timesheets/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    })
  ),
};

export const attendanceApi = {
  list: (filters: { startDate?: string; endDate?: string; employeeId?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    if (filters.employeeId) query.set('employeeId', filters.employeeId);
    const queryString = query.toString();
    const suffix = queryString ? `?${queryString}` : '';
    return request<{
      timeZone: string;
      todayDate: string;
      serverNow: string;
      canClock: boolean;
      truncated: boolean;
      records: AttendanceRecord[];
      activeRecord: { id: string; clockInAt: string } | null;
    }>(`/attendance${suffix}`);
  },
  clockIn: () => request<{ activeRecord: { id: string; clockInAt: string } }>('/attendance/clock-in', {
    method: 'POST',
  }),
  clockOut: () => request<{ record: { id: string; clockInAt: string; clockOutAt: string | null } }>('/attendance/clock-out', {
    method: 'POST',
  }),
  adjust: (id: string, values: { clockInAt: string; clockOutAt: string | null; reason: string }) => (
    request<{ recordId: string }>(`/attendance/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    })
  ),
};
