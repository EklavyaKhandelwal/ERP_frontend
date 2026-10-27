import type { AppraisalReview, Employee, LeaveRequest, PayrollRecord, Project, Timesheet, User } from '../types/erp';

export type EmployeeInput = Pick<
  Employee,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'avatar'
  | 'role'
  | 'department'
  | 'designation'
  | 'joinDate'
  | 'status'
  | 'salary'
  | 'location'
  | 'manager'
  | 'skills'
>;

export type LeaveBalance = Employee['leaveBalance'];
export type LeaveInput = Pick<LeaveRequest, 'leaveType' | 'startDate' | 'endDate' | 'reason'>;
export type ProjectInput = Pick<Project, 'name' | 'client' | 'budget' | 'deadline' | 'description'> & {
  memberIds: string[];
};
export type TimesheetEntryInput = Pick<Timesheet['entries'][number], 'projectId' | 'taskDescription' | 'hours'>;
export interface TimesheetInput {
  weekStart: string;
  status: 'Draft' | 'Submitted';
  entries: TimesheetEntryInput[];
}
export type PayrollRunRecordInput = Pick<
  PayrollRecord,
  | 'employeeId'
  | 'basicSalary'
  | 'hra'
  | 'specialAllowance'
  | 'bonus'
  | 'providentFund'
  | 'professionalTax'
  | 'incomeTax'
>;
export type SelfAssessmentInput = {
  rating: number;
  comments: string;
  goals: string;
};
export type ManagerReviewInput = {
  rating: number;
  comments: string;
};
export type AccessLinkResult = {
  purpose: 'setup' | 'reset';
  accessPath: string;
  expiresAt: string;
};
export type AppNotification = {
  id: string;
  title: string;
  createdAt: string;
  readAt: string | null;
};

interface LeaveResponse {
  leave: LeaveRequest;
  leaveBalance: LeaveBalance;
}

interface TimesheetResponse {
  timesheet: Timesheet;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError('Cannot connect to the API. Start the backend and try again.', 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(body?.error ?? 'The request could not be completed.', response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  currentUser: async () => (await request<{ user: User }>('/auth/me')).user,
  login: async (email: string, password: string, rememberMe: boolean) => (
    await request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    })
  ).user,
  requestPasswordReset: (email: string) => request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (token: string, password: string) => request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

export const accountApi = {
  issueEmployeeAccessLink: (employeeId: string) => (
    request<AccessLinkResult>(`/accounts/employees/${encodeURIComponent(employeeId)}/access-link`, {
      method: 'POST',
    })
  ),
  setEmployeeActive: (employeeId: string, isActive: boolean) => (
    request<{ account: { isActive: boolean } }>(`/accounts/employees/${encodeURIComponent(employeeId)}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  ),
  completeSetup: (token: string, password: string) => (
    request<{ message: string }>('/accounts/complete-setup', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  ),
};

export const notificationsApi = {
  list: async () => (
    await request<{ notifications: AppNotification[] }>('/notifications')
  ).notifications,
  markAllRead: () => request<void>('/notifications/read', { method: 'PATCH' }),
};

export const employeesApi = {
  list: async () => (await request<{ employees: Employee[] }>('/employees')).employees,
  get: async (id: string) => (
    await request<{ employee: Employee }>(`/employees/${encodeURIComponent(id)}`)
  ).employee,
  create: async (employee: EmployeeInput) => (
    await request<{ employee: Employee }>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    })
  ).employee,
  update: async (id: string, employee: Partial<EmployeeInput>) => (
    await request<{ employee: Employee }>(`/employees/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(employee),
    })
  ).employee,
};

export const leavesApi = {
  list: async () => request<{ leaves: LeaveRequest[]; leaveBalance: LeaveBalance }>('/leave-requests'),
  apply: async (leave: LeaveInput) => request<LeaveResponse>('/leave-requests', {
    method: 'POST',
    body: JSON.stringify(leave),
  }),
  review: async (id: string, status: 'Approved' | 'Rejected', note?: string) => (
    request<LeaveResponse>(`/leave-requests/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    })
  ),
};

export const projectsApi = {
  list: async () => (await request<{ projects: Project[] }>('/projects')).projects,
  create: (project: ProjectInput) => request<{ projectId: string; code: string }>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  }),
  updateProgress: (id: string, progress: number) => request<{ progress: number }>(
    `/projects/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ progress }) },
  ),
};

export const timesheetsApi = {
  list: async () => (await request<{ timesheets: Timesheet[] }>('/timesheets')).timesheets,
  create: (timesheet: TimesheetInput) => request<TimesheetResponse>('/timesheets', {
    method: 'POST',
    body: JSON.stringify(timesheet),
  }),
  update: (id: string, timesheet: Pick<TimesheetInput, 'status' | 'entries'>) => (
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
  createCycle: async (cycle: string) => (
    await request<{ appraisals: AppraisalReview[] }>('/appraisals/cycles', {
      method: 'POST',
      body: JSON.stringify({ cycle }),
    })
  ).appraisals,
  submitSelfAssessment: async (id: string, assessment: SelfAssessmentInput) => (
    await request<{ appraisal: AppraisalReview }>(`/appraisals/${encodeURIComponent(id)}/self-assessment`, {
      method: 'PATCH',
      body: JSON.stringify(assessment),
    })
  ).appraisal,
  completeManagerReview: async (id: string, review: ManagerReviewInput) => (
    await request<{ appraisal: AppraisalReview }>(`/appraisals/${encodeURIComponent(id)}/manager-review`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    })
  ).appraisal,
};
