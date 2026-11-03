import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import {
  leavesApi,
  notificationsApi,
  resignationsApi,
  type LeavePolicy,
  type LeavePolicyChange,
  type NotificationPreferences,
  type ResignationPolicy,
  type ResignationPolicyChange,
} from '../../lib/api';

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

const leaveEntitlements = [
  {
    type: 'Casual Leave (CL)',
    entitlement: '12 days per calendar year',
    purpose: 'For personal matters and unforeseen short absences. Apply in advance where practicable.',
  },
  {
    type: 'Sick Leave (SL)',
    entitlement: '12 days per calendar year',
    purpose: 'For illness or medical needs. A medical certificate may be requested for extended absence, subject to law.',
  },
  {
    type: 'Leave Without Pay (LWP)',
    entitlement: 'As approved',
    purpose: 'May be considered when paid leave is exhausted or additional leave is requested. Salary treatment will follow law and policy.',
  },
] as const;

const leavePolicySections = [
  {
    heading: '1.2 Leave Year and Proration',
    paragraphs: [
      'Unless a different lawful method is specified by the Company, the leave year will run from 1 January to 31 December. Leave entitlement for employees joining or leaving during the year may be prorated where permitted by applicable law.',
      'HR will maintain individual leave balances and communicate them through the designated HR system or official records.',
    ],
  },
  {
    heading: '1.3 Applying for Leave',
    paragraphs: [
      'Planned leave should normally be requested at least 5 working days in advance through the HR system or official email.',
      'Employees must obtain approval from their reporting manager before taking planned leave.',
      'For illness or emergencies, employees must notify their reporting manager and HR as soon as reasonably possible.',
      'Managers should review requests fairly, considering staffing requirements, urgency and leave balance.',
      'A leave request is not approved until confirmation is provided by the authorized approver.',
      'No carry forward leaves applicable.',
    ],
  },
  {
    heading: '1.4 Supporting Documents',
    paragraphs: [
      'The Company may request reasonable supporting documents for extended sick leave or other leave categories where permitted by applicable law. Any personal or medical information received must be handled confidentially and only by authorized personnel.',
    ],
  },
  {
    heading: '1.5 Weekly Offs and Holidays',
    paragraphs: [
      'Weekly offs and the annual public/festival holiday calendar will be communicated by HR. National and festival holidays, compensatory holidays and work on weekly offs will be administered in accordance with applicable central and state laws and the Company’s published calendar.',
    ],
  },
  {
    heading: '1.6 Leave During Notice Period',
    paragraphs: [
      'Leave during the notice period requires prior written approval, except where emergency or statutory leave protections apply.',
      'Approved leave does not automatically extend the notice period; any adjustment must be consistent with applicable law and the employment agreement and confirmed in writing.',
    ],
  },
  {
    heading: '1.7 Unauthorized Absence',
    paragraphs: [
      'Absence without notification or approval may be reviewed under the Company’s attendance and disciplinary procedures. The employee will be given an opportunity to explain the absence, and any action or salary treatment will be consistent with applicable law and due process.',
    ],
  },
] as const;

