import type { User } from '../../types/erp';
import { ApiError, request } from './request';
import type {
  AccessLinkResult,
  EmployeeDocument,
  EmployeeDocumentType,
  EmployeeOnboardingDocument,
  ProfileInput,
} from './types';

export const authApi = {
  currentUser: async () => (await request<{ user: User }>('/auth/me')).user,
  updateProfile: async (profile: ProfileInput) => (
    await request<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    })
  ).user,
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
  removeMyDocument: (documentType: Extract<EmployeeDocumentType, 'bond_agreement' | 'nda'>) => (
    request<void>(`/accounts/my-documents/${encodeURIComponent(documentType)}`, { method: 'DELETE' })
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
