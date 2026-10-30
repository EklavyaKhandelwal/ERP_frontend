import type {
  AppraisalReview,
  Employee,
  LeaveRequest,
  PayrollRecord,
  Project,
  ProjectTaskStatus,
  Timesheet,
  User,
} from '../types/erp';

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
> & {
  phone: string;
  salary: number;
};

export type EmployeeProjectSummary = Pick<Project, 'id' | 'name' | 'code' | 'status' | 'progress' | 'deadline'> & {
  role: string;
};

export type LeaveBalance = NonNullable<Employee['leaveBalance']>;
export type LeavePolicy = {
  annual: number;
  sick: number;
  casual: number;
};
export type LeavePolicyChange = LeavePolicy & {
  changedBy: string | null;
  changedAt: string;
};
export type LeaveInput = Pick<LeaveRequest, 'leaveType' | 'startDate' | 'endDate' | 'reason'>;
export type ProjectInput = Pick<Project, 'name' | 'client' | 'budget' | 'deadline' | 'description'> & {
  memberIds: string[];
};
export type ProjectTaskInput = {
  title: string;
  description: string;
  assignedEmployeeId: string;
  dueDate: string | null;
};
export type ProjectTaskUpdate = Partial<ProjectTaskInput> & {
  status?: ProjectTaskStatus;
  updateNote?: string;
};
export type TimesheetEntryInput = Pick<Timesheet['entries'][number], 'projectId' | 'taskDescription' | 'dailyDescriptions' | 'hours'>;
export interface TimesheetInput {
  weekStart: string;
  status: 'Draft' | 'Submitted';
  entries: TimesheetEntryInput[];
  workCompleted: string;
  nextWeekFocus: string;
  blockers: string;
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
  reflection: string;
  achievements: string;
  challenges: string;
  nextGoals: string;
};
export type AdminReviewInput = {
  deliveryRating: number;
  qualityRating: number;
  ownershipRating: number;
  collaborationRating: number;
  comments: string;
};
export type AccessLinkResult = {
  purpose: 'setup' | 'reset';
  accessPath: string;
  expiresAt: string;
};
export type EmployeeDocumentType = 'offer_letter' | 'education_certificate' | 'government_id';
export type EmployeeOnboardingDocument = {
  documentType: EmployeeDocumentType;
  fileName: string;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  data: string;
};
export type EmployeeDocument = {
  id: string;
  documentType: EmployeeDocumentType;
  fileName: string;
  contentType: string;
  uploadedAt: string;
};
export type AdminAccount = Pick<
  User,
  'id' | 'name' | 'email' | 'department' | 'designation' | 'isOwner'
> & {
  isActive: boolean;
  hasCompletedSetup: boolean;
  createdAt: string;
};
export type AppNotification = {
  id: string;
  title: string;
  createdAt: string;
  readAt: string | null;
};
export type AdminDashboardSummary = {
  employees: {
    total: number;
    active: number;
    departments: Array<{ department: string; count: number }>;
  };
  projects: {
    active: number;
    averageProgress: number | null;
  };
  leaves: {
    pendingCount: number;
    pending: LeaveRequest[];
    upcoming: LeaveRequest[];
  };
  timesheets: {
    pendingCount: number;
    pending: Array<Pick<
      Timesheet,
      'id' | 'employeeName' | 'employeeAvatar' | 'department' | 'weekStart' | 'submittedOn' | 'workCompleted' | 'totalHours'
    >>;
  };
  payroll: {
    period: string | null;
    netPay: number | null;
  };
};
export type EmployeeDashboardSummary = {
  leaveBalance: LeaveBalance;
  leaves: {
    pendingCount: number;
    pending: LeaveRequest | null;
    upcoming: LeaveRequest | null;
  };
  projects: {
    activeCount: number;
    records: Array<Pick<Project, 'id' | 'name' | 'code' | 'status' | 'progress' | 'deadline'>>;
  };
  timesheet: Pick<Timesheet, 'id' | 'weekStart' | 'status' | 'totalHours'> | null;
  payslip: Pick<PayrollRecord, 'month' | 'year' | 'netPay' | 'status'> | null;
};
export type NotificationPreferences = {
  leaveRequests: boolean;
  timesheetSubmissions: boolean;
  appraisalCycleUpdates: boolean;
  employeeOnboarding: boolean;
  projectMilestones: boolean;
};
export type ResignationReason =
  | 'Career growth'
  | 'Higher studies'
  | 'Personal reasons'
  | 'Relocation'
  | 'Health reasons'
  | 'Other';
export type ResignationStatus = 'Pending' | 'Approved' | 'Rejected';
export type ResignationApplication = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeAvatar: string;
  employeeCode: string;
  department: string;
  designation: string;
  manager: string;
  resignationDate: string;
  noticeDays: number;
  proposedLastDay: string;
  reason: ResignationReason;
  remarks: string;
  status: ResignationStatus;
  reviewedBy: string | null;
  reviewerEmail: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  approvedLastDay: string | null;
  escalationNotifiedAt: string | null;
  createdAt: string;
};

