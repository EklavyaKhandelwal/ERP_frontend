import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { leavesApi, notificationsApi, type LeavePolicy, type LeavePolicyChange, type NotificationPreferences } from '../../lib/api';

type SettingsTab = 'Profile' | 'Notifications' | 'Work Standards' | 'Leave Policy' | 'Resignation Policy';

const tabs: SettingsTab[] = ['Profile', 'Notifications', 'Work Standards', 'Leave Policy', 'Resignation Policy'];

const notificationOptions = [
  { id: 'leaveRequests', title: 'Leave Requests', description: 'Get notified when employees submit leave requests' },
  { id: 'timesheetSubmissions', title: 'Timesheet Submissions', description: 'Receive alerts for pending timesheet approvals' },
  { id: 'appraisalCycleUpdates', title: 'Appraisal Cycle Updates', description: 'Get notified when a new review cycle is ready' },
  { id: 'employeeOnboarding', title: 'New Employee Onboarding', description: 'Alerts when new employees are added' },
  { id: 'projectMilestones', title: 'Project Milestones', description: 'Updates when projects are assigned or reach progress milestones' },
] as const;

const defaultPreferences: NotificationPreferences = {
  leaveRequests: true,
  timesheetSubmissions: true,
  appraisalCycleUpdates: true,
  employeeOnboarding: true,
  projectMilestones: false,
};

const defaultLeavePolicy: LeavePolicy = {
  annual: 20,
  sick: 10,
  casual: 6,
};

const policyContent: Record<'Work Standards' | 'Leave Policy' | 'Resignation Policy', {
  title: string;
  items: { heading: string; description: string }[];
}> = {
  'Work Standards': {
    title: 'Conduct & Work Standards',
    items: [
      {
        heading: 'Behaviour & Data',
        description: 'Treat colleagues fairly and respectfully. Protect company and client information, intellectual property, and assets.',
      },
      {
        heading: 'Attendance & Remote Work',
        description: 'Maintain agreed working hours, record timesheets accurately, and stay reachable through official channels while working remotely.',
      },
      {
        heading: 'Performance & Growth',
        description: 'Participate in performance reviews and use feedback and development opportunities to support your professional growth.',
      },
    ],
  },
  'Leave Policy': {
    title: 'Leave & Access Rights',
    items: [
      {
        heading: 'Leave Quotas & Balances',
        description: 'Your leave balances are shown in the employee workspace and reflect the allowances configured for your account.',
      },
      {
        heading: 'Leave Application Protocols',
        description: 'Submit leave requests through the ERP and wait for an authorized administrator to review them. For unexpected absences, notify your manager as soon as possible.',
      },
      {
        heading: 'Role-Based Access',
        description: 'Access to employee, leave, timesheet, and payroll information is limited according to your account role.',
      },
      {
        heading: 'Data Restrictions & Security',
        description: 'Sensitive employee and payroll records are available only to authorized users.',
      },
    ],
  },
  'Resignation Policy': {
    title: 'Separation & Exit',
    items: [
      {
        heading: 'Resignation Submission',
        description: 'Submit a resignation application through the Resignation section so HR can review and track your request.',
      },
      {
        heading: 'Notice Period',
        description: 'The application requires a proposed last working day at least 30 days after submission. The request remains pending until an administrator reviews it.',
      },
      {
        heading: 'Overdue Applications',
        description: 'Pending applications that have not received a response after 7 days are escalated to administrators. Escalation does not automatically approve the request.',
      },
      {
        heading: 'Handover & Clearance',
        description: 'Coordinate work handover and return company property with your manager and HR before your final working day.',
      },
    ],
  },
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '14px',
  padding: '22px',
};

export const SettingsView: React.FC = () => {
  const { currentUser } = useERP();
  return <SettingsContent key={currentUser.id} userId={currentUser.id} />;
};

