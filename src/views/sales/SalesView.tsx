import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, Building2, CircleCheck, CirclePlus, ExternalLink, Eye, Pencil, Plus, Search, Trash2, Users, CalendarClock, Target, BriefcaseBusiness, Cpu, Mail, Phone } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { salesApi } from '../../lib/api';
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
} from '../../lib/api/types';
import type { SalesRecordKind } from '../../lib/api/sales';

type AccountTab = 'Dashboard' | 'Account Information' | 'Technology' | 'Contacts' | 'Activities' | 'Leads' | 'Opportunities' | 'Notes';
type ModalKind = 'account' | 'contacts' | 'activities' | 'leads' | 'opportunities' | 'notes';
type Counts = { total: number; prospect: number; active: number };
type SalesRecord = SalesContact | SalesActivity | SalesLead | SalesOpportunity | SalesNote;
const recordLabel: Record<SalesRecordKind, string> = {
  contacts: 'contact',
  activities: 'activity',
  leads: 'lead',
  opportunities: 'opportunity',
  notes: 'note',
};

const tabs: AccountTab[] = ['Dashboard', 'Account Information', 'Technology', 'Contacts', 'Activities', 'Leads', 'Opportunities', 'Notes'];
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #DDE2EA', borderRadius: 8,
  font: 'inherit', fontSize: 13, boxSizing: 'border-box', background: '#fff',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: 38,
};
const primaryButton: React.CSSProperties = {
  border: 0, borderRadius: 8, padding: '10px 14px', color: '#fff', background: 'linear-gradient(135deg, #3478F6, #155EEF)',
  boxShadow: '0 3px 8px rgba(21, 94, 239, 0.18)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
const quietButton: React.CSSProperties = {
  border: '1px solid #DDE5F3', borderRadius: 8, padding: '9px 12px', color: '#344054',
  background: 'linear-gradient(180deg, #FFFFFF, #F8FAFF)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
const panelStyle: React.CSSProperties = {
  padding: 20, border: '1px solid #E8EBF0', borderRadius: 12, background: '#fff',
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'The sales request could not be completed.';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 6, color: '#475467', fontSize: 12, fontWeight: 600 }}>
    {label}{children}
  </label>;
}

