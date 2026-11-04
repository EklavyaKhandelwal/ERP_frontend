import type {
  AppraisalReview,
  AppView,
  CompanyHoliday,
  Employee,
  LeaveRequest,
  PayrollRecord,
  Project,
  Timesheet,
  User,
  UserRole,
} from '../types/erp';
import type {
  AccessLinkResult,
  AdminReviewInput,
  AppNotification,
  EmployeeInput,
  LeaveBalance,
  LeaveInput,
  PayrollRecordUpdate,
  PayrollRunRecordInput,
  ProfileInput,
  ProjectInput,
  ProjectTaskInput,
  ProjectTaskUpdate,
  SelfAssessmentInput,
  TimesheetEntryInput,
} from '../lib/api';

export interface ERPContextType {
  currentUser: User;
  role: UserRole;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  login: (email: string, pass: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  employees: Employee[];
  employeesLoading: boolean;
  refreshEmployees: () => Promise<void>;
  addEmployee: (emp: EmployeeInput) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<EmployeeInput>) => Promise<Employee>;
  updateProfileAvatar: (file: File) => Promise<void>;
  updateProfile: (profile: ProfileInput) => Promise<void>;
  issueEmployeeAccessLink: (employeeId: string) => Promise<AccessLinkResult>;
  setEmployeeAccountActive: (employeeId: string, isActive: boolean) => Promise<void>;
  leaves: LeaveRequest[];
  companyHolidays: CompanyHoliday[];
  leavesLoading: boolean;
  leavesError: string | null;
  leaveBalance: LeaveBalance | null;
  applyLeave: (data: LeaveInput) => Promise<LeaveRequest>;
  reviewLeave: (id: string, status: 'Approved' | 'Rejected', note?: string) => Promise<LeaveRequest>;
  saveCompanyHoliday: (holiday: Omit<CompanyHoliday, 'id' | 'updatedAt'>, id?: string) => Promise<void>;
  deleteCompanyHoliday: (id: string) => Promise<void>;
  timesheets: Timesheet[];
  timesheetsLoading: boolean;
  timesheetsError: string | null;
  saveTimesheet: (
    weekStart: string,
    status: 'Draft' | 'Submitted',
    entries: TimesheetEntryInput[],
    summary: Pick<Timesheet, 'workCompleted' | 'nextWeekFocus' | 'blockers'>,
  ) => Promise<Timesheet>;
  reviewTimesheet: (id: string, status: 'Approved' | 'Rejected', note?: string) => Promise<Timesheet>;
  payroll: PayrollRecord[];
  payrollLoading: boolean;
  payrollError: string | null;
  createPayrollRun: (payPeriod: string, records: PayrollRunRecordInput[]) => Promise<PayrollRecord[]>;
  updatePayrollStatus: (id: string, status: PayrollRecord['status']) => Promise<PayrollRecord>;
  updatePayrollRecord: (id: string, updates: PayrollRecordUpdate, correctionNote?: string) => Promise<PayrollRecord>;
  publishPayrollRecord: (id: string) => Promise<PayrollRecord>;
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  addProject: (proj: ProjectInput) => Promise<Project>;
  updateProjectMembers: (projectId: string, memberIds: string[]) => Promise<void>;
  addProjectTask: (projectId: string, task: ProjectTaskInput) => Promise<void>;
  updateProjectTask: (projectId: string, taskId: string, updates: ProjectTaskUpdate) => Promise<void>;
  appraisals: AppraisalReview[];
  appraisalsLoading: boolean;
  appraisalsError: string | null;
  createAppraisalCycle: (cycle: string, employeeIds: string[]) => Promise<AppraisalReview[]>;
  submitSelfAssessment: (id: string, assessment: SelfAssessmentInput) => Promise<AppraisalReview>;
  completeAdminReview: (id: string, review: AdminReviewInput) => Promise<AppraisalReview>;
  notifications: AppNotification[];
  notificationError: string | null;
  refreshNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}
