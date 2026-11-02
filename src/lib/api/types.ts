import type {
  CompanyHoliday,
  Employee,
  LeaveRequest,
  PayrollRecord,
  Project,
  ProjectTaskStatus,
  Timesheet,
  User,
} from '../../types/erp';

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
export type ProfileInput = {
  name: string;
  phone?: string;
  dateOfBirth?: string;
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
  birthdays: Array<{ id: string; name: string; avatar: string }>;
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
  birthday: {
    isToday: boolean;
  };
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

export interface LeaveResponse {
  leave: LeaveRequest;
  leaveBalance: LeaveBalance;
}

export interface LeaveListResponse {
  leaves: LeaveRequest[];
  leaveBalance: LeaveBalance | null;
  holidays: CompanyHoliday[];
}

export interface TimesheetResponse {
  timesheet: Timesheet;
}