const attendancePolicySections = [
  {
    heading: '1. Purpose',
    paragraphs: [
      'To establish clear guidelines for employee attendance, working hours, punctuality, leave management, and remote work to ensure accountability, productivity, and effective team collaboration.',
    ],
  },
  {
    heading: '2. Working Hours',
    paragraphs: [
      'Employees must adhere to their assigned working hours and shifts.',
      'Employees are expected to be available during official working hours.',
      'Any changes to working schedules must be approved by the reporting manager or HR.',
      'Employees must attend scheduled meetings and complete assigned tasks on time.',
    ],
  },
  {
    heading: '3. Attendance & Punctuality',
    paragraphs: [
      'Employees must mark their attendance daily through the designated attendance system.',
      'Employees are expected to log in on time and maintain regular attendance.',
      'Late arrivals, early departures, and extended breaks must be communicated to the reporting manager.',
      'Any missed attendance entries must be reported to HR for correction.',
      'Unauthorized absence may be treated as a leave of absence or handled as per company policy.',
    ],
  },
  {
    heading: '4. Remote Work / Work From Home',
    paragraphs: [
      'Work From Home (WFH) is subject to prior approval from the reporting manager or HR.',
      'Employees working remotely must remain available during their assigned working hours.',
      'Employees must maintain productivity and meet assigned deadlines.',
      'Employees must attend all scheduled team meetings and respond to work-related communications promptly.',
      'Employees should ensure a stable internet connection and a suitable working environment.',
    ],
  },
  {
    heading: '5. Camera & Meeting Etiquette',
    paragraphs: [
      'Employees are expected to keep their cameras ON during scheduled virtual meetings, unless otherwise permitted by the meeting organizer or HR.',
      'Employees must join meetings on time.',
      'Professional communication and appropriate meeting etiquette must be maintained.',
      'Employees should ensure a clean and professional background during video meetings.',
    ],
  },
  {
    heading: '6. Breaks & Availability',
    paragraphs: [
      "Employees must follow the company's designated break timings.",
      'Any extended breaks or personal commitments during working hours must be informed to the reporting manager.',
      'Employees should update their availability status when stepping away from work.',
    ],
  },
  {
    heading: '7. Leave & Absence',
    paragraphs: [
      'Planned leave must be applied for in advance through the designated process.',
      'Emergency leave or unexpected absence must be communicated to the reporting manager and HR as early as possible.',
      'Leave is subject to approval and applicable company leave policies.',
      'Employees must ensure proper handover of pending tasks before planned leave.',
    ],
  },
  {
    heading: '8. Internet & Technical Issues',
    paragraphs: [
      'Employees must immediately inform their reporting manager about internet, power, or technical issues affecting work.',
      'Employees should make reasonable efforts to restore connectivity or arrange an alternative working solution.',
      'Extended interruptions must be communicated to HR and the reporting manager.',
    ],
  },
  {
    heading: '9. Confidentiality & Data Security',
    paragraphs: [
      'Employees must protect company information and confidential documents while working remotely.',
      'Official company systems and approved communication channels must be used for work.',
      'Employees must not share company data with unauthorized individuals.',
    ],
  },
  {
    heading: '10. Policy Compliance',
    paragraphs: [
      'All employees are expected to follow the attendance and remote work guidelines.',
      'Repeated violations, unauthorized absences, or failure to meet work expectations may result in appropriate action in accordance with company policies.',
      'HR reserves the right to review and update this policy based on business requirements.',
    ],
  },
] as const;

