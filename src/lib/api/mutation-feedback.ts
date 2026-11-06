export type MutationFeedback = {
  title: string;
  message: string;
};

export type MutationFeedbackEvent = {
  id: number;
  phase: 'saving' | 'success' | 'finished';
  title: string;
  message?: string;
};

let mutationRequestId = 0;

export function nextMutationRequestId(): number {
  mutationRequestId += 1;
  return mutationRequestId;
}

export function mutationFeedback(path: string, method: string): MutationFeedback | null {
  const normalizedPath = path.split('?')[0];
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null;
  if (method === 'PATCH' && normalizedPath === '/auth/profile') {
    return { title: 'Profile updated', message: 'Your personal profile details have been saved.' };
  }
  if (method === 'PATCH' && normalizedPath === '/auth/profile/avatar') {
    return { title: 'Profile photo updated', message: 'Your new profile photo is now saved.' };
  }
  if (method === 'POST' && normalizedPath === '/accounts/admins/invitations') {
    return { title: 'Invitation created', message: 'The administrator invitation is ready.' };
  }
  if (method === 'POST' && /^\/accounts\/admins\/[^/]+\/invitation$/.test(normalizedPath)) {
    return { title: 'Invitation sent', message: 'The administrator invitation has been renewed.' };
  }
  if (method === 'PATCH' && /^\/accounts\/(admins|employees)\/[^/]+\/active$/.test(normalizedPath)) {
    return { title: 'Account updated', message: 'The account access change has been saved.' };
  }
  if (method === 'POST' && /^\/accounts\/employees\/[^/]+\/access-link$/.test(normalizedPath)) {
    return { title: 'Access link created', message: 'The employee access link is ready.' };
  }
  if (method === 'PUT' && /^\/accounts\/my-documents\//.test(normalizedPath)) {
    return { title: 'Document replaced', message: 'Your onboarding document has been updated.' };
  }
  if (method === 'PUT' && normalizedPath === '/notifications/preferences') {
    return { title: 'Preferences saved', message: 'Your notification preferences have been updated.' };
  }
  if (method === 'POST' && normalizedPath === '/employees') {
    return { title: 'Employee added', message: 'The employee profile has been created.' };
  }
  if (method === 'PATCH' && /^\/employees\/[^/]+$/.test(normalizedPath)) {
    return { title: 'Employee updated', message: 'The employee profile changes have been saved.' };
  }
  if (normalizedPath === '/leave-requests/holidays') {
    if (method === 'POST') return { title: 'Holiday added', message: 'The holiday is now on the company calendar.' };
  }
  if (/^\/leave-requests\/holidays\/[^/]+$/.test(normalizedPath)) {
    if (method === 'PATCH') return { title: 'Holiday updated', message: 'The company calendar has been updated.' };
    if (method === 'DELETE') return { title: 'Holiday removed', message: 'The holiday was removed from the company calendar.' };
  }
  if (method === 'PUT' && normalizedPath === '/leave-requests/policy') {
    return { title: 'Leave policy saved', message: 'Company leave allowances have been updated.' };
  }
  if (method === 'POST' && normalizedPath === '/leave-requests') {
    return { title: 'Leave request submitted', message: 'Your leave request has been sent for review.' };
  }
  if (method === 'PATCH' && /^\/leave-requests\/[^/]+\/review$/.test(normalizedPath)) {
    return { title: 'Leave review saved', message: 'The leave request decision has been recorded.' };
  }
  if (method === 'POST' && normalizedPath === '/projects') {
    return { title: 'Project created', message: 'The new project has been added.' };
  }
  if (method === 'PUT' && /^\/projects\/[^/]+\/members$/.test(normalizedPath)) {
    return { title: 'Project team updated', message: 'The project team changes have been saved.' };
  }
  if (method === 'POST' && /^\/projects\/[^/]+\/tasks$/.test(normalizedPath)) {
    return { title: 'Task created', message: 'The task has been added to the project.' };
  }
  if (method === 'PATCH' && /^\/projects\/[^/]+\/tasks\/[^/]+$/.test(normalizedPath)) {
    return { title: 'Task updated', message: 'The task changes have been saved.' };
  }
  if (method === 'POST' && normalizedPath === '/timesheets') {
    return { title: 'Timesheet saved', message: 'Your weekly timesheet has been saved.' };
  }
  if (method === 'PATCH' && /^\/timesheets\/[^/]+$/.test(normalizedPath)) {
    return { title: 'Timesheet updated', message: 'Your timesheet changes have been saved.' };
  }
  if (method === 'PATCH' && /^\/timesheets\/[^/]+\/review$/.test(normalizedPath)) {
    return { title: 'Timesheet review saved', message: 'The timesheet review decision has been recorded.' };
  }
  if (method === 'POST' && normalizedPath === '/attendance/clock-in') {
    return { title: 'Clocked in', message: 'Your attendance start time has been recorded.' };
  }
  if (method === 'POST' && normalizedPath === '/attendance/clock-out') {
    return { title: 'Clocked out', message: 'Your attendance end time has been recorded.' };
  }
  if (method === 'PATCH' && /^\/attendance\/[^/]+$/.test(normalizedPath)) {
    return { title: 'Attendance updated', message: 'The correction has been added to the attendance audit history.' };
  }
  if (method === 'POST' && normalizedPath === '/payroll/runs') {
    return { title: 'Payroll run created', message: 'The payroll records have been saved.' };
  }
  if (method === 'PATCH' && /^\/payroll\/[^/]+\/status$/.test(normalizedPath)) {
    return { title: 'Payroll status updated', message: 'The payroll record status has been changed.' };
  }
  if (method === 'POST' && normalizedPath === '/appraisals/cycles') {
    return { title: 'Appraisal cycle started', message: 'Selected employees have been notified to complete their self-review.' };
  }
  if (method === 'PATCH' && /^\/appraisals\/[^/]+\/self-assessment$/.test(normalizedPath)) {
    return { title: 'Self-review submitted', message: 'Your appraisal self-assessment has been sent to the administrator.' };
  }
  if (method === 'PATCH' && /^\/appraisals\/[^/]+\/admin-review$/.test(normalizedPath)) {
    return { title: 'Appraisal completed', message: 'The employee review and ratings have been saved.' };
  }
  if (method === 'POST' && normalizedPath === '/resignations') {
    return { title: 'Application submitted', message: 'Your resignation application has been sent for review.' };
  }
  if (method === 'PATCH' && /^\/resignations\/[^/]+\/review$/.test(normalizedPath)) {
    return { title: 'Application reviewed', message: 'The resignation review decision has been saved.' };
  }
  if (
    normalizedPath.startsWith('/auth/')
    || ['/accounts/complete-setup', '/accounts/onboarding', '/notifications/read'].includes(normalizedPath)
  ) {
    return null;
  }
  return { title: 'Changes saved', message: 'Your changes have been saved successfully.' };
}

export function dispatchMutationFeedback(event: MutationFeedbackEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<MutationFeedbackEvent>('app:mutation-feedback', { detail: event }));
  }
}
