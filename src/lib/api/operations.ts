import type { AppraisalReview, PayrollRecord } from '../../types/erp';
import { request } from './request';
import type {
  AdminDashboardSummary,
  AdminReviewInput,
  AppNotification,
  EmployeeDashboardSummary,
  NotificationPreferences,
  PayrollRunRecordInput,
  ResignationApplication,
  ResignationReason,
  ResignationStatus,
  SelfAssessmentInput,
} from './types';

export const notificationsApi = {
  list: async () => (
    await request<{ notifications: AppNotification[] }>('/notifications')
  ).notifications,
  getPreferences: async () => (
    await request<{ preferences: NotificationPreferences }>('/notifications/preferences')
  ).preferences,
  savePreferences: async (preferences: NotificationPreferences) => (
    await request<{ preferences: NotificationPreferences }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    })
  ).preferences,
  markAllRead: () => request<void>('/notifications/read', { method: 'PATCH' }),
};

export const dashboardApi = {
  getSummary: (today: string) => request<AdminDashboardSummary>(`/dashboard/summary?today=${encodeURIComponent(today)}`),
  getEmployeeSummary: (today: string) => request<EmployeeDashboardSummary>(`/dashboard/employee-summary?today=${encodeURIComponent(today)}`),
};

export const payrollApi = {
  list: async () => (await request<{ payroll: PayrollRecord[] }>('/payroll')).payroll,
  createRun: (payPeriod: string, records: PayrollRunRecordInput[]) => (
    request<{ payroll: PayrollRecord[] }>('/payroll/runs', {
      method: 'POST',
      body: JSON.stringify({ payPeriod, records }),
    })
  ),
  updateStatus: (id: string, status: PayrollRecord['status']) => (
    request<{ payroll: PayrollRecord }>(`/payroll/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  ),
};

export const appraisalsApi = {
  list: async () => (await request<{ appraisals: AppraisalReview[] }>('/appraisals')).appraisals,
  createCycle: async (cycle: string, employeeIds: string[]) => (
    await request<{ appraisals: AppraisalReview[] }>('/appraisals/cycles', {
      method: 'POST',
      body: JSON.stringify({ cycle, employeeIds }),
    })
  ).appraisals,
  submitSelfAssessment: async (id: string, assessment: SelfAssessmentInput) => (
    await request<{ appraisal: AppraisalReview }>(`/appraisals/${encodeURIComponent(id)}/self-assessment`, {
      method: 'PATCH',
      body: JSON.stringify(assessment),
    })
  ).appraisal,
  completeAdminReview: async (id: string, review: AdminReviewInput) => (
    await request<{ appraisal: AppraisalReview }>(`/appraisals/${encodeURIComponent(id)}/admin-review`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    })
  ).appraisal,
};

export const resignationsApi = {
  list: async () => (
    await request<{ resignations: ResignationApplication[] }>('/resignations')
  ).resignations,
  apply: (input: {
    proposedLastDay: string;
    reason: ResignationReason;
    remarks: string;
  }) => request<{ resignation: ResignationApplication }>('/resignations', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  review: (id: string, status: ResignationStatus, note: string) => (
    request<{ resignation: ResignationApplication }>(`/resignations/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    })
  ),
};