const policyContent: Record<'Work Standards' | 'Resignation Policy', {
  title: string;
  items: { heading: string; description: string }[];
}> = {
  'Work Standards': {
    title: 'Attendance & Remote Work Policy',
    items: [],
  },
  'Resignation Policy': {
    title: 'Resignation & Employee Exit Policy',
    items: [
      {
        heading: '1.',
        description: 'Employees must submit their resignation through the official HR portal and notify their reporting manager and HR.',
      },
      {
        heading: '2.',
        description: 'The resignation request must include the proposed last working day and reason for resignation, where required.',
      },
      {
        heading: '3.',
        description: 'HR and the reporting manager will review the resignation request and communicate the next steps.',
      },
      {
        heading: '4.',
        description: 'Employees must serve the applicable notice period as specified in their employment agreement or company policy.',
      },
      {
        heading: '5.',
        description: 'Any request for notice period reduction or waiver requires management approval.',
      },
      {
        heading: '6.',
        description: 'Employees must continue performing their assigned duties and maintain professional conduct throughout the notice period.',
      },
      {
        heading: '7.',
        description: 'Employees must complete the handover of responsibilities, ongoing projects, documents, and pending tasks before their last working day.',
      },
      {
        heading: '8.',
        description: 'All company assets, including laptops, ID cards, access cards, and other equipment, must be returned before exit clearance.',
      },
      {
        heading: '9.',
        description: 'Employees must ensure that company data, confidential information, and credentials are handled securely and must not retain unauthorized copies after leaving.',
      },
      {
        heading: '10.',
        description: 'HR will coordinate the exit interview, clearance process, and completion of required exit documentation.',
      },
      {
        heading: '11.',
        description: 'Any pending leave, attendance discrepancies, salary dues, or other outstanding matters will be reviewed as part of the exit process.',
      },
      {
        heading: '12.',
        description: 'The Full & Final Settlement will be processed in accordance with applicable law and company policy.',
      },
      {
        heading: '13.',
        description: 'Relieving letters and experience certificates will be issued upon successful completion of exit formalities, subject to applicable company policy.',
      },
      {
        heading: '14.',
        description: 'Employees must return all company property and complete the required knowledge transfer before their last working day.',
      },
      {
        heading: '15.',
        description: "HR will update the employee's status in the HR portal and maintain the necessary separation records.",
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
  const [resignationPolicy, setResignationPolicy] = useState<ResignationPolicy>({ noticeDays: 30, reviewReminderDays: 7 });
  const [resignationPolicyHistory, setResignationPolicyHistory] = useState<ResignationPolicyChange[]>([]);
  const [isResignationPolicyLoading, setIsResignationPolicyLoading] = useState(false);
  const [isResignationPolicyLoaded, setIsResignationPolicyLoaded] = useState(false);
  const [isResignationPolicySaving, setIsResignationPolicySaving] = useState(false);
  const [resignationPolicyError, setResignationPolicyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    if (activeTab !== 'Resignation Policy') return;
    let active = true;
    const policyRequest = resignationsApi.getPolicy()
      .then(policy => {
        if (active) {
          setResignationPolicy(policy);
          setIsResignationPolicyLoaded(true);
        }
      })
      .catch(loadError => {
        if (active) setResignationPolicyError(loadError instanceof Error ? loadError.message : 'Unable to load the company resignation policy.');
      });
    const historyRequest = role === 'admin'
      ? resignationsApi.listPolicyHistory()
        .then(history => {
          if (active) setResignationPolicyHistory(history);
        })
        .catch(loadError => {
          if (active) setResignationPolicyError(loadError instanceof Error ? loadError.message : 'Unable to load resignation policy history.');
        })
      : Promise.resolve();
    void Promise.all([policyRequest, historyRequest]).finally(() => {
      if (active) setIsResignationPolicyLoading(false);
    });
    return () => { active = false; };
  }, [activeTab, role, userId]);

  const savePreferences = async () => {
    setError(null);
    setIsSaving(true);
    try {
      setPreferences(await notificationsApi.savePreferences(preferences));
      void refreshNotifications();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (id: string, checked: boolean) => {
    setPreferences(previous => ({ ...previous, [id]: checked }));
  };

  const saveLeavePolicy = async () => {
    setPolicyError(null);
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
    } catch (saveError) {
      setPolicyError(saveError instanceof Error ? saveError.message : 'Unable to save the company leave policy.');
    } finally {
      setIsPolicySaving(false);
    }
  };

  const saveResignationPolicy = async () => {
    setResignationPolicyError(null);
    setIsResignationPolicySaving(true);
    try {
      setResignationPolicy(await resignationsApi.savePolicy(resignationPolicy));
      try {
        setResignationPolicyHistory(await resignationsApi.listPolicyHistory());
      } catch (refreshError) {
        setResignationPolicyError(`Policy saved, but its history could not be refreshed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error.'}`);
      }
    } catch (saveError) {
      setResignationPolicyError(saveError instanceof Error ? saveError.message : 'Unable to save the company resignation policy.');
    } finally {
      setIsResignationPolicySaving(false);
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
              if (tab === 'Resignation Policy' && tab !== activeTab) {
                setIsResignationPolicyLoading(true);
                setIsResignationPolicyLoaded(false);
                setResignationPolicyError(null);
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
                  }}
                  disabled={role !== 'admin' || isPolicyLoading || !isPolicyLoaded || isPolicySaving}
                />
              </label>
            </div>
            <p className="settings-description">
              Pending requests do not reduce the displayed balance, but they are reserved when employees submit additional requests. Policy changes are recorded for HR review.
            </p>
            <p className="leave-policy-configuration-note">
              These configured ERP allowances control employee balances. The proposed policy text below is for review and does not change these values.
            </p>
            {isPolicyLoading && <p className="settings-feedback" role="status">Loading company leave allowances…</p>}
            {policyError && <p className="settings-feedback error" role="alert">{policyError}</p>}
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
            <section className="leave-policy-document" aria-labelledby="leave-policy-document-title">
              <header className="leave-policy-document-header">
                <div>
                  <p className="leave-policy-eyebrow">Company Policy · 2026–2027</p>
                  <h3 id="leave-policy-document-title">LEAVE POLICY</h3>
                </div>
                <span className="leave-policy-draft-badge">Proposed draft</span>
              </header>
              <dl className="leave-policy-metadata">
                <div><dt>Company Name</dt><dd>AAVIL INC</dd></div>
                <div><dt>Effective Date</dt><dd>2026–2027</dd></div>
                <div><dt>Policy Owner</dt><dd>Human Resources Department</dd></div>
                <div><dt>Applicable To</dt><dd>All employees, subject to applicable law and employment terms</dd></div>
              </dl>
              <div className="leave-policy-legal-note" role="note">
                <strong>For review before adoption</strong>
                <p>
                  The leave entitlements below are proposed policy defaults for drafting purposes. Before adoption, HR must verify and align them with the Shops and Establishments law applicable to each work location, other relevant labor laws, and the employee’s terms of employment.
                </p>
              </div>
              <h4 className="leave-policy-section-title">1.1 Types of Leave and Proposed Entitlements</h4>
              <div className="leave-entitlement-table-wrap">
                <table className="leave-entitlement-table">
                  <thead>
                    <tr>
                      <th scope="col">Leave type</th>
                      <th scope="col">Proposed entitlement</th>
                      <th scope="col">Purpose / Conditions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveEntitlements.map(entitlement => (
                      <tr key={entitlement.type}>
                        <th scope="row">{entitlement.type}</th>
                        <td>{entitlement.entitlement}</td>
                        <td>{entitlement.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="leave-policy-sections">
                {leavePolicySections.map(section => (
                  <article key={section.heading} className="leave-policy-section">
                    <span className="leave-policy-number" aria-hidden="true">{section.heading.slice(0, 3)}</span>
                    <div>
                      <h4>{section.heading}</h4>
                      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeTab === 'Resignation Policy' && (
          <section className="interactive-lift-card" style={cardStyle}>
            <h2 className="settings-card-title">{policyContent['Resignation Policy'].title}</h2>
            <p className="settings-description">
              Set the default calendar-day notice period required for new resignation applications. Changes do not alter existing applications.
            </p>
            <label style={{ display: 'grid', gap: '6px', maxWidth: '320px', fontWeight: 600 }}>
              Standard notice period (calendar days)
              <input
                type="number"
                className="form-control"
                min="1"
                max="365"
                step="1"
                value={resignationPolicy.noticeDays}
                onChange={event => setResignationPolicy(previous => ({
                  ...previous,
                  noticeDays: Number(event.target.value),
                }))}
                disabled={role !== 'admin' || isResignationPolicyLoading || !isResignationPolicyLoaded || isResignationPolicySaving}
              />
            </label>
            <label style={{ display: 'grid', gap: '6px', maxWidth: '320px', marginTop: '14px', fontWeight: 600 }}>
              Escalate pending requests after (days)
              <input
                type="number"
                className="form-control"
                min="1"
                max="30"
                step="1"
                value={resignationPolicy.reviewReminderDays}
                onChange={event => setResignationPolicy(previous => ({
                  ...previous,
                  reviewReminderDays: Number(event.target.value),
                }))}
                disabled={role !== 'admin' || isResignationPolicyLoading || !isResignationPolicyLoaded || isResignationPolicySaving}
              />
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                Active administrators receive an in-app escalation once the request reaches this age.
              </span>
            </label>
            {isResignationPolicyLoading && <p className="settings-feedback" role="status">Loading company resignation policy…</p>}
            {resignationPolicyError && <p className="settings-feedback error" role="alert">{resignationPolicyError}</p>}
            {role === 'admin' && (
              <div className="settings-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveResignationPolicy()}
                  disabled={isResignationPolicyLoading || !isResignationPolicyLoaded || isResignationPolicySaving}
                >
                  {isResignationPolicySaving ? 'Saving…' : 'Save Resignation Policy'}
                </button>
              </div>
            )}
            {role === 'admin' && resignationPolicyHistory.length > 0 && (
              <div className="leave-policy-history">
                <h3>Recent policy changes</h3>
                <ul>
                  {resignationPolicyHistory.map((change, index) => (
                    <li key={`${change.changedAt}-${index}`}>
                      <span>{change.noticeDays} notice · {change.reviewReminderDays}-day escalation</span>
                      <small>
                        {change.changedBy ?? 'Administrator'} · {new Date(change.changedAt).toLocaleString('en-IN')}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="settings-policy-list resignation-policy-grid">
              {policyContent['Resignation Policy'].items.map(item => (
                <article key={item.heading} className="resignation-policy-card">
                  <span className="resignation-policy-number" aria-hidden="true">{item.heading}</span>
                  <div>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Work Standards' && (
          <section className="interactive-lift-card" style={cardStyle}>
            <header className="leave-policy-document-header">
              <div>
                <p className="leave-policy-eyebrow">AAVIL Inc. · Human Resources</p>
                <h2 className="settings-card-title">{policyContent['Work Standards'].title}</h2>
              </div>
            </header>
            <dl className="leave-policy-metadata">
              <div><dt>Company</dt><dd>AAVIL Inc.</dd></div>
              <div><dt>Department</dt><dd>Human Resources</dd></div>
              <div><dt>Policy Category</dt><dd>Employee Attendance &amp; Work From Home</dd></div>
              <div><dt>Effective Date</dt><dd>03/11/2026</dd></div>
              <div><dt>Policy Owner</dt><dd>Human Resources</dd></div>
              <div><dt>Approved By</dt><dd>Management</dd></div>
            </dl>
            <div className="leave-policy-sections">
              {attendancePolicySections.map((section, index) => (
                <article key={section.heading} className="leave-policy-section">
                  <span className="leave-policy-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{section.heading}</h3>
                    {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
};