const SettingsContent: React.FC<{ userId: string }> = ({ userId }) => {
  const { role, refreshNotifications, refreshEmployees } = useERP();
  const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [leavePolicy, setLeavePolicy] = useState<LeavePolicy>(defaultLeavePolicy);
  const [policyHistory, setPolicyHistory] = useState<LeavePolicyChange[]>([]);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [isPolicyLoaded, setIsPolicyLoaded] = useState(false);
  const [isPolicySaving, setIsPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void notificationsApi.getPreferences()
      .then(saved => {
        if (active) setPreferences(saved);
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load notification preferences.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (activeTab !== 'Leave Policy') return;
    let active = true;
    const policyRequest = leavesApi.getPolicy()
      .then(policy => {
        if (active) {
          setLeavePolicy(policy);
          setIsPolicyLoaded(true);
        }
      })
      .catch(loadError => {
        if (active) setPolicyError(loadError instanceof Error ? loadError.message : 'Unable to load the company leave policy.');
      });
    const historyRequest = role === 'admin'
      ? leavesApi.listPolicyHistory()
        .then(history => {
          if (active) setPolicyHistory(history);
        })
        .catch(loadError => {
          if (active) setPolicyError(loadError instanceof Error ? loadError.message : 'Unable to load leave policy history.');
        })
      : Promise.resolve();
    void Promise.all([policyRequest, historyRequest]).finally(() => {
      if (active) setIsPolicyLoading(false);
    });
    return () => { active = false; };
  }, [activeTab, role, userId]);

  const savePreferences = async () => {
    setSaveMessage(null);
    setError(null);
    setIsSaving(true);
    try {
      setPreferences(await notificationsApi.savePreferences(preferences));
      setSaveMessage('Notification preferences saved.');
      void refreshNotifications();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (id: string, checked: boolean) => {
    setPreferences(previous => ({ ...previous, [id]: checked }));
    setSaveMessage(null);
  };

  const saveLeavePolicy = async () => {
    setPolicyError(null);
    setPolicyMessage(null);
    setIsPolicySaving(true);
    try {
      const saved = await leavesApi.savePolicy(leavePolicy);
      setLeavePolicy(saved);
      try {
        await refreshEmployees();
        setPolicyHistory(await leavesApi.listPolicyHistory());
      } catch (refreshError) {
        setPolicyError(`Policy saved, but related data could not be refreshed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error.'}`);
        return;
      }
      setPolicyMessage('Company leave allowances saved. Existing balances were adjusted to preserve leave already used.');
    } catch (saveError) {
      setPolicyError(saveError instanceof Error ? saveError.message : 'Unable to save the company leave policy.');
    } finally {
      setIsPolicySaving(false);
    }
  };

  return (
    <div className="settings-page">
      <nav className="settings-tabs" aria-label="Settings sections" role="tablist" aria-orientation="vertical">
        {tabs.map(tab => (
          <button
            key={tab}
            id={`settings-tab-${tab.toLowerCase().replaceAll(' ', '-')}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls="settings-panel"
            className={`settings-tab interactive-lift-card${activeTab === tab ? ' active' : ''}`}
            onClick={() => {
              if (tab === 'Leave Policy' && tab !== activeTab) {
                setIsPolicyLoading(true);
                setIsPolicyLoaded(false);
                setPolicyError(null);
              }
              setActiveTab(tab);
            }}
          >
            {tab}
            <ChevronRight className="arrow-lift-trigger" size={14} aria-hidden="true" />
          </button>
        ))}
      </nav>

      <section
        id="settings-panel"
        className="settings-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab.toLowerCase().replaceAll(' ', '-')}`}
      >
        {activeTab === 'Profile' && (
          <section className="interactive-lift-card" style={cardStyle}>
            <h2 className="settings-card-title">Organization Info</h2>
            <dl className="settings-info-list">
              <div><dt>Company Name</dt><dd>AAVIL Inc.</dd></div>
              <div><dt>Company Email</dt><dd>Managed by your administrator</dd></div>
              <div><dt>Timezone</dt><dd>{Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local timezone'}</dd></div>
              <div><dt>Date Format</dt><dd>Based on your browser locale</dd></div>
            </dl>
          </section>
        )}

        {activeTab === 'Notifications' && (
          <section className="interactive-lift-card" style={cardStyle}>
            <h2 className="settings-card-title">Notification Preferences</h2>
            <p className="settings-description">Choose which notification categories you want to enable.</p>
            <div className="settings-notification-list">
              {notificationOptions.map(option => (
                <div className="settings-notification-row" key={option.id}>
                  <div>
                    <h3>{option.title}</h3>
                    <p>{option.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences[option.id]}
                    aria-label={option.title}
                    className={`settings-switch${preferences[option.id] ? ' checked' : ''}`}
                    onClick={() => updatePreference(option.id, !preferences[option.id])}
                  >
                    <span />
                  </button>
                </div>
              ))}
            </div>
            {isLoading && <p className="settings-feedback" role="status">Loading notification preferences…</p>}
            {error && <p className="settings-feedback error" role="alert">{error}</p>}
            {saveMessage && <p className="settings-feedback success" role="status">{saveMessage}</p>}
            <div className="settings-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void savePreferences()}
                disabled={isLoading || isSaving}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'Leave Policy' && (
          <section className="interactive-lift-card" style={cardStyle}>
            <h2 className="settings-card-title">Company Leave Allowances</h2>
            <p className="settings-description">
              Set the standard leave allowance for employees. Balances renew every January 1 and unused days do not automatically carry over. Approved days already used are preserved when an allowance changes; new employees receive the current policy.
            </p>
            <div className="leave-policy-fields">
              <label>
                Annual leave (days)
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="366"
                  step="1"
                  value={leavePolicy.annual}
                  onChange={event => {
                    setLeavePolicy(previous => ({ ...previous, annual: Number(event.target.value) }));
                    setPolicyMessage(null);
                  }}
                  disabled={role !== 'admin' || isPolicyLoading || !isPolicyLoaded || isPolicySaving}
                />
              </label>
              <label>
                Sick leave (days)
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="366"
                  step="1"
                  value={leavePolicy.sick}
                  onChange={event => {
                    setLeavePolicy(previous => ({ ...previous, sick: Number(event.target.value) }));
                    setPolicyMessage(null);
                  }}
                  disabled={role !== 'admin' || isPolicyLoading || !isPolicyLoaded || isPolicySaving}
                />
              </label>
              <label>
                Casual leave (days)
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="366"
                  step="1"
                  value={leavePolicy.casual}
                  onChange={event => {
                    setLeavePolicy(previous => ({ ...previous, casual: Number(event.target.value) }));
                    setPolicyMessage(null);
                  }}
                  disabled={role !== 'admin' || isPolicyLoading || !isPolicyLoaded || isPolicySaving}
                />
              </label>
            </div>
            <p className="settings-description">
              Pending requests do not reduce the displayed balance, but they are reserved when employees submit additional requests. Policy changes are recorded for HR review.
            </p>
            {isPolicyLoading && <p className="settings-feedback" role="status">Loading company leave allowances…</p>}
            {policyError && <p className="settings-feedback error" role="alert">{policyError}</p>}
            {policyMessage && <p className="settings-feedback success" role="status">{policyMessage}</p>}
            {role === 'admin' && (
              <div className="settings-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveLeavePolicy()}
                  disabled={isPolicyLoading || !isPolicyLoaded || isPolicySaving}
                >
                  {isPolicySaving ? 'Saving…' : 'Save Leave Policy'}
                </button>
              </div>
            )}
            {role === 'admin' && policyHistory.length > 0 && (
              <div className="leave-policy-history">
                <h3>Recent policy changes</h3>
                <ul>
                  {policyHistory.map((change, index) => (
                    <li key={`${change.changedAt}-${index}`}>
                      <span>
                        {change.annual} annual · {change.sick} sick · {change.casual} casual days
                      </span>
                      <small>
                        {change.changedBy ?? 'Administrator'} · {new Date(change.changedAt).toLocaleString('en-IN')}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {(activeTab === 'Work Standards' || activeTab === 'Resignation Policy') && (
          <section className="interactive-lift-card" style={cardStyle}>
            <h2 className="settings-card-title">{policyContent[activeTab].title}</h2>
            <div className="settings-policy-list">
              {policyContent[activeTab].items.map(item => (
                <article key={item.heading} className="settings-policy-item interactive-lift-card">
                  <h3>{item.heading}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
};
