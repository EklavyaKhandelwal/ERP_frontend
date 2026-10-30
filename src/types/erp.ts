export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isOwner?: boolean;
  onboardingComplete: boolean;
  avatar: string;
  designation: string;
  department: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string | null;
  avatar: string;
  role: string;
  department: string;
  designation: string;
  joinDate: string;
  status: 'Active' | 'On Leave' | 'Probation' | 'Inactive';
  salary?: number;
  location: string;
  manager: string;
  skills: string[];
  accountStatus?: 'Not set up' | 'Invitation pending' | 'Active' | 'Deactivated' | 'Admin account';
  leaveBalance?: {
    year?: number;
    annual: number;
    annualTotal: number;
    annualPending?: number;
    sick: number;
    sickTotal: number;
    sickPending?: number;
    casual: number;
    casualTotal: number;
    casualPending?: number;
  };
}

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Maternity/Paternity' | 'Unpaid Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface TimesheetEntry {
  id: string;
  projectId: string;
  projectName: string;
  taskDescription: string;
  dailyDescriptions: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

export interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  weekStart: string;
  weekEnd: string;
  entries: TimesheetEntry[];
  totalHours: number;
  status: TimesheetStatus;
  workCompleted: string;
  nextWeekFocus: string;
  blockers: string;
  submittedOn?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: 'Paid' | 'Processing' | 'Pending';
  paymentDate?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  status: 'Active' | 'In Progress' | 'Completed' | 'On Hold';
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  startDate: string;
  leadId: string;
  leadName: string;
  leadAvatar: string;
  team: { id: string; name: string; avatar: string; role: string }[];
  description: string;
  tasksCompleted: number;
  totalTasks: number;
  tasks: ProjectTask[];
}

export type ProjectTaskStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Done';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  assignedEmployeeAvatar: string;
  status: ProjectTaskStatus;
  dueDate: string | null;
  updateNote: string;
  updatedAt: string;
}

export interface AppraisalReview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  designation: string;
  cycle: string;
  status: 'Self Assessment' | 'Admin Review' | 'Completed';
  overallRating?: number; // 1-5
  legacyAdminRating?: number;
  selfComments?: string;
  selfChallenges?: string;
  nextGoals?: string;
  goalsAchieved?: string;
  deliveryRating?: number;
  qualityRating?: number;
  ownershipRating?: number;
  collaborationRating?: number;
  adminComments?: string;
  areasOfImprovement?: string;
  completedDate?: string;
}

export type AppView = 
  | 'login'
  | 'admin-access'
  | 'forgot-password'
  | 'two-factor'
  | 'dashboard'
  | 'settings'
  | 'my-profile'
  | 'employees'
  | 'employee-profile'
  | 'leaves'
  | 'payroll'
  | 'projects'
  | 'project-detail'
  | 'timesheets'
  | 'reports'
  | 'appraisals'
  | 'resignation';
