import { Employee, LeaveRequest, Timesheet, Project, User } from '../types/erp';

export const ADMIN_USER: User = {
  id: 'usr-admin-1',
  name: 'Alexander Wright',
  email: 'alexander.wright@aavil.inc',
  role: 'admin',
  isOwner: true,
  onboardingComplete: true,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  designation: 'VP of People & Operations',
  department: 'Executive'
};

export const EMPLOYEE_USER: User = {
  id: 'emp-101',
  name: 'Marcus Vance',
  email: 'marcus.vance@aavil.inc',
  role: 'employee',
  onboardingComplete: true,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  designation: 'Senior Frontend Architect',
  department: 'Engineering'
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-101',
    employeeCode: 'EMP-0101',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@aavil.inc',
    phone: '+1 (555) 234-8901',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    role: 'employee',
    department: 'Engineering',
    designation: 'Senior Frontend Architect',
    joinDate: '2023-03-15',
    status: 'Active',
    salary: 142000,
    location: 'San Francisco, CA',
    manager: 'Alexander Wright',
    skills: ['TypeScript', 'React', 'Design Systems', 'GraphQL', 'Next.js'],
    leaveBalance: {
      annual: 14,
      annualTotal: 20,
      sick: 8,
      sickTotal: 10,
      casual: 4,
      casualTotal: 6
    }
  },
  {
    id: 'emp-102',
    employeeCode: 'EMP-0102',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@aavil.inc',
    phone: '+1 (555) 872-4512',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    role: 'employee',
    department: 'Design',
    designation: 'Lead Product Designer',
    joinDate: '2022-09-01',
    status: 'Active',
    salary: 135000,
    location: 'New York, NY',
    manager: 'Alexander Wright',
    skills: ['Figma', 'UI/UX', 'Design Tokens', 'User Research', 'Prototyping'],
    leaveBalance: {
      annual: 12,
      annualTotal: 20,
      sick: 9,
      sickTotal: 10,
      casual: 5,
      casualTotal: 6
    }
  },
  {
    id: 'emp-103',
    employeeCode: 'EMP-0103',
    firstName: 'Devon',
    lastName: 'Chen',
    email: 'devon.chen@aavil.inc',
    phone: '+1 (555) 432-9087',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    role: 'employee',
    department: 'Engineering',
    designation: 'Principal Backend Engineer',
    joinDate: '2021-06-12',
    status: 'Active',
    salary: 165000,
    location: 'Seattle, WA',
    manager: 'Alexander Wright',
    skills: ['Go', 'Distributed Systems', 'PostgreSQL', 'Docker', 'Kubernetes'],
    leaveBalance: {
      annual: 18,
      annualTotal: 20,
      sick: 10,
      sickTotal: 10,
      casual: 6,
      casualTotal: 6
    }
  },
  {
    id: 'emp-104',
    employeeCode: 'EMP-0104',
    firstName: 'Amara',
    lastName: 'Okafor',
    email: 'amara.okafor@aavil.inc',
    phone: '+1 (555) 901-4433',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    role: 'employee',
    department: 'Product',
    designation: 'Senior Product Manager',
    joinDate: '2023-01-10',
    status: 'On Leave',
    salary: 148000,
    location: 'Austin, TX',
    manager: 'Alexander Wright',
    skills: ['Roadmapping', 'Agile', 'Data Analytics', 'User Stories', 'SaaS Strategy'],
    leaveBalance: {
      annual: 6,
      annualTotal: 20,
      sick: 8,
      sickTotal: 10,
      casual: 3,
      casualTotal: 6
    }
  },
  {
    id: 'emp-105',
    employeeCode: 'EMP-0105',
    firstName: 'Liam',
    lastName: 'Gallagher',
    email: 'liam.gallagher@aavil.inc',
    phone: '+1 (555) 678-2211',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    role: 'employee',
    department: 'Sales',
    designation: 'Enterprise Account Executive',
    joinDate: '2023-08-20',
    status: 'Active',
    salary: 120000,
    location: 'Chicago, IL',
    manager: 'Alexander Wright',
    skills: ['B2B Sales', 'Negotiation', 'CRM', 'Pipeline Management'],
    leaveBalance: {
      annual: 15,
      annualTotal: 20,
      sick: 10,
      sickTotal: 10,
      casual: 5,
      casualTotal: 6
    }
  },
  {
    id: 'emp-106',
    employeeCode: 'EMP-0106',
    firstName: 'Sophia',
    lastName: 'Martinez',
    email: 'sophia.martinez@aavil.inc',
    phone: '+1 (555) 345-9988',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    role: 'employee',
    department: 'Marketing',
    designation: 'Growth Marketing Lead',
    joinDate: '2024-02-01',
    status: 'Probation',
    salary: 110000,
    location: 'Miami, FL',
    manager: 'Alexander Wright',
    skills: ['SEO', 'Performance Marketing', 'Copywriting', 'Conversion Optimization'],
    leaveBalance: {
      annual: 10,
      annualTotal: 20,
      sick: 7,
      sickTotal: 10,
      casual: 4,
      casualTotal: 6
    }
  }
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'lev-001',
    employeeId: 'emp-104',
    employeeName: 'Amara Okafor',
    employeeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    department: 'Product',
    leaveType: 'Annual Leave',
    startDate: '2026-10-19',
    endDate: '2026-10-24',
    days: 5,
    reason: 'Family vacation and personal downtime.',
    status: 'Approved',
    appliedOn: '2026-10-10',
    reviewedBy: 'Alexander Wright',
    reviewNote: 'Approved. Enjoy your time off!'
  },
  {
    id: 'lev-002',
    employeeId: 'emp-101',
    employeeName: 'Marcus Vance',
    employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    department: 'Engineering',
    leaveType: 'Casual Leave',
    startDate: '2026-10-27',
    endDate: '2026-10-28',
    days: 2,
    reason: 'Attending regional React & Web Performance summit.',
    status: 'Pending',
    appliedOn: '2026-10-20'
  },
  {
    id: 'lev-003',
    employeeId: 'emp-102',
    employeeName: 'Elena Rostova',
    employeeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    department: 'Design',
    leaveType: 'Sick Leave',
    startDate: '2026-10-14',
    endDate: '2026-10-15',
    days: 2,
    reason: 'Medical appointment and recovery.',
    status: 'Approved',
    appliedOn: '2026-10-13',
    reviewedBy: 'Alexander Wright'
  },
  {
    id: 'lev-004',
    employeeId: 'emp-105',
    employeeName: 'Liam Gallagher',
    employeeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    department: 'Sales',
    leaveType: 'Annual Leave',
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    days: 5,
    reason: 'Annual family gathering.',
    status: 'Pending',
    appliedOn: '2026-10-21'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: 'Apollo ERP Platform 2.0',
    code: 'AAV-APO-24',
    client: 'Internal / AAVIL Enterprise',
    status: 'In Progress',
    progress: 74,
    budget: 250000,
    spent: 185000,
    startDate: '2026-06-01',
    deadline: '2026-12-15',
    leadId: 'emp-101',
    leadName: 'Marcus Vance',
    leadAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    team: [
      { id: 'emp-101', name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', role: 'Tech Lead' },
      { id: 'emp-102', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80', role: 'Design Lead' },
      { id: 'emp-103', name: 'Devon Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', role: 'Backend Lead' }
    ],
    description: 'Comprehensive enterprise workforce management suite unifying HRMS, attendance, payroll calculation, project accounting, and timesheets.',
    tasksCompleted: 48,
    totalTasks: 65,
    tasks: []
  },
  {
    id: 'proj-002',
    name: 'Helios Design System',
    code: 'AAV-HEL-09',
    client: 'Global Product Ecosystem',
    status: 'Active',
    progress: 92,
    budget: 85000,
    spent: 78000,
    startDate: '2026-03-15',
    deadline: '2026-11-01',
    leadId: 'emp-102',
    leadName: 'Elena Rostova',
    leadAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    team: [
      { id: 'emp-102', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80', role: 'Design Lead' },
      { id: 'emp-101', name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', role: 'Frontend Engineer' }
    ],
    description: 'Universal cross-platform design token engine and component library for responsive web and mobile products.',
    tasksCompleted: 36,
    totalTasks: 39,
    tasks: []
  },
  {
    id: 'proj-003',
    name: 'Vanguard FinTech Gateway',
    code: 'AAV-VNG-18',
    client: 'Vanguard Capital Partners',
    status: 'Active',
    progress: 45,
    budget: 320000,
    spent: 144000,
    startDate: '2026-07-01',
    deadline: '2027-02-28',
    leadId: 'emp-103',
    leadName: 'Devon Chen',
    leadAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    team: [
      { id: 'emp-103', name: 'Devon Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', role: 'Architecture Lead' },
      { id: 'emp-104', name: 'Amara Okafor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', role: 'Product Manager' }
    ],
    description: 'High-throughput payment orchestration and automated multi-currency treasury reconciliation engine.',
    tasksCompleted: 22,
    totalTasks: 50,
    tasks: []
  }
];

export const INITIAL_TIMESHEETS: Timesheet[] = [
  {
    id: 'ts-001',
    employeeId: 'emp-101',
    employeeName: 'Marcus Vance',
    employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    department: 'Engineering',
    weekStart: '2026-10-12',
    weekEnd: '2026-10-18',
    totalHours: 40,
    status: 'Submitted',
    submittedOn: '2026-10-19',
    workCompleted: 'Finished the project dashboard structure and reviewed design token alignment.',
    nextWeekFocus: 'Connect dashboard views to the employee and project APIs.',
    blockers: '',
    entries: [
      {
        id: 'tse-1',
        projectId: 'proj-001',
        projectName: 'Apollo ERP Platform 2.0',
        taskDescription: 'Modular UI architecture & Figma design token alignment',
        dailyDescriptions: {
          mon: 'Built the dashboard layout and navigation shell.',
          tue: 'Connected the employee summary cards to typed data.',
          wed: 'Reviewed spacing and typography against the design tokens.',
          thu: 'Fixed responsive layout issues in the project overview.',
          fri: 'Completed final UI checks and documented remaining follow-ups.',
          sat: '',
          sun: '',
        },
        hours: { mon: 8, tue: 8, wed: 8, thu: 6, fri: 6, sat: 0, sun: 0 }
      },
      {
        id: 'tse-2',
        projectId: 'proj-002',
        projectName: 'Helios Design System',
        taskDescription: 'Dark mode theme token validation & audit',
        dailyDescriptions: {
          mon: '',
          tue: '',
          wed: '',
          thu: 'Checked dark mode contrast for the navigation color tokens.',
          fri: 'Updated and verified semantic surface tokens.',
          sat: '',
          sun: '',
        },
        hours: { mon: 0, tue: 0, wed: 0, thu: 2, fri: 2, sat: 0, sun: 0 }
      }
    ]
  },
  {
    id: 'ts-002',
    employeeId: 'emp-102',
    employeeName: 'Elena Rostova',
    employeeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    department: 'Design',
    weekStart: '2026-10-12',
    weekEnd: '2026-10-18',
    totalHours: 38,
    status: 'Approved',
    submittedOn: '2026-10-19',
    workCompleted: 'Delivered the responsive component specifications and updated the shared icon library.',
    nextWeekFocus: 'Complete documentation and accessibility review for core components.',
    blockers: 'Waiting on final product copy for the empty states.',
    reviewedBy: 'Alexander Wright',
    entries: [
      {
        id: 'tse-3',
        projectId: 'proj-002',
        projectName: 'Helios Design System',
        taskDescription: 'Component specs, responsive breakpoints, iconography',
        dailyDescriptions: {
          mon: 'Wrote the component behavior and props specifications.',
          tue: 'Documented responsive breakpoints for layout components.',
          wed: 'Reviewed icon sizing and alignment across the library.',
          thu: 'Added accessibility notes to the component specifications.',
          fri: 'Validated the documentation examples and merged updates.',
          sat: '',
          sun: '',
        },
        hours: { mon: 8, tue: 8, wed: 8, thu: 7, fri: 7, sat: 0, sun: 0 }
      }
    ]
  }
];
