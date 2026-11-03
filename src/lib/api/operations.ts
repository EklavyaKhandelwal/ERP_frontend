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
  ResignationChecklistItem,
  ResignationPolicy,
  ResignationPolicyChange,
  ResignationReason,
  ResignationReviewer,
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
  getPolicy: async () => (
    await request<{ policy: ResignationPolicy }>('/resignations/policy')
  ).policy,
  savePolicy: async (policy: ResignationPolicy) => (
    await request<{ policy: ResignationPolicy }>('/resignations/policy', {
      method: 'PUT',
      body: JSON.stringify(policy),
    })
  ).policy,
  listPolicyHistory: async () => (
    await request<{ history: ResignationPolicyChange[] }>('/resignations/policy/history')
  ).history,
  list: async () => (
    await request<{ resignations: ResignationApplication[] }>('/resignations')
  ).resignations,
  reviewers: async () => (
    await request<{ reviewers: ResignationReviewer[] }>('/resignations/reviewers')
  ).reviewers,
  apply: (input: {
    proposedLastDay: string;
    reason: ResignationReason;
    remarks: string;
  }) => request<{ resignation: ResignationApplication }>('/resignations', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  review: (id: string, status: ResignationStatus, note: string, approvedLastDay?: string) => (
    request<{ resignation: ResignationApplication }>(`/resignations/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, approvedLastDay }),
    })
  ),
  assign: (id: string, assignedToUserId: string | null) => request<{ success: true }>(
    `/resignations/${encodeURIComponent(id)}/assignment`,
    { method: 'PATCH', body: JSON.stringify({ assignedToUserId }) },
  ),
  updateChecklistItem: (id: string, itemId: string, input: {
    status?: ResignationChecklistItem['status'];
    responsibleParty?: string;
    dueDate?: string | null;
    note?: string;
  }) => request<{ item: ResignationChecklistItem }>(
    `/resignations/${encodeURIComponent(id)}/checklist/${encodeURIComponent(itemId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  ),
};
