import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  Employee, 
  LeaveRequest, 
  Timesheet, 
  PayrollRecord, 
  Project, 
  AppraisalReview, 
  AppView 
} from '../types/erp';
import { ADMIN_USER } from '../data/mockData';
import {
  ApiError,
  accountApi,
  appraisalsApi,
  authApi,
  employeesApi,
  leavesApi,
  notificationsApi,
  payrollApi,
  projectsApi,
  timesheetsApi,
  type EmployeeInput,
  type AccessLinkResult,
  type AppNotification,
  type LeaveBalance,
  type LeaveInput,
  type ProjectInput,
  type PayrollRunRecordInput,
  type TimesheetEntryInput,
  type ManagerReviewInput,
  type SelfAssessmentInput,
} from '../lib/api';

interface ERPContextType {
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
  
  // Auth methods
  login: (email: string, pass: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Data Stores & CRUD
  employees: Employee[];
  employeesLoading: boolean;
  addEmployee: (emp: EmployeeInput) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<EmployeeInput>) => Promise<Employee>;
  issueEmployeeAccessLink: (employeeId: string) => Promise<AccessLinkResult>;
  setEmployeeAccountActive: (employeeId: string, isActive: boolean) => Promise<void>;

  leaves: LeaveRequest[];
  leavesLoading: boolean;
  leavesError: string | null;
  leaveBalance: LeaveBalance | null;
  applyLeave: (data: LeaveInput) => Promise<LeaveRequest>;
  reviewLeave: (id: string, status: 'Approved' | 'Rejected', note?: string) => Promise<LeaveRequest>;

  timesheets: Timesheet[];
  timesheetsLoading: boolean;
  timesheetsError: string | null;
  saveTimesheet: (weekStart: string, status: 'Draft' | 'Submitted', entries: TimesheetEntryInput[]) => Promise<Timesheet>;
  reviewTimesheet: (id: string, status: 'Approved' | 'Rejected') => Promise<Timesheet>;

  payroll: PayrollRecord[];
  payrollLoading: boolean;
  payrollError: string | null;
  createPayrollRun: (payPeriod: string, records: PayrollRunRecordInput[]) => Promise<PayrollRecord[]>;
  updatePayrollStatus: (id: string, status: PayrollRecord['status']) => Promise<PayrollRecord>;

  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  addProject: (proj: ProjectInput) => Promise<Project>;
  updateProjectProgress: (id: string, progress: number) => Promise<void>;

  appraisals: AppraisalReview[];
  appraisalsLoading: boolean;
  appraisalsError: string | null;
  createAppraisalCycle: (cycle: string) => Promise<AppraisalReview[]>;
  submitSelfAssessment: (id: string, assessment: SelfAssessmentInput) => Promise<AppraisalReview>;
  completeManagerReview: (id: string, review: ManagerReviewInput) => Promise<AppraisalReview>;

  // Design inspection helper
  figmaOverlayAsset: string | null;
  setFigmaOverlayAsset: (path: string | null) => void;
  
