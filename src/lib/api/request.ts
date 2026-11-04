import {
  dispatchMutationFeedback,
  mutationFeedback,
  nextMutationRequestId,
} from './mutation-feedback';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const feedback = mutationFeedback(path, method);
  const requestId = feedback ? nextMutationRequestId() : 0;
  if (feedback) {
    dispatchMutationFeedback({
      id: requestId,
      phase: 'saving',
      title: 'Saving changes',
      message: 'Please wait while your changes are saved.',
    });
  }

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
    if (feedback) {
      dispatchMutationFeedback({ id: requestId, phase: 'finished', title: '' });
    }
    const apiAddress = `${window.location.origin}/api${path}`;
    throw new ApiError(
      `Cannot reach ${apiAddress}. For local development, open the Vite frontend and run "corepack pnpm dev:all" so its /api proxy can reach the backend on port 3001.`,
      0,
    );
  }

  if (!response.ok) {
    if (feedback) {
      dispatchMutationFeedback({ id: requestId, phase: 'finished', title: '' });
    }
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(body?.error ?? 'The request could not be completed.', response.status);
  }

  if (response.status === 204) {
    if (feedback) {
      dispatchMutationFeedback({ id: requestId, phase: 'success', title: feedback.title, message: feedback.message });
    }
    return undefined as T;
  }
  let result: T;
  try {
    result = await response.json() as T;
  } catch (error) {
    if (feedback) {
      dispatchMutationFeedback({ id: requestId, phase: 'finished', title: '' });
    }
    throw error;
  }
  if (feedback) {
    dispatchMutationFeedback({ id: requestId, phase: 'success', title: feedback.title, message: feedback.message });
  }
  return result;
}
