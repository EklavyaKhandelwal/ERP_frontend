import type { CompanyHoliday, Project } from '../../types/erp';
import { request } from './request';
import type {
  LeaveInput,
  LeaveListResponse,
  LeavePolicy,
  LeavePolicyChange,
  LeaveResponse,
  ProjectInput,
  ProjectTaskInput,
  ProjectTaskUpdate,
} from './types';

export const leavesApi = {
  list: async () => request<LeaveListResponse>('/leave-requests'),
  createHoliday: (holiday: Omit<CompanyHoliday, 'id' | 'updatedAt'>) => request<{ holiday: CompanyHoliday }>('/leave-requests/holidays', {
    method: 'POST',
    body: JSON.stringify(holiday),
  }),
  updateHoliday: (id: string, holiday: Omit<CompanyHoliday, 'id' | 'updatedAt'>) => request<{ holiday: CompanyHoliday }>(
    `/leave-requests/holidays/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(holiday) },
  ),
  deleteHoliday: (id: string) => request<{ holidayId: string }>(
    `/leave-requests/holidays/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
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
  create: (project: ProjectInput) => request<{ project: Project }>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  }),
  updateMembers: (projectId: string, memberIds: string[]) => request<{ projectId: string }>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    { method: 'PUT', body: JSON.stringify({ memberIds }) },
  ),
  createTask: (projectId: string, task: ProjectTaskInput) => request<{ taskId: string }>(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
    { method: 'POST', body: JSON.stringify(task) },
  ),
  updateTask: (projectId: string, taskId: string, updates: ProjectTaskUpdate) => request<{ task: Project['tasks'][number] }>(
    `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'PATCH', body: JSON.stringify(updates) },
  ),
};
