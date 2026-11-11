import { request } from './request';
import type {
  SalesAccount,
  SalesAccountInput,
  SalesAccountProfile,
  SalesActivity,
  SalesContact,
  SalesContactListItem,
  SalesDashboardFollowUp,
  SalesEmployeeAccess,
  SalesLead,
  SalesNote,
  SalesOpportunity,
  SalesTeamUpdate,
} from './types';

export type SalesRecordKind = 'contacts' | 'activities' | 'leads' | 'opportunities' | 'notes';
export const salesApi = {
  listContacts: async (filters: { search?: string; status?: SalesContact['status'] } = {}) => {
    const query = new URLSearchParams();
    if (filters.search) query.set('search', filters.search);
    if (filters.status) query.set('status', filters.status);
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<{ contacts: SalesContactListItem[] }>(`/sales/contacts${suffix}`);
  },
  listTeamUpdates: async (filters: {
    ownerEmployeeId?: string;
    accountId?: string;
    type?: SalesActivity['type'];
    fromDate?: string;
    toDate?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (filters.ownerEmployeeId) query.set('ownerEmployeeId', filters.ownerEmployeeId);
    if (filters.accountId) query.set('accountId', filters.accountId);
    if (filters.type) query.set('type', filters.type);
    if (filters.fromDate) query.set('fromDate', filters.fromDate);
    if (filters.toDate) query.set('toDate', filters.toDate);
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<{ updates: SalesTeamUpdate[] }>(`/sales/updates${suffix}`);
  },
  listAccounts: async (filters: { search?: string; status?: 'Prospect' | 'Active'; ownerEmployeeId?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.search) query.set('search', filters.search);
    if (filters.status) query.set('status', filters.status);
    if (filters.ownerEmployeeId) query.set('ownerEmployeeId', filters.ownerEmployeeId);
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<{
      accounts: SalesAccount[];
      counts: { total: number; prospect: number; active: number };
      recentAccounts: SalesAccount[];
      followUps: SalesDashboardFollowUp[];
    }>(`/sales/accounts${suffix}`);
  },
  getAccount: async (id: string) => request<SalesAccountProfile>(`/sales/accounts/${encodeURIComponent(id)}`),
  createAccount: async (input: SalesAccountInput) => (
    await request<{ account: SalesAccount }>('/sales/accounts', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).account,
  updateAccount: async (id: string, input: Partial<SalesAccountInput>) => (
    await request<{ account: SalesAccount }>(`/sales/accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  ).account,
  listAccess: async () => (await request<{ employees: SalesEmployeeAccess[] }>('/sales/access')).employees,
  setAccess: (employeeId: string, salesAccess: boolean) => request<{ salesAccess: boolean }>(
    `/sales/access/${encodeURIComponent(employeeId)}`,
    { method: 'PATCH', body: JSON.stringify({ salesAccess }) },
  ),
  addTechnology: async (accountId: string, name: string) => (
    await request<{ technology: SalesAccountProfile['technologies'][number] }>(
      `/sales/accounts/${encodeURIComponent(accountId)}/technologies`,
      { method: 'POST', body: JSON.stringify({ name }) },
    )
  ).technology,
  removeTechnology: (accountId: string, technologyId: string) => request<void>(
    `/sales/accounts/${encodeURIComponent(accountId)}/technologies/${encodeURIComponent(technologyId)}`,
    { method: 'DELETE' },
  ),
  createRecord: async (accountId: string, kind: SalesRecordKind, input: object) => (
    await request<{ record: SalesContact | SalesActivity | SalesLead | SalesOpportunity | SalesNote }>(
      `/sales/accounts/${encodeURIComponent(accountId)}/records/${kind}`,
      { method: 'POST', body: JSON.stringify(input) },
    )
  ).record,
  updateRecord: async (accountId: string, kind: SalesRecordKind, recordId: string, input: object) => (
    await request<{ record: SalesContact | SalesActivity | SalesLead | SalesOpportunity | SalesNote }>(
      `/sales/accounts/${encodeURIComponent(accountId)}/records/${kind}/${encodeURIComponent(recordId)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    )
  ).record,
  removeRecord: (accountId: string, kind: SalesRecordKind, recordId: string) => request<void>(
    `/sales/accounts/${encodeURIComponent(accountId)}/records/${kind}/${encodeURIComponent(recordId)}`,
    { method: 'DELETE' },
  ),
};