interface LeaveResponse {
  leave: LeaveRequest;
  leaveBalance: LeaveBalance;
}

interface LeaveListResponse {
  leaves: LeaveRequest[];
  leaveBalance: LeaveBalance | null;
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
  updateAvatar: async (avatar: string) => (
    await request<{ user: User }>('/auth/profile/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar }),
    })
  ).user,
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
  listAdmins: async () => (await request<{ admins: AdminAccount[] }>('/accounts/admins')).admins,
  inviteAdmin: (admin: Pick<AdminAccount, 'name' | 'email' | 'department' | 'designation'>) => (
    request<{ invitePath: string; expiresAt: string; emailSent: boolean }>('/accounts/admins/invitations', {
      method: 'POST',
      body: JSON.stringify(admin),
    })
  ),
  reissueAdminInvite: (adminId: string) => (
    request<{ invitePath: string; expiresAt: string; emailSent: boolean }>(`/accounts/admins/${encodeURIComponent(adminId)}/invitation`, {
      method: 'POST',
    })
  ),
  setAdminActive: (adminId: string, isActive: boolean) => (
    request<{ account: { isActive: boolean } }>(`/accounts/admins/${encodeURIComponent(adminId)}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  ),
  completeAdminSetup: (token: string, password: string) => (
    request<{ message: string }>('/accounts/complete-admin-setup', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  ),
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
  completeSetup: (token: string, password: string, profile: {
    fullName: string;
    dateOfBirth: string;
    phone: string;
    documents: EmployeeOnboardingDocument[];
  }) => (
    request<{ message: string }>('/accounts/complete-setup', {
      method: 'POST',
      body: JSON.stringify({ token, password, ...profile }),
    })
  ),
  submitEmployeeOnboarding: (profile: {
    fullName: string;
    dateOfBirth: string;
    phone: string;
    documents: EmployeeOnboardingDocument[];
  }) => request<{ message: string }>('/accounts/onboarding', {
    method: 'POST',
    body: JSON.stringify(profile),
  }),
  listMyDocuments: async () => (
    await request<{ documents: EmployeeDocument[] }>('/accounts/my-documents')
  ).documents,
  replaceMyDocument: (document: EmployeeOnboardingDocument) => request<{ document: EmployeeDocument }>(
    `/accounts/my-documents/${encodeURIComponent(document.documentType)}`,
    {
      method: 'PUT',
      body: JSON.stringify(document),
    },
  ),
  downloadMyDocument: async (document: EmployeeDocument) => {
    let response: Response;
    try {
      response = await fetch(`/api/accounts/my-documents/${encodeURIComponent(document.id)}`, {
        credentials: 'same-origin',
      });
    } catch {
      throw new ApiError('Cannot connect to the API. Start the backend and try again.', 0);
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new ApiError(body?.error ?? 'The document could not be opened.', response.status);
    }
    return response.blob();
  },
  listEmployeeDocuments: async (employeeId: string) => (
    await request<{ documents: EmployeeDocument[] }>(`/accounts/employees/${encodeURIComponent(employeeId)}/documents`)
  ).documents,
  downloadEmployeeDocument: async (employeeId: string, document: EmployeeDocument) => {
    let response: Response;
    try {
      response = await fetch(`/api/accounts/employees/${encodeURIComponent(employeeId)}/documents/${encodeURIComponent(document.id)}`, {
        credentials: 'same-origin',
      });
    } catch {
      throw new ApiError('Cannot connect to the API. Start the backend and try again.', 0);
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new ApiError(body?.error ?? 'The document could not be downloaded.', response.status);
    }
    return response.blob();
  },
};

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

export const employeesApi = {
  list: async () => (await request<{ employees: Employee[] }>('/employees')).employees,
  get: async (id: string) => (
    await request<{ employee: Employee }>(`/employees/${encodeURIComponent(id)}`)
  ).employee,
  listProjects: async (id: string) => (
    await request<{ projects: EmployeeProjectSummary[] }>(`/employees/${encodeURIComponent(id)}/projects`)
  ).projects,
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
  list: async () => request<LeaveListResponse>('/leave-requests'),
  getPolicy: async () => (await request<{ policy: LeavePolicy }>('/leave-requests/policy')).policy,
  listPolicyHistory: async () => (
    await request<{ history: LeavePolicyChange[] }>('/leave-requests/policy/history')
  ).history,
  savePolicy: async (policy: LeavePolicy) => (
    await request<{ policy: LeavePolicy }>('/leave-requests/policy', {
      method: 'PUT',
      body: JSON.stringify(policy),
    })
  ).policy,
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
  createTask: (projectId: string, task: ProjectTaskInput) => request<{ taskId: string }>(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
    { method: 'POST', body: JSON.stringify(task) },
  ),
  updateTask: (projectId: string, taskId: string, updates: ProjectTaskUpdate) => request<{ task: Project['tasks'][number] }>(
    `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'PATCH', body: JSON.stringify(updates) },
  ),
};

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
