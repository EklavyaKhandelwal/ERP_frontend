import type { SalesActivity } from '../../lib/api/types';

export type ActivityType = SalesActivity['type'];

export const activityTypes: ActivityType[] = ['Call', 'Email', 'Meeting', 'LinkedIn outreach', 'Follow-up'];

export const activityTypeLabels: Record<ActivityType, string> = {
  Call: 'Calls',
  Email: 'Emails',
  Meeting: 'Meetings',
  'LinkedIn outreach': 'LinkedIn',
  'Follow-up': 'Follow-ups',
};

export const activityTypeClasses: Record<ActivityType, string> = {
  Call: 'call',
  Email: 'email',
  Meeting: 'meeting',
  'LinkedIn outreach': 'linkedin',
  'Follow-up': 'follow-up',
};

export const activityTypeColors: Record<ActivityType, string> = {
  Call: '#2864E8',
  Email: '#16A785',
  Meeting: '#875BF7',
  'LinkedIn outreach': '#F79009',
  'Follow-up': '#E5484D',
};
