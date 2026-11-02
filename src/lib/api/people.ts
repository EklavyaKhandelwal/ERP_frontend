import type { Employee } from '../../types/erp';
import { request } from './request';
import type { EmployeeInput, EmployeeProjectSummary } from './types';

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