  // Notifications
  notifications: AppNotification[];
  notificationError: string | null;
  markNotificationsRead: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('admin');
  const [currentUser, setCurrentUser] = useState<User>(ADMIN_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('proj-001');
  const [figmaOverlayAsset, setFigmaOverlayAsset] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leavesError, setLeavesError] = useState<string | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [timesheetsError, setTimesheetsError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState<string | null>(null);
  const [appraisals, setAppraisals] = useState<AppraisalReview[]>([]);
  const [appraisalsLoading, setAppraisalsLoading] = useState(false);
  const [appraisalsError, setAppraisalsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void authApi.currentUser()
      .then(user => {
        if (!active) return;
        setCurrentUser(user);
        setRoleState(user.role);
        setEmployeesLoading(true);
        setLeavesLoading(true);
        setTimesheetsLoading(true);
        setProjectsLoading(true);
        setPayrollLoading(true);
        setAppraisalsLoading(true);
        setLeavesError(null);
        setTimesheetsError(null);
        setProjectsError(null);
        setPayrollError(null);
        setAppraisalsError(null);
        setIsAuthenticated(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (!(error instanceof ApiError) || error.status !== 401) {
          setAuthError(error instanceof Error ? error.message : 'Unable to verify your session.');
        }
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    void employeesApi.list()
      .then(records => {
        if (!active) return;
        setEmployees(records);
        if (role === 'employee' && records[0]) {
          setSelectedEmployeeId(records[0].id);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setAuthError(error instanceof Error ? error.message : 'Unable to load employees.');
        }
      })
      .finally(() => {
        if (active) setEmployeesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, role]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    void leavesApi.list()
      .then(result => {
        if (!active) return;
        setLeaves(result.leaves);
        setLeaveBalance(result.leaveBalance);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLeavesError(error instanceof Error ? error.message : 'Unable to load leave requests.');
      })
      .finally(() => {
        if (active) setLeavesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void projectsApi.list()
      .then(records => {
        if (active) setProjects(records);
      })
      .catch((error: unknown) => {
        if (active) setProjectsError(error instanceof Error ? error.message : 'Unable to load projects.');
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    const refreshNotifications = async () => {
      try {
        const records = await notificationsApi.list();
        if (active) {
          setNotifications(records);
          setNotificationError(null);
        }
      } catch (error) {
        if (active) {
          setNotificationError(error instanceof Error ? error.message : 'Unable to load notifications.');
        }
      }
    };

    void refreshNotifications();
    const intervalId = window.setInterval(() => void refreshNotifications(), 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void timesheetsApi.list()
      .then(records => {
        if (active) setTimesheets(records);
      })
      .catch((error: unknown) => {
        if (active) setTimesheetsError(error instanceof Error ? error.message : 'Unable to load timesheets.');
      })
      .finally(() => {
        if (active) setTimesheetsLoading(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void payrollApi.list()
      .then(records => {
        if (active) setPayroll(records);
      })
      .catch((error: unknown) => {
        if (active) setPayrollError(error instanceof Error ? error.message : 'Unable to load payroll records.');
      })
      .finally(() => {
        if (active) setPayrollLoading(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void appraisalsApi.list()
      .then(records => {
        if (active) setAppraisals(records);
      })
      .catch((error: unknown) => {
        if (active) setAppraisalsError(error instanceof Error ? error.message : 'Unable to load performance reviews.');
      })
      .finally(() => {
        if (active) setAppraisalsLoading(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  // Auth
  const login = async (email: string, pass: string, rememberMe: boolean) => {
    setAuthError(null);
    try {
      const user = await authApi.login(email, pass, rememberMe);
      setCurrentUser(user);
      setRoleState(user.role);
      setEmployeesLoading(true);
      setLeavesLoading(true);
      setTimesheetsLoading(true);
      setProjectsLoading(true);
      setPayrollLoading(true);
      setAppraisalsLoading(true);
      setLeavesError(null);
      setTimesheetsError(null);
      setProjectsError(null);
      setPayrollError(null);
      setAppraisalsError(null);
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setEmployees([]);
      setEmployeesLoading(false);
      setLeaves([]);
      setLeavesLoading(false);
      setLeaveBalance(null);
      setTimesheets([]);
      setTimesheetsLoading(false);
      setProjects([]);
      setProjectsLoading(false);
      setPayroll([]);
      setPayrollLoading(false);
      setAppraisals([]);
      setAppraisalsLoading(false);
      setAppraisalsError(null);
      setNotifications([]);
      setNotificationError(null);
      setCurrentView('login');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  // Employee Methods
  const addEmployee = async (empData: EmployeeInput) => {
    const employee = await employeesApi.create(empData);
    setEmployees(prev => [employee, ...prev]);
    return employee;
  };

  const updateEmployee = async (id: string, updates: Partial<EmployeeInput>) => {
    const employee = await employeesApi.update(id, updates);
    setEmployees(prev => prev.map(existing => existing.id === id ? employee : existing));
    return employee;
  };

  const issueEmployeeAccessLink = async (employeeId: string) => {
    const result = await accountApi.issueEmployeeAccessLink(employeeId);
    if (result.purpose === 'setup') {
      setEmployees(prev => prev.map(employee => employee.id === employeeId
        ? { ...employee, accountStatus: 'Invitation pending' }
        : employee));
    }
    return result;
  };

  const setEmployeeAccountActive = async (employeeId: string, isActive: boolean) => {
    await accountApi.setEmployeeActive(employeeId, isActive);
    setEmployees(prev => prev.map(employee => employee.id === employeeId
      ? { ...employee, accountStatus: isActive ? 'Active' : 'Deactivated' }
      : employee));
  };

  // Leave Methods
  const applyLeave = async (data: LeaveInput) => {
    const result = await leavesApi.apply(data);
    setLeaves(prev => [result.leave, ...prev]);
    setLeaveBalance(result.leaveBalance);
    setLeavesError(null);
    return result.leave;
  };

  const reviewLeave = async (id: string, status: 'Approved' | 'Rejected', note?: string) => {
    const result = await leavesApi.review(id, status, note);
    setLeaves(prev => prev.map(leave => leave.id === id ? result.leave : leave));
    setEmployees(prev => prev.map(employee => (
      employee.id === result.leave.employeeId
        ? { ...employee, leaveBalance: result.leaveBalance }
        : employee
    )));
    setLeavesError(null);
    return result.leave;
  };

  // Timesheet Methods
  const saveTimesheet = async (
    weekStart: string,
    status: 'Draft' | 'Submitted',
    entries: TimesheetEntryInput[],
  ) => {
    const employee = employees.find(existing => existing.email === currentUser.email);
    if (!employee) throw new Error('Your account does not have a linked employee profile.');
    const existing = timesheets.find(sheet => sheet.employeeId === employee.id && sheet.weekStart === weekStart);
    const result = existing
      ? await timesheetsApi.update(existing.id, { status, entries })
      : await timesheetsApi.create({ weekStart, status, entries });
    setTimesheets(prev => existing
      ? prev.map(sheet => sheet.id === result.timesheet.id ? result.timesheet : sheet)
      : [result.timesheet, ...prev]);
    setTimesheetsError(null);
    return result.timesheet;
  };

  const reviewTimesheet = async (id: string, status: 'Approved' | 'Rejected') => {
    const result = await timesheetsApi.review(id, status);
    setTimesheets(prev => prev.map(sheet => sheet.id === result.timesheet.id ? result.timesheet : sheet));
    setTimesheetsError(null);
    return result.timesheet;
  };

  // Payroll Methods
  const createPayrollRun = async (payPeriod: string, records: PayrollRunRecordInput[]) => {
    const result = await payrollApi.createRun(payPeriod, records);
    setPayroll(prev => [...result.payroll, ...prev]);
    setPayrollError(null);
    return result.payroll;
  };

  const updatePayrollStatus = async (id: string, status: PayrollRecord['status']) => {
    const result = await payrollApi.updateStatus(id, status);
    setPayroll(prev => prev.map(record => record.id === id ? result.payroll : record));
    setPayrollError(null);
    return result.payroll;
  };

  // Project Methods
  const addProject = async (project: ProjectInput) => {
    const createdProject = await projectsApi.create(project);
    const updatedProjects = await projectsApi.list();
    setProjects(updatedProjects);
    setProjectsError(null);
    const created = updatedProjects.find(candidate => candidate.code === createdProject.code);
    if (!created) throw new Error('Project was created, but the refreshed project list did not include it.');
    return created;
  };

  const updateProjectProgress = async (id: string, progress: number) => {
    try {
      await projectsApi.updateProgress(id, progress);
      setProjects(prev => prev.map(project => project.id === id ? { ...project, progress } : project));
      setProjectsError(null);
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : 'Unable to update project progress.');
    }
  };

  // Appraisal Methods
  const createAppraisalCycle = async (cycle: string) => {
    const records = await appraisalsApi.createCycle(cycle);
    setAppraisals(prev => [...records, ...prev]);
    setAppraisalsError(null);
    return records;
  };

  const submitSelfAssessment = async (id: string, assessment: SelfAssessmentInput) => {
    const updated = await appraisalsApi.submitSelfAssessment(id, assessment);
    setAppraisals(prev => prev.map(appraisal => appraisal.id === id ? updated : appraisal));
    setAppraisalsError(null);
    return updated;
  };

  const completeManagerReview = async (id: string, review: ManagerReviewInput) => {
    const updated = await appraisalsApi.completeManagerReview(id, review);
    setAppraisals(prev => prev.map(appraisal => appraisal.id === id ? updated : appraisal));
    setAppraisalsError(null);
    return updated;
  };

  const markNotificationsRead = async () => {
    setNotificationError(null);
    try {
      await notificationsApi.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications(prev => prev.map(notification => (
        notification.readAt ? notification : { ...notification, readAt }
      )));
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
    }
  };

  return (
    <ERPContext.Provider value={{
      currentUser,
      role,
      isAuthenticated,
      isAuthLoading,
      authError,
      currentView,
      setCurrentView,
      selectedEmployeeId,
      setSelectedEmployeeId,
      selectedProjectId,
      setSelectedProjectId,
      login,
      logout,
      employees,
      employeesLoading,
      addEmployee,
      updateEmployee,
      issueEmployeeAccessLink,
      setEmployeeAccountActive,
      leaves,
      leavesLoading,
      leavesError,
      leaveBalance,
      applyLeave,
      reviewLeave,
      timesheets,
      timesheetsLoading,
      timesheetsError,
      saveTimesheet,
      reviewTimesheet,
      payroll,
      payrollLoading,
      payrollError,
      createPayrollRun,
      updatePayrollStatus,
      projects,
      projectsLoading,
      projectsError,
      addProject,
      updateProjectProgress,
      appraisals,
      appraisalsLoading,
      appraisalsError,
      createAppraisalCycle,
      submitSelfAssessment,
      completeManagerReview,
      figmaOverlayAsset,
      setFigmaOverlayAsset,
      notifications,
      notificationError,
      markNotificationsRead
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};