function statusColor(status: string) {
  const tones: Record<string, { color: string; background: string }> = {
    Prospect: { color: '#B54708', background: '#FFF4DB' },
    Active: { color: '#067647', background: '#E8F8EF' },
    Won: { color: '#067647', background: '#E8F8EF' },
    Qualified: { color: '#067647', background: '#E8F8EF' },
    Converted: { color: '#067647', background: '#E8F8EF' },
    New: { color: '#175CD3', background: '#EAF2FF' },
    Contacted: { color: '#175CD3', background: '#EAF2FF' },
    Prospecting: { color: '#6941C6', background: '#F1EBFF' },
    Qualification: { color: '#6941C6', background: '#F1EBFF' },
    Proposal: { color: '#B54708', background: '#FFF4DB' },
    Negotiation: { color: '#B54708', background: '#FFF4DB' },
    Lost: { color: '#B42318', background: '#FEECEB' },
    Disqualified: { color: '#B42318', background: '#FEECEB' },
    Inactive: { color: '#667085', background: '#F2F4F7' },
  };
  return tones[status] ?? { color: '#475467', background: '#F2F4F7' };
}

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export const SalesView: React.FC = () => {
  const { currentUser, role, employees, refreshEmployees, salesSection, setSalesSection } = useERP();
  const isAdmin = role === 'admin';
  const [accounts, setAccounts] = useState<SalesAccount[]>([]);
  const [recentAccounts, setRecentAccounts] = useState<SalesAccount[]>([]);
  const [followUps, setFollowUps] = useState<SalesDashboardFollowUp[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, prospect: 0, active: 0 });
  const [profile, setProfile] = useState<SalesAccountProfile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [tab, setTab] = useState<AccountTab>('Account Information');
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'All' | SalesContact['status']>('All');
  const [viewingContact, setViewingContact] = useState<SalesContact | null>(null);
  const [activityContactId, setActivityContactId] = useState<string | null>(null);
  const [globalContacts, setGlobalContacts] = useState<SalesContactListItem[]>([]);
  const [globalContactsLoading, setGlobalContactsLoading] = useState(true);
  const [globalContactSearch, setGlobalContactSearch] = useState('');
  const [appliedGlobalContactSearch, setAppliedGlobalContactSearch] = useState('');
  const [globalContactStatus, setGlobalContactStatus] = useState<'All' | SalesContact['status']>('All');
  const [globalContactAddOpen, setGlobalContactAddOpen] = useState(false);
  const [contactAccountOptions, setContactAccountOptions] = useState<SalesAccount[]>([]);
  const [globalContactSaving, setGlobalContactSaving] = useState(false);
  const [teamUpdates, setTeamUpdates] = useState<SalesTeamUpdate[]>([]);
  const [teamUpdatesLoading, setTeamUpdatesLoading] = useState(true);
  const [updatesOwnerFilter, setUpdatesOwnerFilter] = useState('');
  const [updatesAccountFilter, setUpdatesAccountFilter] = useState('');
  const [updatesTypeFilter, setUpdatesTypeFilter] = useState<'' | SalesActivity['type']>('');
  const [updatesFromDate, setUpdatesFromDate] = useState('');
  const [updatesToDate, setUpdatesToDate] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Prospect' | 'Active'>('All');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [accessEmployees, setAccessEmployees] = useState<SalesEmployeeAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [editing, setEditing] = useState<SalesRecord | SalesAccount | null>(null);
  const [technologyName, setTechnologyName] = useState('');
  const [savingTechnology, setSavingTechnology] = useState(false);
  const [followUpTodayKey] = useState(() => new Date().toISOString().slice(0, 10));

  const loadAccounts = useCallback(async (filters?: { search?: string; status?: 'Prospect' | 'Active'; ownerEmployeeId?: string }) => {
    const result = await salesApi.listAccounts(filters);
    setAccounts(result.accounts);
    setCounts(result.counts);
    setRecentAccounts(result.recentAccounts);
    setFollowUps(result.followUps);
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    const data = await salesApi.getAccount(id);
    setProfile(data);
  }, []);
  const loadGlobalContacts = useCallback(async (filters: { search?: string; status?: SalesContact['status'] } = {}) => {
    const result = await salesApi.listContacts(filters);
    setGlobalContacts(result.contacts);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      salesApi.listAccounts().then(result => {
        if (active) {
          setAccounts(result.accounts);
          setCounts(result.counts);
          setRecentAccounts(result.recentAccounts);
          setFollowUps(result.followUps);
        }
      }),
      isAdmin ? salesApi.listAccess().then(records => { if (active) setAccessEmployees(records); }) : Promise.resolve(),
    ]).catch((loadError: unknown) => {
      if (active) setError(messageOf(loadError));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [isAdmin]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAccounts({
        ...(appliedSearch ? { search: appliedSearch } : {}),
        ...(statusFilter !== 'All' ? { status: statusFilter } : {}),
        ...(isAdmin && ownerFilter ? { ownerEmployeeId: ownerFilter } : {}),
      }).catch((loadError: unknown) => setError(messageOf(loadError)));
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [appliedSearch, statusFilter, ownerFilter, isAdmin, loadAccounts]);

  useEffect(() => {
    if (!selectedAccountId) return;
    let active = true;
    void salesApi.getAccount(selectedAccountId).then(data => {
      if (active) setProfile(data);
    }).catch((loadError: unknown) => {
      if (active) setError(messageOf(loadError));
    });
    return () => { active = false; };
  }, [selectedAccountId]);

  useEffect(() => {
    if (salesSection !== 'contacts' || selectedAccountId) return;
    let active = true;
    void salesApi.listContacts({
      ...(appliedGlobalContactSearch ? { search: appliedGlobalContactSearch } : {}),
      ...(globalContactStatus !== 'All' ? { status: globalContactStatus } : {}),
    }).then(result => {
      if (active) setGlobalContacts(result.contacts);
    }).catch(loadError => {
      if (active) setError(messageOf(loadError));
    }).finally(() => {
      if (active) setGlobalContactsLoading(false);
    });
    return () => { active = false; };
  }, [salesSection, selectedAccountId, appliedGlobalContactSearch, globalContactStatus]);

  useEffect(() => {
    if (salesSection !== 'updates' || !isAdmin) return;
    let active = true;
    void salesApi.listTeamUpdates({
      ...(updatesOwnerFilter ? { ownerEmployeeId: updatesOwnerFilter } : {}),
      ...(updatesAccountFilter ? { accountId: updatesAccountFilter } : {}),
      ...(updatesTypeFilter ? { type: updatesTypeFilter } : {}),
      ...(updatesFromDate ? { fromDate: updatesFromDate } : {}),
      ...(updatesToDate ? { toDate: updatesToDate } : {}),
    }).then(result => {
      if (active) setTeamUpdates(result.updates);
    }).catch(loadError => {
      if (active) setError(messageOf(loadError));
    }).finally(() => {
      if (active) setTeamUpdatesLoading(false);
    });
    return () => { active = false; };
  }, [salesSection, isAdmin, updatesOwnerFilter, updatesAccountFilter, updatesTypeFilter, updatesFromDate, updatesToDate]);

  const refreshProfile = async () => {
    if (selectedAccountId) await loadProfile(selectedAccountId);
    await loadAccounts({
      ...(appliedSearch ? { search: appliedSearch } : {}),
      ...(statusFilter !== 'All' ? { status: statusFilter } : {}),
      ...(isAdmin && ownerFilter ? { ownerEmployeeId: ownerFilter } : {}),
    });
  };

  const openAccount = (account: SalesAccount) => {
    setProfile(null);
    setSelectedAccountId(account.id);
    const sectionTabs: Partial<Record<typeof salesSection, AccountTab>> = {
      'account-profile': 'Dashboard',
      'account-information': 'Account Information',
      technology: 'Technology',
      contacts: 'Contacts',
      activities: 'Activities',
      leads: 'Leads',
      opportunities: 'Opportunities',
      notes: 'Notes',
    };
    const selectedTab = sectionTabs[salesSection] ?? 'Dashboard';
    setTab(selectedTab);
    if (salesSection === 'dashboard' || salesSection === 'accounts') setSalesSection('account-profile');
    setError('');
    if (selectedAccountId === account.id) {
      void loadProfile(account.id).catch(loadError => setError(messageOf(loadError)));
    }
  };

  const openGlobalContact = (contact: SalesContactListItem, edit = false) => {
    setProfile(null);
    setSelectedAccountId(contact.accountId);
    setTab('Contacts');
    setSalesSection('contacts');
    setError('');
    if (edit) {
      setEditing(contact);
      setModal('contacts');
    }
    if (selectedAccountId === contact.accountId) {
      void loadProfile(contact.accountId).catch(loadError => setError(messageOf(loadError)));
    }
  };

  const openGlobalContactAdd = async () => {
    try {
      const result = await salesApi.listAccounts();
      setContactAccountOptions(result.accounts);
      setGlobalContactAddOpen(true);
      setError('');
    } catch (loadError) {
      setError(messageOf(loadError));
    }
  };

  const createGlobalContact = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const accountId = String(data.get('accountId') ?? '');
    const value = (key: string) => String(data.get(key) ?? '').trim();
    setGlobalContactSaving(true);
    try {
      await salesApi.createRecord(accountId, 'contacts', {
        name: value('name'),
        designation: value('designation'),
        email: value('email'),
        phone: value('phone'),
        linkedinUrl: value('linkedinUrl'),
        status: value('status') || 'Active',
      });
      setGlobalContactAddOpen(false);
      await loadGlobalContacts({
        ...(appliedGlobalContactSearch ? { search: appliedGlobalContactSearch } : {}),
        ...(globalContactStatus !== 'All' ? { status: globalContactStatus } : {}),
      });
    } catch (saveError) {
      setError(messageOf(saveError));
    } finally {
      setGlobalContactSaving(false);
    }
  };

  const deleteGlobalContact = async (contact: SalesContactListItem) => {
    if (!window.confirm(`Delete ${contact.name}?`)) return;
    try {
      await salesApi.removeRecord(contact.accountId, 'contacts', contact.id);
      await loadGlobalContacts({
        ...(appliedGlobalContactSearch ? { search: appliedGlobalContactSearch } : {}),
        ...(globalContactStatus !== 'All' ? { status: globalContactStatus } : {}),
      });
    } catch (deleteError) {
      setError(messageOf(deleteError));
    }
  };

  const submitAccount = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const input: SalesAccountInput = {
      companyName: String(data.get('companyName') ?? ''),
      industry: String(data.get('industry') ?? ''),
      website: String(data.get('website') ?? ''),
      linkedinUrl: String(data.get('linkedinUrl') ?? ''),
      location: String(data.get('location') ?? ''),
      status: String(data.get('status') ?? 'Prospect') as SalesAccountInput['status'],
      ...(isAdmin ? { ownerEmployeeId: String(data.get('ownerEmployeeId') ?? '') } : {}),
    };
    if (editing && isAdmin && input.ownerEmployeeId === (editing as SalesAccount).ownerEmployeeId) {
      delete input.ownerEmployeeId;
    }
    if (!input.ownerEmployeeId && isAdmin && !editing) {
      setError('Choose an account owner.');
      return;
    }
    setSaving(true);
    try {
      const saved = editing
        ? await salesApi.updateAccount((editing as SalesAccount).id, input)
        : await salesApi.createAccount(input);
      setSelectedAccountId(saved.id);
      setModal(null);
      setEditing(null);
      setError('');
      await refreshProfile();
    } catch (saveError) {
      setError(messageOf(saveError));
    } finally {
      setSaving(false);
    }
  };

  const recordInput = (kind: ModalKind, form: HTMLFormElement) => {
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    const nullable = (key: string) => value(key) || null;
    if (kind === 'contacts') return {
      name: value('name'), designation: value('designation'), email: value('email'), phone: value('phone'),
      linkedinUrl: value('linkedinUrl'), status: value('status') || 'Active',
    };
    if (kind === 'activities') return {
      type: value('type'), activityDate: value('activityDate'), contactId: nullable('contactId'),
      remarks: value('remarks'), nextFollowUpDate: nullable('nextFollowUpDate'),
    };
    if (kind === 'leads') return {
      name: value('name'), contactId: nullable('contactId'), serviceInterest: value('serviceInterest'),
      source: value('source'), status: value('status') || 'New',
      ...(isAdmin ? { assignedEmployeeId: value('assignedEmployeeId') } : {}),
    };
    if (kind === 'opportunities') return {
      name: value('name'), contactId: nullable('contactId'), serviceRequired: value('serviceRequired'),
      stage: value('stage') || 'Prospecting', expectedClosingDate: nullable('expectedClosingDate'), notes: value('notes'),
    };
    return { content: value('content') };
  };

  const submitRecord = async (form: HTMLFormElement) => {
    if (!modal || !selectedAccountId) return;
    setSaving(true);
    try {
      const input = recordInput(modal, form);
      if (editing && modal !== 'account') {
        await salesApi.updateRecord(selectedAccountId, modal, (editing as SalesRecord).id, input);
      } else {
        await salesApi.createRecord(selectedAccountId, modal as SalesRecordKind, input);
      }
      setModal(null);
      setEditing(null);
      setActivityContactId(null);
      setError('');
      await refreshProfile();
    } catch (saveError) {
      setError(messageOf(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccess = async (employeeId: string, value: boolean) => {
    try {
      await salesApi.setAccess(employeeId, value);
      setAccessEmployees(previous => previous.map(employee => (
        employee.employeeId === employeeId ? { ...employee, salesAccess: value } : employee
      )));
      setError('');
      try {
        await refreshEmployees();
      } catch {
        setError('Sales access was updated, but the Employee Directory could not refresh. Reopen or reload the directory to see the latest access status.');
      }
    } catch (accessError) {
      setError(messageOf(accessError));
    }
  };

  const removeRecord = async (kind: SalesRecordKind, recordId: string, label: string) => {
    if (!selectedAccountId || !window.confirm(`Delete this ${label}?`)) return;
    try {
      await salesApi.removeRecord(selectedAccountId, kind, recordId);
      await refreshProfile();
    } catch (deleteError) {
      setError(messageOf(deleteError));
    }
  };

  const addTechnology = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = technologyName.trim();
    if (!profile || !name || savingTechnology) return;
    const accountId = profile.account.id;
    setSavingTechnology(true);
    try {
      const technology = await salesApi.addTechnology(accountId, name);
      setProfile(previous => previous?.account.id === accountId
        ? { ...previous, technologies: [...previous.technologies, technology].sort((a, b) => a.name.localeCompare(b.name)) }
        : previous);
      setTechnologyName('');
      setError('');
    } catch (saveError) {
      setError(messageOf(saveError));
    } finally {
      setSavingTechnology(false);
    }
  };

  const removeTechnology = async (id: string) => {
    if (!profile) return;
    try {
      await salesApi.removeTechnology(profile.account.id, id);
      await loadProfile(profile.account.id);
    } catch (deleteError) {
      setError(messageOf(deleteError));
    }
  };

  const filteredAccounts = accounts;
  const overdueFollowUps = profile?.activities.filter(activity => activity.nextFollowUpDate && activity.nextFollowUpDate < followUpTodayKey) ?? [];
  const dueFollowUps = profile?.activities.filter(activity => activity.nextFollowUpDate === followUpTodayKey) ?? [];
  const activeEmployeeOptions = useMemo(() => employees.filter(employee => employee.status === 'Active'), [employees]);
  const teamUpdateOwnerOptions = useMemo(() => {
    const owners = new Map<string, string>();
    for (const account of accounts) owners.set(account.ownerEmployeeId, account.ownerName);
    return [...owners].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);
  const openModal = (kind: ModalKind, record?: SalesRecord | SalesAccount) => {
    setActivityContactId(null);
    setEditing(record ?? null);
    setModal(kind);
    setError('');
  };
  const salesOwnerOptions = useMemo(() => accessEmployees
    .filter(employee => employee.salesAccess && employee.isActive)
    .map(employee => ({ id: employee.employeeId, name: employee.name })), [accessEmployees]);
  const ownerName = (id: string) => salesOwnerOptions.find(employee => employee.id === id)?.name ?? '';
  const sectionTab: Partial<Record<typeof salesSection, AccountTab>> = {
    'account-profile': 'Dashboard',
    'account-information': 'Account Information',
    technology: 'Technology',
    contacts: 'Contacts',
    activities: 'Activities',
    leads: 'Leads',
    opportunities: 'Opportunities',
    notes: 'Notes',
  };
  const activeTab = sectionTab[salesSection] ?? tab;
  const recentProfileActivities = profile
    ? [...profile.activities].sort((a, b) => b.activityDate.localeCompare(a.activityDate)).slice(0, 5)
    : [];
  const keyContacts = profile?.contacts.filter(contact => contact.status === 'Active').slice(0, 4) ?? [];
  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    return (profile?.contacts ?? []).filter(contact => (
      (contactStatusFilter === 'All' || contact.status === contactStatusFilter)
      && (!query || [contact.name, contact.email, contact.phone].some(value => value.toLowerCase().includes(query)))
    ));
  }, [contactSearch, contactStatusFilter, profile?.contacts]);
  const latestActivityByContact = useMemo(() => {
    const latest = new Map<string, SalesActivity>();
    for (const activity of profile?.activities ?? []) {
      if (!activity.contactId) continue;
      const current = latest.get(activity.contactId);
      if (!current || activity.activityDate > current.activityDate) latest.set(activity.contactId, activity);
    }
    return latest;
  }, [profile?.activities]);
  const logContactActivity = (contact: SalesContact) => {
    setViewingContact(null);
    setActivityContactId(contact.id);
    setEditing(null);
    setModal('activities');
    setError('');
  };
  const openAccountActivity = (accountId: string) => {
    setProfile(null);
    setSelectedAccountId(accountId);
    setTab('Activities');
    setSalesSection('activities');
    if (selectedAccountId === accountId) {
      void loadProfile(accountId).catch(loadError => setError(messageOf(loadError)));
    }
  };

  const renderRecordRows = (records: SalesRecord[], kind: SalesRecordKind, columns: Array<(record: SalesRecord) => React.ReactNode>, labels: string[], editable = true) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr>{labels.map(label => <th key={label} style={{ textAlign: 'left', padding: '11px 10px', color: '#667085', borderBottom: '1px solid #EAECF0', whiteSpace: 'nowrap' }}>{label}</th>)}<th style={{ padding: 10 }} /></tr></thead>
        <tbody>
          {records.map(record => <tr key={record.id}>
            {columns.map((column, index) => <td key={index} style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', color: '#344054' }}>{column(record)}</td>)}
            <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
              {editable && <button aria-label={`Edit ${labels[0]}`} title="Edit" onClick={() => openModal(kind, record)} style={{ ...quietButton, padding: 6, marginRight: 5 }}><Pencil size={14} /></button>}
              <button aria-label="Delete record" title="Delete" onClick={() => void removeRecord(kind, record.id, recordLabel[kind])} style={{ ...quietButton, padding: 6, color: '#B42318' }}><Trash2 size={14} /></button>
            </td>
          </tr>)}
          {!records.length && <tr><td colSpan={labels.length + 1} style={{ padding: 26, textAlign: 'center', color: '#667085' }}>No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const contactLabel = (contactId: string | null) => profile?.contacts.find(contact => contact.id === contactId)?.name ?? '—';

  return (
    <section className="sales-module" style={{ padding: '28px clamp(16px, 3vw, 36px)', maxWidth: 1400, margin: '0 auto', color: '#101828' }}>
      {(!selectedAccountId || salesSection === 'dashboard' || salesSection === 'accounts') && <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 10, color: '#2864E8', background: 'linear-gradient(135deg, #E8F0FF, #F1EAFF)' }}><Activity size={20} /></span>
            <div><h1 style={{ fontSize: 24, margin: 0 }}>Sales</h1><p style={{ margin: '4px 0 0', color: '#667085', fontSize: 13 }}>Accounts and customer relationships</p></div>
          </div>
        </div>
        {(!selectedAccountId || salesSection === 'dashboard' || salesSection === 'accounts' || salesSection === 'access') && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {salesSection === 'dashboard' && <button style={primaryButton} onClick={() => openModal('account')}><CirclePlus size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Add account</button>}
          {isAdmin && <button style={quietButton} onClick={() => setSalesSection(salesSection === 'access' ? 'dashboard' : 'access')}><Users size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Manage access</button>}
        </div>}
      </header>}

      {error && <div role="alert" style={{ background: '#FEF3F2', color: '#B42318', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {salesSection === 'access' && isAdmin ? <section className="sales-lift-card interactive-lift-card" style={panelStyle}>
        <div style={{ marginBottom: 16 }}><h2 style={{ fontSize: 18, margin: 0 }}>Sales access</h2><p style={{ color: '#667085', fontSize: 13 }}>Enable the Sales module for selected active employees.</p></div>
        {accessEmployees.map(employee => <label key={employee.employeeId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: '1px solid #EAECF0', padding: '13px 4px' }}>
          <span><strong style={{ display: 'block', fontSize: 14 }}>{employee.name}</strong><small style={{ color: '#667085' }}>{employee.email} · {employee.department}</small></span>
          <input type="checkbox" checked={employee.salesAccess} onChange={event => void toggleAccess(employee.employeeId, event.target.checked)} aria-label={`Sales access for ${employee.name}`} />
        </label>)}
        {!accessEmployees.length && <p style={{ color: '#667085', fontSize: 13 }}>No active, linked employee accounts found.</p>}
      </section> : salesSection === 'updates' && isAdmin ? <section className="sales-lift-card interactive-lift-card" style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <div><h2 style={{ margin: 0, fontSize: 18 }}>Sales Updates</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 13 }}>Recent activities logged across sales-owned accounts. Showing up to 100 updates.</p></div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#1849A9', background: '#EFF4FF', borderRadius: 20, padding: '7px 10px', fontSize: 12, fontWeight: 600 }}><Activity size={14} />Team activity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap', padding: 14, marginBottom: 16, border: '1px solid #EAECF0', borderRadius: 10, background: '#F9FAFB' }}>
          <label style={{ display: 'grid', gap: 6, color: '#475467', fontSize: 12, fontWeight: 600, flex: '1 1 175px' }}>Sales owner
            <select className="sales-select" aria-label="Filter Sales Updates by owner" value={updatesOwnerFilter} onChange={event => { setTeamUpdatesLoading(true); setUpdatesOwnerFilter(event.target.value); }} style={selectStyle}>
              <option value="">All owners</option>{teamUpdateOwnerOptions.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#475467', fontSize: 12, fontWeight: 600, flex: '1 1 190px' }}>Account
            <select className="sales-select" aria-label="Filter Sales Updates by account" value={updatesAccountFilter} onChange={event => { setTeamUpdatesLoading(true); setUpdatesAccountFilter(event.target.value); }} style={selectStyle}>
              <option value="">All accounts</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.companyName}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#475467', fontSize: 12, fontWeight: 600, flex: '1 1 175px' }}>Activity type
            <select className="sales-select" aria-label="Filter Sales Updates by activity type" value={updatesTypeFilter} onChange={event => { setTeamUpdatesLoading(true); setUpdatesTypeFilter(event.target.value as typeof updatesTypeFilter); }} style={selectStyle}>
              <option value="">All activity types</option>{['Call', 'Email', 'Meeting', 'LinkedIn outreach', 'Follow-up'].map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#475467', fontSize: 12, fontWeight: 600, flex: '1 1 145px' }}>From
            <input aria-label="Sales Updates from date" type="date" value={updatesFromDate} max={updatesToDate || undefined} onChange={event => { setTeamUpdatesLoading(true); setUpdatesFromDate(event.target.value); }} style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#475467', fontSize: 12, fontWeight: 600, flex: '1 1 145px' }}>To
            <input aria-label="Sales Updates to date" type="date" value={updatesToDate} min={updatesFromDate || undefined} onChange={event => { setTeamUpdatesLoading(true); setUpdatesToDate(event.target.value); }} style={inputStyle} />
          </label>
          <button type="button" style={quietButton} onClick={() => {
            setTeamUpdatesLoading(true);
            setUpdatesOwnerFilter('');
            setUpdatesAccountFilter('');
            setUpdatesTypeFilter('');
            setUpdatesFromDate('');
            setUpdatesToDate('');
          }}>Clear filters</button>
        </div>
        {teamUpdatesLoading ? <p role="status" style={{ color: '#667085', fontSize: 13 }}>Loading sales updates…</p> : <div style={{ overflowX: 'auto', border: '1px solid #EAECF0', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 950 }}>
            <thead style={{ background: '#F9FAFB' }}><tr>{['Date', 'Activity', 'Account', 'Sales owner', 'Contact', 'Update', 'Logged by'].map(label => <th key={label} style={{ textAlign: 'left', padding: '11px 10px', color: '#667085', borderBottom: '1px solid #EAECF0', whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</th>)}</tr></thead>
            <tbody>
              {teamUpdates.map(update => <tr className="sales-account-row" key={update.id}>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap', color: '#475467' }}>{update.activityDate}</td>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}><span style={{ color: '#1849A9', background: '#EFF4FF', borderRadius: 16, padding: '5px 8px', fontSize: 12, fontWeight: 600 }}>{update.type}</span></td>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}><button type="button" className="sales-open-account" onClick={() => openAccountActivity(update.accountId)}>{update.accountName}</button></td>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>{update.ownerName}</td>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap', color: '#475467' }}>{update.contactName || '—'}</td>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', minWidth: 220, maxWidth: 400, color: '#344054', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{update.remarks}</td>
                <td style={{ padding: '13px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap', color: '#475467' }}>{update.loggedByName}</td>
              </tr>)}
              {!teamUpdates.length && <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', color: '#667085' }}>No sales updates match these filters.</td></tr>}
            </tbody>
          </table>
        </div>}
        {!teamUpdatesLoading && <p style={{ color: '#667085', fontSize: 12, margin: '10px 2px 0' }}>Showing {teamUpdates.length} updates</p>}
      </section> : salesSection === 'contacts' && !selectedAccountId ? <section className="sales-lift-card interactive-lift-card" style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <div><h2 style={{ margin: 0, fontSize: 18 }}>Contacts</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 13 }}>Search and manage contacts across your accounts.</p></div>
          <button style={primaryButton} onClick={() => void openGlobalContactAdd()}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Add contact</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 15 }}>
          <form onSubmit={event => { event.preventDefault(); setAppliedGlobalContactSearch(globalContactSearch.trim()); }} style={{ display: 'flex', gap: 7, flex: 1, minWidth: 220 }}>
            <div style={{ position: 'relative', flex: 1 }}><Search size={15} style={{ position: 'absolute', top: 11, left: 11, color: '#98A2B3' }} /><input aria-label="Search all contacts" placeholder="Search name, email or phone" value={globalContactSearch} onChange={event => setGlobalContactSearch(event.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} /></div>
            <button style={quietButton}>Search</button>
          </form>
          <select className="sales-select" aria-label="Filter contacts by status" value={globalContactStatus} onChange={event => setGlobalContactStatus(event.target.value as typeof globalContactStatus)} style={{ ...selectStyle, width: 160 }}>
            <option value="All">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
          </select>
        </div>
        {globalContactsLoading ? <p role="status" style={{ color: '#667085', fontSize: 13 }}>Loading contacts…</p> : <div style={{ overflowX: 'auto', border: '1px solid #EAECF0', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 980 }}>
            <thead style={{ background: '#F9FAFB' }}><tr>{['Name', 'Designation', 'Email', 'Phone', 'LinkedIn', 'Last activity', 'Account', 'Status', 'Actions'].map(label => <th key={label} style={{ textAlign: 'left', padding: '11px 10px', color: '#667085', borderBottom: '1px solid #EAECF0', whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</th>)}</tr></thead>
            <tbody>
              {globalContacts.map(contact => {
                const linkedInUrl = safeExternalUrl(contact.linkedinUrl);
                return <tr className="sales-account-row" key={contact.id}>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', fontWeight: 600, whiteSpace: 'nowrap' }}>{contact.name}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', color: '#475467' }}>{contact.designation || '—'}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>{contact.email ? <a href={`mailto:${contact.email}`} style={{ color: '#344054' }}>{contact.email}</a> : '—'}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>{contact.phone ? <a href={`tel:${contact.phone}`} style={{ color: '#344054' }}>{contact.phone}</a> : '—'}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4' }}>{linkedInUrl ? <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${contact.name}'s LinkedIn profile`} title="Open LinkedIn profile" style={{ color: '#475467', display: 'inline-flex' }}><ExternalLink size={15} /></a> : '—'}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }} title={contact.lastActivityRemarks ?? undefined}>{contact.lastActivityDate ? `${contact.lastActivityDate} · ${contact.lastActivityType}` : <span style={{ color: '#98A2B3' }}>No activity</span>}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}><button onClick={() => openGlobalContact(contact)} className="sales-open-account">{contact.accountName}</button></td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4' }}><span style={{ ...statusColor(contact.status), borderRadius: 12, padding: '4px 8px', whiteSpace: 'nowrap' }}>{contact.status}</span></td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>
                    <button aria-label={`Edit ${contact.name}`} title="Edit contact" onClick={() => openGlobalContact(contact, true)} style={{ ...quietButton, padding: 6, marginRight: 5 }}><Pencil size={14} /></button>
                    <button aria-label={`Delete ${contact.name}`} title="Delete contact" onClick={() => void deleteGlobalContact(contact)} style={{ ...quietButton, padding: 6, color: '#B42318' }}><Trash2 size={14} /></button>
                  </td>
                </tr>;
              })}
              {!globalContacts.length && <tr><td colSpan={9} style={{ padding: 26, textAlign: 'center', color: '#667085' }}>No contacts found. Add a contact to get started.</td></tr>}
            </tbody>
          </table>
        </div>}
        <p style={{ color: '#667085', fontSize: 12, margin: '10px 2px 0' }}>Showing {globalContacts.length} contacts</p>
      </section> : selectedAccountId && !profile && salesSection !== 'dashboard' && salesSection !== 'accounts' ? <>
        <button className="sales-profile-back" onClick={() => { setProfile(null); setSelectedAccountId(null); setSalesSection('accounts'); setError(''); }} style={quietButton}><ArrowLeft size={14} />Back to accounts</button>
        <section className="sales-lift-card" style={panelStyle} role="status">Loading account profile…</section>
      </> : selectedAccountId && profile && salesSection !== 'dashboard' && salesSection !== 'accounts' ? <>
        <button className="sales-profile-back" onClick={() => { setProfile(null); setSelectedAccountId(null); setSalesSection('accounts'); setError(''); }} style={quietButton}><ArrowLeft size={14} />Back to accounts</button>
        <div className="sales-lift-card sales-profile-hero">
          <div className="sales-profile-banner" />
          <div className="sales-profile-heading">
            <div className="sales-profile-avatar">{profile.account.companyName.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase()}</div>
            <div className="sales-profile-identity">
              <div className="sales-profile-title-row"><h2>{profile.account.companyName}</h2><span className="sales-profile-status" style={statusColor(profile.account.status)}>{profile.account.status}</span></div>
              <p>{profile.account.industry || 'Industry not set'} · {profile.account.location || 'Location not set'}</p>
              <small>Account owner: {profile.account.ownerName || ownerName(profile.account.ownerEmployeeId) || 'Not assigned'}</small>
            </div>
            <div className="sales-profile-actions">
              <button style={{ ...quietButton, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => openModal('account', profile.account)}><Pencil size={14} />Edit account</button>
              <button style={primaryButton} onClick={() => openModal('activities')}><Activity size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Log activity</button>
            </div>
          </div>
          <nav className="sales-profile-tabs">
            {tabs.map(item => <button key={item} onClick={() => {
              setTab(item);
              const sections: Partial<Record<AccountTab, typeof salesSection>> = {
                Dashboard: 'account-profile',
                'Account Information': 'account-information',
                Technology: 'technology', Contacts: 'contacts', Activities: 'activities',
                Leads: 'leads', Opportunities: 'opportunities', Notes: 'notes',
              };
              if (sections[item]) setSalesSection(sections[item]!);
            }} className={`sales-profile-tab${activeTab === item ? ' is-active' : ''}`}>
              {item}
              {item === 'Technology' && profile.technologies.length > 0 && <span className="sales-profile-tab-count">{profile.technologies.length}</span>}
              {item === 'Contacts' && profile.contacts.length > 0 && <span className="sales-profile-tab-count">{profile.contacts.length}</span>}
              {item === 'Leads' && profile.leads.length > 0 && <span className="sales-profile-tab-count">{profile.leads.length}</span>}
              {item === 'Opportunities' && profile.opportunities.length > 0 && <span className="sales-profile-tab-count">{profile.opportunities.length}</span>}
            </button>)}
          </nav>
        </div>

        <div className={activeTab === 'Dashboard' ? 'sales-account-dashboard' : 'sales-lift-card interactive-lift-card'} style={activeTab === 'Dashboard' ? undefined : panelStyle}>
          {activeTab === 'Dashboard' && <div className="sales-account-dashboard-grid">
            <div className="sales-profile-metrics">
              {[
                { label: 'Opportunities', value: profile.opportunities.length, icon: <BriefcaseBusiness size={16} />, tone: 'opportunities', target: 'Opportunities' as AccountTab },
                { label: 'Leads', value: profile.leads.length, icon: <Target size={16} />, tone: 'leads', target: 'Leads' as AccountTab },
                { label: 'Active contacts', value: profile.contacts.filter(contact => contact.status === 'Active').length, icon: <Users size={16} />, tone: 'contacts', target: 'Contacts' as AccountTab },
                { label: 'Technologies', value: profile.technologies.length, icon: <Cpu size={16} />, tone: 'technology', target: 'Technology' as AccountTab },
              ].map(metric => <button key={metric.label} onClick={() => {
                setTab(metric.target);
                const section: Partial<Record<AccountTab, typeof salesSection>> = {
                  Opportunities: 'opportunities', Leads: 'leads', Contacts: 'contacts', Technology: 'technology',
                };
                setSalesSection(section[metric.target] ?? 'account-profile');
              }} className="sales-lift-card interactive-lift-card sales-profile-metric" style={{ textAlign: 'left', cursor: 'pointer' }}>
                <span className="sales-profile-metric-label">{metric.label}<span className={`sales-profile-metric-icon ${metric.tone}`}>{metric.icon}</span></span>
                <strong>{metric.value}</strong>
              </button>)}
            </div>
              <section className="sales-lift-card sales-profile-dashboard-card sales-profile-activity-card" style={{ ...panelStyle, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}>
                  <div><h3 style={{ margin: 0, fontSize: 15 }}>Recent activities</h3><p style={{ margin: '4px 0 0', color: '#667085', fontSize: 12 }}>Latest interactions with this account</p></div>
                  <button className="sales-text-link" onClick={() => { setTab('Activities'); setSalesSection('activities'); }}>View all</button>
                </div>
                {recentProfileActivities.length ? <div style={{ display: 'grid', gap: 8 }}>
                  {recentProfileActivities.map(activity => <article key={activity.id} className="sales-profile-activity">
                    <span className="sales-profile-activity-icon"><Activity size={14} /></span>
                    <div className="sales-profile-activity-body">
                      <div className="sales-profile-activity-heading"><strong>{contactLabel(activity.contactId)}</strong><span>{activity.type}</span><time>{new Date(`${activity.activityDate}T12:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</time></div>
                      <p>{activity.remarks}</p>
                    </div>
                  </article>)}
                </div> : <div className="sales-dashboard-empty">No activities recorded yet.</div>}
              </section>
              <section className="sales-lift-card sales-profile-dashboard-card sales-profile-contacts-card" style={{ ...panelStyle, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}>
                  <div><h3 style={{ margin: 0, fontSize: 15 }}>Key contacts</h3><p style={{ margin: '4px 0 0', color: '#667085', fontSize: 12 }}>Active people at this account</p></div>
                  <button className="sales-text-link" onClick={() => { setTab('Contacts'); setSalesSection('contacts'); }}>View all</button>
                </div>
                {keyContacts.length ? <div style={{ display: 'grid', gap: 8 }}>
                  {keyContacts.map((contact, index) => <div key={contact.id} className="sales-profile-contact">
                    <span className="sales-profile-contact-avatar">{contact.name.slice(0, 1).toUpperCase()}</span>
                    <span className="sales-profile-contact-info"><strong>{contact.name}</strong><small>{contact.designation || 'Contact'}</small></span>
                    {index === 0 && <span className="sales-profile-contact-key">Key contact</span>}
                    <span className="sales-profile-contact-actions">{contact.email && <a aria-label={`Email ${contact.name}`} href={`mailto:${contact.email}`}><Mail size={14} /></a>}{contact.phone && <a aria-label={`Call ${contact.name}`} href={`tel:${contact.phone}`}><Phone size={14} /></a>}</span>
                  </div>)}
                </div> : <div className="sales-dashboard-empty">No active contacts yet.</div>}
              </section>
            <section className="sales-lift-card sales-profile-dashboard-card sales-profile-technology-card" style={{ ...panelStyle, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div><h3 style={{ margin: 0, fontSize: 15 }}>Technology stack</h3><p style={{ margin: '4px 0 0', color: '#667085', fontSize: 12 }}>Technologies recorded for this company</p></div>
                <button className="sales-text-link" onClick={() => { setTab('Technology'); setSalesSection('technology'); }}>Manage</button>
              </div>
              <div className="sales-profile-tech-list">{profile.technologies.slice(0, 12).map((technology, index) => <span className={`sales-profile-tech-chip tone-${index % 5}`} key={technology.id}>{technology.name}</span>)}
                {!profile.technologies.length && <span style={{ color: '#667085', fontSize: 12 }}>No technologies added yet.</span>}
              </div>
            </section>
          </div>}
          {activeTab === 'Account Information' && <section className="sales-account-overview">
            <div className="sales-account-overview-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>Account overview</h3>
                <p style={{ color: '#667085', fontSize: 13, margin: '5px 0 0' }}>Company details and ownership</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ ...statusColor(profile.account.status), borderRadius: 16, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>{profile.account.status}</span>
                <button style={{ ...quietButton, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => openModal('account', profile.account)}><Pencil size={14} />Edit account</button>
              </div>
            </div>
            <div className="sales-account-overview-grid">
              <div className="sales-detail-tile"><div className="sales-detail-label">Company</div><div className="sales-detail-value">{profile.account.companyName}</div></div>
              <div className="sales-detail-tile"><div className="sales-detail-label">Industry</div><div className="sales-detail-value">{profile.account.industry || 'Not added'}</div></div>
              <div className="sales-detail-tile"><div className="sales-detail-label">Website</div><div className="sales-detail-value">
                {profile.account.website && safeExternalUrl(profile.account.website)
                  ? <a href={safeExternalUrl(profile.account.website) ?? undefined} target="_blank" rel="noopener noreferrer" className="sales-account-detail-link">{profile.account.website}<ExternalLink size={13} /></a>
                  : profile.account.website || 'Not added'}
              </div></div>
              <div className="sales-detail-tile"><div className="sales-detail-label">LinkedIn</div><div className="sales-detail-value">
                {profile.account.linkedinUrl && safeExternalUrl(profile.account.linkedinUrl)
                  ? <a href={safeExternalUrl(profile.account.linkedinUrl) ?? undefined} target="_blank" rel="noopener noreferrer" className="sales-account-detail-link">Open company profile<ExternalLink size={13} /></a>
                  : profile.account.linkedinUrl || 'Not added'}
              </div></div>
              <div className="sales-detail-tile"><div className="sales-detail-label">Location</div><div className="sales-detail-value">{profile.account.location || 'Not added'}</div></div>
              <div className="sales-detail-tile"><div className="sales-detail-label">Account owner</div><div className="sales-detail-value">{profile.account.ownerName || ownerName(profile.account.ownerEmployeeId) || 'Not assigned'}</div></div>
            </div>
          </section>}
          {activeTab === 'Technology' && <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
              <div><h3 style={{ margin: 0, fontSize: 16 }}>Technology</h3><p style={{ color: '#667085', fontSize: 13, margin: '5px 0 0' }}>Track the technologies used by this company.</p></div>
              <form onSubmit={addTechnology} style={{ display: 'flex', gap: 8 }}>
                <input aria-label="Technology name" list={`sales-technology-options-${profile.account.id}`} placeholder="Choose or enter a technology" value={technologyName} onChange={event => { setTechnologyName(event.target.value); setError(''); }} required style={{ ...inputStyle, width: 230 }} />
                <datalist id={`sales-technology-options-${profile.account.id}`}>
                  {['SAP', 'Databricks', 'Azure', 'AWS', 'AI/ML'].map(name => <option key={name} value={name} />)}
                </datalist>
                <button type="submit" style={primaryButton} disabled={savingTechnology || !technologyName.trim()}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{savingTechnology ? 'Adding…' : 'Add'}</button>
              </form>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.technologies.map(technology => <span key={technology.id} style={{ background: '#EFF4FF', color: '#1849A9', borderRadius: 20, padding: '8px 11px', fontSize: 13 }}>
                {technology.name} <button aria-label={`Remove ${technology.name}`} onClick={() => void removeTechnology(technology.id)} style={{ border: 0, color: '#667085', background: 'transparent', cursor: 'pointer', marginLeft: 5 }}>×</button>
              </span>)}
              {!profile.technologies.length && <div style={{ color: '#667085', fontSize: 13 }}>No technologies added yet.</div>}
            </div>
          </div>}
          {activeTab === 'Contacts' && <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div><h3 style={{ margin: 0, fontSize: 16 }}>Contacts</h3><p style={{ color: '#667085', fontSize: 13, margin: '5px 0 0' }}>People connected to {profile.account.companyName}.</p></div>
              <button style={primaryButton} onClick={() => openModal('contacts')}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Add contact</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <label style={{ position: 'relative', flex: '1 1 260px' }}>
                <Search size={15} aria-hidden="true" style={{ position: 'absolute', top: 11, left: 11, color: '#98A2B3' }} />
                <input aria-label="Search contacts" placeholder="Search name, email or phone" value={contactSearch} onChange={event => setContactSearch(event.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} />
              </label>
              <select className="sales-select" aria-label="Filter contacts by status" value={contactStatusFilter} onChange={event => setContactStatusFilter(event.target.value as typeof contactStatusFilter)} style={{ ...selectStyle, width: 160 }}>
                <option value="All">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #EAECF0', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 850 }}>
                <thead style={{ background: '#F9FAFB' }}><tr>{['Name', 'Designation', 'Email', 'Phone', 'LinkedIn', 'Last activity', 'Status', 'Actions'].map(label => <th key={label} style={{ textAlign: 'left', padding: '11px 10px', color: '#667085', borderBottom: '1px solid #EAECF0', whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</th>)}</tr></thead>
                <tbody>
                  {filteredContacts.map(contact => {
                    const latestActivity = latestActivityByContact.get(contact.id);
                    const linkedInUrl = safeExternalUrl(contact.linkedinUrl);
                    return <tr className="sales-account-row" key={contact.id}>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', fontWeight: 600, whiteSpace: 'nowrap' }}>{contact.name}</td>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', color: '#475467' }}>{contact.designation || '—'}</td>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>{contact.email ? <a href={`mailto:${contact.email}`} style={{ color: '#344054' }}>{contact.email}</a> : '—'}</td>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>{contact.phone ? <a href={`tel:${contact.phone}`} style={{ color: '#344054' }}>{contact.phone}</a> : '—'}</td>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4' }}>{linkedInUrl ? <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${contact.name}'s LinkedIn profile`} title="Open LinkedIn profile" style={{ color: '#475467', display: 'inline-flex' }}><ExternalLink size={15} /></a> : '—'}</td>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>{latestActivity ? <button onClick={() => { setViewingContact(contact); }} style={{ border: 0, padding: 0, background: 'transparent', color: '#155EEF', font: 'inherit', cursor: 'pointer', textAlign: 'left' }} title={`${latestActivity.type}: ${latestActivity.remarks}`}>{latestActivity.activityDate} · {latestActivity.type}</button> : <span style={{ color: '#98A2B3' }}>No activity</span>}</td>
                      <td style={{ padding: '12px 10px', borderBottom: '1px solid #F0F1F4' }}><span style={{ ...statusColor(contact.status), borderRadius: 12, padding: '4px 8px', whiteSpace: 'nowrap' }}>{contact.status}</span></td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #F0F1F4', whiteSpace: 'nowrap' }}>
                        <button aria-label={`View ${contact.name}`} title="View contact" onClick={() => setViewingContact(contact)} style={{ ...quietButton, padding: 6, marginRight: 5 }}><Eye size={14} /></button>
                        <button aria-label={`Edit ${contact.name}`} title="Edit contact" onClick={() => openModal('contacts', contact)} style={{ ...quietButton, padding: 6, marginRight: 5 }}><Pencil size={14} /></button>
                        <button aria-label={`Delete ${contact.name}`} title="Delete contact" onClick={() => void removeRecord('contacts', contact.id, 'contact')} style={{ ...quietButton, padding: 6, color: '#B42318' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>;
                  })}
                  {!filteredContacts.length && <tr><td colSpan={8} style={{ padding: 26, textAlign: 'center', color: '#667085' }}>{profile.contacts.length ? 'No contacts match your search or status filter.' : 'No contacts yet. Add a contact to get started.'}</td></tr>}
                </tbody>
              </table>
            </div>
            <p style={{ color: '#667085', fontSize: 12, margin: '10px 2px 0' }}>Showing {filteredContacts.length} of {profile.contacts.length} contacts</p>
          </section>}
          {activeTab === 'Activities' && <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><div><h3 style={{ margin: 0, fontSize: 16 }}>Activities</h3><p style={{ color: '#667085', fontSize: 13, margin: '5px 0 0' }}>Calls, emails, meetings and follow-ups.</p></div><button style={primaryButton} onClick={() => openModal('activities')}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Log activity</button></div>
            {(overdueFollowUps.length > 0 || dueFollowUps.length > 0) && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {overdueFollowUps.length > 0 && <div role="status" style={{ padding: '10px 12px', borderRadius: 9, background: '#FEF3F2', color: '#B42318', fontSize: 13, fontWeight: 600 }}>{overdueFollowUps.length} overdue follow-up{overdueFollowUps.length === 1 ? '' : 's'} to review</div>}
              {dueFollowUps.length > 0 && <div role="status" style={{ padding: '10px 12px', borderRadius: 9, background: '#FFFAEB', color: '#B54708', fontSize: 13, fontWeight: 600 }}>{dueFollowUps.length} follow-up{dueFollowUps.length === 1 ? '' : 's'} due today</div>}
            </div>}
            {renderRecordRows(profile.activities as SalesRecord[], 'activities', [
              record => (record as SalesActivity).type,
              record => (record as SalesActivity).activityDate,
              record => contactLabel((record as SalesActivity).contactId),
              record => (record as SalesActivity).remarks,
              record => {
                const date = (record as SalesActivity).nextFollowUpDate;
                if (!date) return '—';
                const tone = date < followUpTodayKey
                  ? { color: '#B42318', background: '#FEF3F2', label: 'Overdue' }
                  : date === followUpTodayKey
                  ? { color: '#B54708', background: '#FFFAEB', label: 'Due today' }
                  : { color: '#067647', background: '#ECFDF3', label: 'Upcoming' };
                return <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><time>{date}</time><small style={{ color: tone.color, background: tone.background, borderRadius: 12, padding: '3px 7px' }}>{tone.label}</small></span>;
              },
            ], ['Type', 'Date', 'Contact', 'Remarks', 'Next follow-up'])}
          </section>}
          {activeTab === 'Leads' && <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 16 }}>Leads</h3><button style={primaryButton} onClick={() => openModal('leads')}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Add lead</button></div>
            {renderRecordRows(profile.leads as SalesRecord[], 'leads', [
              record => (record as SalesLead).name,
              record => contactLabel((record as SalesLead).contactId),
              record => (record as SalesLead).serviceInterest,
              record => (record as SalesLead).source,
              record => <span style={{ ...statusColor((record as SalesLead).status), borderRadius: 12, padding: '4px 8px' }}>{(record as SalesLead).status}</span>,
              record => ownerName((record as SalesLead).assignedEmployeeId) || 'Account owner',
            ], ['Lead', 'Contact', 'Service interest', 'Source', 'Status', 'Assigned to'])}
          </section>}
          {activeTab === 'Opportunities' && <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 16 }}>Opportunities</h3><button style={primaryButton} onClick={() => openModal('opportunities')}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Add opportunity</button></div>
            {renderRecordRows(profile.opportunities as SalesRecord[], 'opportunities', [
              record => (record as SalesOpportunity).name,
              record => contactLabel((record as SalesOpportunity).contactId),
              record => (record as SalesOpportunity).serviceRequired,
              record => (record as SalesOpportunity).stage,
              record => (record as SalesOpportunity).expectedClosingDate || '—',
              record => (record as SalesOpportunity).notes || '—',
            ], ['Opportunity', 'Contact', 'Service required', 'Stage', 'Expected close', 'Notes'])}
          </section>}
          {activeTab === 'Notes' && <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 16 }}>Notes</h3><button style={primaryButton} onClick={() => openModal('notes')}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Add note</button></div>
            {!profile.notes.length && <p style={{ color: '#667085', fontSize: 13 }}>No notes yet.</p>}
            <div style={{ display: 'grid', gap: 10 }}>{profile.notes.map(note => <article key={note.id} style={{ background: '#F9FAFB', borderRadius: 9, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div><p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap', fontSize: 14 }}>{note.content}</p><time style={{ color: '#667085', fontSize: 11 }}>{new Date(note.createdAt).toLocaleString()}</time></div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}><button style={{ ...quietButton, padding: 6 }} onClick={() => openModal('notes', note)} aria-label="Edit note"><Pencil size={14} /></button><button style={{ ...quietButton, padding: 6, color: '#B42318' }} onClick={() => void removeRecord('notes', note.id, 'note')} aria-label="Delete note"><Trash2 size={14} /></button></div>
            </article>)}</div>
          </section>}
        </div>
      </> : <>
        {salesSection === 'dashboard' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {([
            ['Total accounts', counts.total, 'All assigned accounts', 'All'],
            ['Prospect accounts', counts.prospect, 'Not yet customers', 'Prospect'],
            ['Active accounts', counts.active, 'Ongoing relationships', 'Active'],
          ] as const).map(([label, value, caption, status]) => <button className="sales-lift-card interactive-lift-card sales-count-card" key={label} onClick={() => { setStatusFilter(status); setOwnerFilter(''); setSalesSection('accounts'); setProfile(null); setSelectedAccountId(null); }} style={{ ...panelStyle, textAlign: 'left', cursor: 'pointer', color: '#101828' }}>
            <span style={{ color: '#667085', fontSize: 12 }}>{label}</span><strong style={{ display: 'block', fontSize: 24, margin: '4px 0 2px' }}>{value}</strong><span style={{ color: '#667085', fontSize: 11 }}>{caption}</span>
          </button>)}
        </div>}
        {salesSection === 'dashboard' && <section className="sales-lift-card sales-pipeline-card" style={{ ...panelStyle, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div><h2 style={{ margin: 0, fontSize: 16 }}>Pipeline overview</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 12 }}>Your accounts by status</p></div>
            <button type="button" className="sales-text-link" onClick={() => { setStatusFilter('All'); setOwnerFilter(''); setAppliedSearch(''); setSearch(''); setSalesSection('accounts'); }}>View all accounts</button>
          </div>
          <div className="sales-pipeline-bar" role="img" aria-label={`${counts.prospect} prospect accounts and ${counts.active} active accounts`}>
            {counts.total > 0 && <>
              <span className="sales-pipeline-prospect" style={{ width: `${(counts.prospect / counts.total) * 100}%` }} />
              <span className="sales-pipeline-active" style={{ width: `${(counts.active / counts.total) * 100}%` }} />
            </>}
          </div>
          <div className="sales-pipeline-legend">
            <span><i className="sales-pipeline-dot sales-pipeline-prospect" />Prospect <strong>{counts.prospect}</strong> ({counts.total ? Math.round((counts.prospect / counts.total) * 100) : 0}%)</span>
            <span><i className="sales-pipeline-dot sales-pipeline-active" />Active <strong>{counts.active}</strong> ({counts.total ? Math.round((counts.active / counts.total) * 100) : 0}%)</span>
          </div>
        </section>}
        {salesSection === 'dashboard' && <div className="sales-dashboard-grid">
          <section className="sales-lift-card interactive-lift-card" style={{ ...panelStyle, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div><h2 style={{ margin: 0, fontSize: 16 }}>Follow-ups needing attention</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 12 }}>Overdue and due today</p></div>
              <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, color: '#155EEF', background: '#EFF4FF', borderRadius: 9 }}><CalendarClock size={17} /></span>
            </div>
            {followUps.length ? <div style={{ display: 'grid', gap: 8 }}>
              {followUps.slice(0, 5).map(followUp => {
                const overdue = followUp.nextFollowUpDate < followUpTodayKey;
                return <button key={followUp.id} onClick={() => openAccountActivity(followUp.accountId)} className="sales-follow-up-row">
                  <span className={`sales-follow-up-date ${overdue ? 'overdue' : 'due-today'}`}><strong>{overdue ? 'Overdue' : 'Due today'}</strong><small>{followUp.nextFollowUpDate}</small></span>
                  <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{followUp.companyName}</strong><small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#667085', fontSize: 11 }}>{followUp.contactName ? `${followUp.contactName} · ` : ''}{followUp.type}: {followUp.remarks}</small></span>
                  {isAdmin && <small className="sales-follow-up-owner">{followUp.ownerName}</small>}
                </button>;
              })}
            </div> : <div className="sales-dashboard-empty sales-follow-up-empty"><span className="sales-dashboard-success-icon"><CircleCheck size={17} /></span><strong>You are all caught up</strong><span>No overdue or due-today follow-ups.</span></div>}
          </section>
          <section className="sales-lift-card interactive-lift-card" style={{ ...panelStyle, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div><h2 style={{ margin: 0, fontSize: 16 }}>Recently updated accounts</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 12 }}>Pick up where you left off</p></div>
              <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, color: '#155EEF', background: '#EFF4FF', borderRadius: 9 }}><Building2 size={17} /></span>
            </div>
            {recentAccounts.length ? <div style={{ display: 'grid', gap: 8 }}>
              {recentAccounts.map(account => <button key={account.id} className="sales-recent-account-row" onClick={() => openAccount(account)}>
                <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, flex: '0 0 auto', color: '#1849A9', background: '#EFF4FF', borderRadius: 9 }}><Building2 size={16} /></span>
                <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{account.companyName}</strong><small style={{ display: 'block', color: '#667085', fontSize: 11 }}>{[account.industry, account.location].filter(Boolean).join(' · ') || 'Account details not added'}</small></span>
                <span style={{ ...statusColor(account.status), borderRadius: 12, padding: '4px 8px', fontSize: 10 }}>{account.status}</span>
                {isAdmin && <small className="sales-follow-up-owner">{account.ownerName}</small>}
              </button>)}
            </div> : <div className="sales-dashboard-empty">Accounts you update will appear here.</div>}
          </section>
        </div>}
        <section className="sales-lift-card interactive-lift-card" style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>{salesSection === 'dashboard' ? isAdmin ? 'Sales accounts' : 'Your sales accounts' : salesSection === 'accounts' ? 'Accounts' : `${salesSection[0].toUpperCase()}${salesSection.slice(1)} by account`}</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 13 }}>{salesSection === 'dashboard' ? isAdmin ? 'A quick view across all company accounts.' : 'A quick view of your accounts and customer relationships.' : `Choose an account to open its ${salesSection === 'accounts' ? 'details' : salesSection} section.`}</p></div>
            <button style={primaryButton} onClick={() => openModal('account')}><CirclePlus size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Add account</button>
          </div>
          {(salesSection === 'dashboard' || salesSection === 'accounts') && <div className="sales-account-status-tabs" role="group" aria-label="Filter accounts by status">
            {([
              ['All', counts.total],
              ['Prospect', counts.prospect],
              ['Active', counts.active],
            ] as const).map(([status, count]) => <button key={status} type="button" aria-pressed={statusFilter === status} className={`sales-account-status-tab${statusFilter === status ? ' is-active' : ''}`} onClick={() => setStatusFilter(status)}>
              {status}<span>{count}</span>
            </button>)}
          </div>}
          <div style={{ display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap' }}>
            <form onSubmit={event => { event.preventDefault(); setAppliedSearch(search.trim()); }} style={{ display: 'flex', gap: 7, flex: 1, minWidth: 220 }}>
              <div style={{ position: 'relative', flex: 1 }}><Search size={15} style={{ position: 'absolute', top: 11, left: 11, color: '#98A2B3' }} /><input aria-label="Search accounts" placeholder="Search company, industry or location" value={search} onChange={event => { setSearch(event.target.value); setAppliedSearch(event.target.value.trim()); }} style={{ ...inputStyle, paddingLeft: 34 }} /></div>
            </form>
            <select className="sales-select" aria-label="Filter by account status" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} style={{ ...selectStyle, width: 150 }}>
              <option value="All">All statuses</option><option value="Prospect">Prospect</option><option value="Active">Active</option>
            </select>
            {isAdmin && <select className="sales-select" aria-label="Filter by account owner" value={ownerFilter} onChange={event => setOwnerFilter(event.target.value)} style={{ ...selectStyle, width: 190 }}>
              <option value="">All account owners</option>{salesOwnerOptions.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>}
          </div>
          {loading ? <p style={{ color: '#667085', fontSize: 13 }}>Loading sales accounts…</p> : filteredAccounts.length ? <>
            <div style={{ overflowX: 'auto' }}>
            <table className="sales-account-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['Company', 'Industry', 'Location', ...(isAdmin ? ['Account owner'] : []), 'Status', ''].map(heading => <th key={heading} style={{ textAlign: 'left', padding: '11px 10px', color: '#667085', borderBottom: '1px solid #EAECF0', whiteSpace: 'nowrap' }}>{heading}</th>)}</tr></thead>
              <tbody>{filteredAccounts.map(account => <tr className="sales-account-row" key={account.id}>
                <td style={{ padding: '14px 10px', borderBottom: '1px solid #F0F1F4', fontWeight: 600 }}><button type="button" className="sales-open-account" onClick={() => openAccount(account)}>{account.companyName}</button></td>
                <td style={{ padding: '14px 10px', borderBottom: '1px solid #F0F1F4', color: '#667085' }}>{account.industry || '—'}</td>
                <td style={{ padding: '14px 10px', borderBottom: '1px solid #F0F1F4', color: '#667085' }}>{account.location || '—'}</td>
                {isAdmin && <td style={{ padding: '14px 10px', borderBottom: '1px solid #F0F1F4', color: '#667085' }}>{account.ownerName}</td>}
                <td style={{ padding: '14px 10px', borderBottom: '1px solid #F0F1F4' }}><span style={{ ...statusColor(account.status), borderRadius: 12, padding: '4px 9px' }}>{account.status}</span></td>
                <td style={{ padding: '10px', borderBottom: '1px solid #F0F1F4' }}><button type="button" className="sales-account-open-icon" aria-label={`Open ${account.companyName}`} onClick={() => openAccount(account)}><ExternalLink size={14} /></button></td>
              </tr>)}</tbody>
            </table>
            </div>
            <div className="sales-account-table-footer">Showing {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'}</div>
          </> : <div style={{ textAlign: 'center', padding: '36px 12px', color: '#667085' }}><Building2 size={24} /><p style={{ margin: '10px 0 4px', fontWeight: 600, color: '#344054' }}>No accounts found</p><span style={{ fontSize: 13 }}>Add an account or update your search filters.</span></div>}
        </section>
      </>}

      {modal && <SalesModal
        kind={modal}
        editing={editing}
        profile={profile}
        employees={isAdmin ? salesOwnerOptions : []}
        currentEmployeeId={activeEmployeeOptions.find(employee => employee.email.toLowerCase() === currentUser.email.toLowerCase())?.id}
        defaultContactId={activityContactId}
        isAdmin={isAdmin}
        saving={saving}
        onClose={() => { if (!saving) { setModal(null); setEditing(null); setActivityContactId(null); } }}
        onSubmit={form => modal === 'account' ? submitAccount(form) : submitRecord(form)}
      />}
      {viewingContact && <ContactDetailsModal
        contact={viewingContact}
        latestActivity={latestActivityByContact.get(viewingContact.id) ?? null}
        onClose={() => setViewingContact(null)}
        onEdit={() => { const contact = viewingContact; setViewingContact(null); openModal('contacts', contact); }}
        onLogActivity={() => logContactActivity(viewingContact)}
      />}
      {globalContactAddOpen && <GlobalContactCreateModal
        accounts={contactAccountOptions}
        saving={globalContactSaving}
        onClose={() => { if (!globalContactSaving) setGlobalContactAddOpen(false); }}
        onSubmit={createGlobalContact}
      />}
    </section>
  );
};

function SalesModal({
  kind, editing, profile, employees, currentEmployeeId, defaultContactId, isAdmin, saving, onClose, onSubmit,
}: {
  kind: ModalKind;
  editing: SalesRecord | SalesAccount | null;
  profile: SalesAccountProfile | null;
  employees: Array<{ id: string; name: string }>;
  currentEmployeeId?: string;
  defaultContactId?: string | null;
  isAdmin: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: HTMLFormElement) => Promise<void>;
}) {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const account = kind === 'account' ? editing as SalesAccount | null : null;
  const record = kind !== 'account' ? editing as SalesRecord | null : null;
  const contactOptions = profile?.contacts ?? [];
  const singular = kind === 'account' ? 'account' : recordLabel[kind];
  const title = editing ? `Edit ${singular}` : `Add ${singular}`;
  const field = (label: string, name: string, value = '', type = 'text', required = false) => (
    <Field key={name} label={label}><input name={name} type={type} required={required} defaultValue={value} style={inputStyle} /></Field>
  );
  const select = (label: string, name: string, options: string[], value?: string) => (
    <Field key={name} label={label}><select className="sales-select" name={name} defaultValue={value ?? options[0]} style={selectStyle}>{options.map(option => <option key={option}>{option}</option>)}</select></Field>
  );
  const contactSelect = (label: string) => <Field label={label} key="contactId"><select className="sales-select" name="contactId" defaultValue={record && 'contactId' in record ? record.contactId ?? '' : defaultContactId ?? ''} style={selectStyle}><option value="">No contact</option>{contactOptions.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></Field>;
  const recordName = (name: string) => (record && name in record ? String((record as unknown as Record<string, unknown>)[name] ?? '') : '');

  return <div className="sales-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(16,24,40,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
    <form className="sales-modal" onSubmit={event => { event.preventDefault(); void onSubmit(event.currentTarget); }} style={{ width: 'min(560px, 100%)', maxHeight: '90dvh', overflowY: 'auto', background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 20px 50px rgba(16,24,40,.22)' }}>
      <h2 className="sales-modal-title" style={{ margin: '0 0 18px', fontSize: 19 }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {kind === 'account' && <>
          {field('Company name', 'companyName', account?.companyName ?? '', 'text', true)}
          {field('Industry', 'industry', account?.industry)}
          {field('Website', 'website', account?.website, 'url')}
          {field('LinkedIn URL', 'linkedinUrl', account?.linkedinUrl, 'url')}
          {field('Location', 'location', account?.location)}
          {select('Status', 'status', ['Prospect', 'Active'], account?.status)}
          {isAdmin && <Field label="Account owner"><select className="sales-select" name="ownerEmployeeId" defaultValue={account?.ownerEmployeeId ?? currentEmployeeId ?? ''} style={selectStyle} required><option value="">Choose employee</option>{account?.ownerEmployeeId && !employees.some(employee => employee.id === account.ownerEmployeeId) && <option value={account.ownerEmployeeId}>{account.ownerName} (Sales access disabled)</option>}{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field>}
        </>}
        {kind === 'contacts' && <>
          {field('Name', 'name', recordName('name'), 'text', true)}
          {field('Designation', 'designation', recordName('designation'))}
          {field('Email', 'email', recordName('email'), 'email')}
          {field('Phone', 'phone', recordName('phone'), 'tel')}
          {field('LinkedIn URL', 'linkedinUrl', recordName('linkedinUrl'), 'url')}
          {select('Status', 'status', ['Active', 'Inactive'], recordName('status'))}
        </>}
        {kind === 'activities' && <>
          {select('Activity type', 'type', ['Call', 'Email', 'Meeting', 'LinkedIn outreach', 'Follow-up'], (record as SalesActivity | null)?.type)}
          {field('Date', 'activityDate', (record as SalesActivity | null)?.activityDate ?? today, 'date', true)}
          {contactSelect('Contact')}
          {field('Next follow-up date', 'nextFollowUpDate', (record as SalesActivity | null)?.nextFollowUpDate ?? '', 'date')}
          <Field label="Remarks"><textarea name="remarks" defaultValue={(record as SalesActivity | null)?.remarks ?? ''} required rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
        </>}
        {kind === 'leads' && <>
          {field('Lead name', 'name', recordName('name'), 'text', true)}
          {contactSelect('Contact')}
          {field('Service interest', 'serviceInterest', recordName('serviceInterest'), 'text', true)}
          {field('Lead source', 'source', recordName('source'), 'text', true)}
          {select('Status', 'status', ['New', 'Contacted', 'Qualified', 'Disqualified', 'Converted'], recordName('status'))}
          {isAdmin && <Field label="Assigned employee"><select className="sales-select" name="assignedEmployeeId" defaultValue={(record as SalesLead | null)?.assignedEmployeeId ?? employees[0]?.id ?? ''} style={selectStyle} required>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field>}
        </>}
        {kind === 'opportunities' && <>
          {field('Opportunity name', 'name', recordName('name'), 'text', true)}
          {contactSelect('Contact')}
          {field('Service required', 'serviceRequired', recordName('serviceRequired'), 'text', true)}
          {select('Stage', 'stage', ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'], recordName('stage'))}
          {field('Expected closing date', 'expectedClosingDate', (record as SalesOpportunity | null)?.expectedClosingDate ?? '', 'date')}
          <Field label="Notes"><textarea name="notes" defaultValue={recordName('notes')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
        </>}
        {kind === 'notes' && <Field label="Note"><textarea name="content" defaultValue={(record as SalesNote | null)?.content ?? ''} required rows={6} style={{ ...inputStyle, resize: 'vertical' }} /></Field>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button type="button" onClick={onClose} style={quietButton} disabled={saving}>Cancel</button>
        <button type="submit" style={primaryButton} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  </div>;
}

function ContactDetailsModal({
  contact, latestActivity, onClose, onEdit, onLogActivity,
}: {
  contact: SalesContact;
  latestActivity: SalesActivity | null;
  onClose: () => void;
  onEdit: () => void;
  onLogActivity: () => void;
}) {
  const linkedInUrl = safeExternalUrl(contact.linkedinUrl);
  const details = [
    ['Designation', contact.designation || '—'],
    ['Email', contact.email || '—'],
    ['Phone', contact.phone || '—'],
    ['Status', contact.status],
  ];
  return <div className="sales-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(16,24,40,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
    <section className="sales-modal" role="dialog" aria-modal="true" aria-labelledby="sales-contact-title" style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 20px 50px rgba(16,24,40,.22)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
        <div><h2 className="sales-modal-title" id="sales-contact-title" style={{ margin: 0, fontSize: 19 }}>{contact.name}</h2><p style={{ margin: '5px 0 0', color: '#667085', fontSize: 13 }}>Contact details</p></div>
        <button type="button" onClick={onClose} style={quietButton}>Close</button>
      </div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 20px', margin: 0 }}>
        {details.map(([label, value]) => <div key={label}><dt style={{ color: '#667085', fontSize: 12, marginBottom: 4 }}>{label}</dt><dd style={{ margin: 0, fontSize: 14, overflowWrap: 'anywhere' }}>{value}</dd></div>)}
        <div><dt style={{ color: '#667085', fontSize: 12, marginBottom: 4 }}>LinkedIn</dt><dd style={{ margin: 0, fontSize: 14 }}>{linkedInUrl ? <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#155EEF' }}>Open profile</a> : '—'}</dd></div>
      </dl>
      <div style={{ marginTop: 18, padding: 13, borderRadius: 9, background: '#F9FAFB' }}>
        <strong style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Last activity</strong>
        {latestActivity ? <><div style={{ fontSize: 13 }}>{latestActivity.type} · {latestActivity.activityDate}</div><p style={{ color: '#475467', fontSize: 13, margin: '5px 0 0', whiteSpace: 'pre-wrap' }}>{latestActivity.remarks}</p></> : <span style={{ color: '#667085', fontSize: 13 }}>No activity recorded for this contact.</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
        <button type="button" onClick={onEdit} style={quietButton}><Pencil size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Edit contact</button>
        <button type="button" onClick={onLogActivity} style={primaryButton}><Plus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Log activity</button>
      </div>
    </section>
  </div>;
}

function GlobalContactCreateModal({
  accounts, saving, onClose, onSubmit,
}: {
  accounts: SalesAccount[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: HTMLFormElement) => Promise<void>;
}) {
  const field = (label: string, name: string, type = 'text', required = false) => (
    <Field key={name} label={label}><input name={name} type={type} required={required} style={inputStyle} /></Field>
  );
  return <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(16,24,40,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
    <form onSubmit={event => { event.preventDefault(); void onSubmit(event.currentTarget); }} style={{ width: 'min(560px, 100%)', maxHeight: '90dvh', overflowY: 'auto', background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 20px 50px rgba(16,24,40,.22)' }}>
      <h2 style={{ margin: '0 0 18px', fontSize: 19 }}>Add contact</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <Field label="Account"><select className="sales-select" name="accountId" defaultValue="" required style={selectStyle}><option value="" disabled>Choose an account</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.companyName}</option>)}</select></Field>
        {field('Name', 'name', 'text', true)}
        {field('Designation', 'designation')}
        {field('Email', 'email', 'email')}
        {field('Phone', 'phone', 'tel')}
        {field('LinkedIn URL', 'linkedinUrl', 'url')}
        <Field label="Status"><select className="sales-select" name="status" defaultValue="Active" style={selectStyle}><option>Active</option><option>Inactive</option></select></Field>
      </div>
      {!accounts.length && <p role="status" style={{ color: '#B42318', fontSize: 13, marginBottom: 0 }}>Create an account before adding contacts.</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button type="button" onClick={onClose} style={quietButton} disabled={saving}>Cancel</button>
        <button type="submit" style={primaryButton} disabled={saving || !accounts.length}>{saving ? 'Saving…' : 'Save contact'}</button>
      </div>
    </form>
  </div>;
}
