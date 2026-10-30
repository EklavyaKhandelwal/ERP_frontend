import React, { useEffect, useState } from 'react';
import { Copy, KeyRound, ShieldCheck, UserPlus, UserRound, UserX, UserCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { accountApi, type AdminAccount } from '../../lib/api';
import { TableSkeletonRows } from '../../components/feedback/LoadingSkeleton';

type InviteLink = { name: string; email: string; url: string; expiresAt: string; emailSent: boolean };

export const AdminAccessView: React.FC = () => {
  const { currentUser } = useERP();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', department: 'Human Resources', designation: 'HR Admin' });
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);

  const loadAdmins = async () => {
    try {
      setAdmins(await accountApi.listAdmins());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load HR admin accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void accountApi.listAdmins()
      .then(records => {
        if (active) setAdmins(records);
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load HR admin accounts.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setPendingId('invite');
    setError(null);
    try {
      const result = await accountApi.inviteAdmin(invite);
      setInviteLink({
        name: invite.name,
        email: invite.email,
        url: new URL(result.invitePath, window.location.origin).toString(),
        expiresAt: result.expiresAt,
        emailSent: result.emailSent,
      });
      setInviteOpen(false);
      setInvite({ name: '', email: '', department: 'Human Resources', designation: 'HR Admin' });
      await loadAdmins();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to invite this HR admin.');
    } finally {
      setPendingId(null);
    }
  };

  const toggleAccess = async (admin: AdminAccount) => {
    setPendingId(admin.id);
    setError(null);
    try {
      await accountApi.setAdminActive(admin.id, !admin.isActive);
      await loadAdmins();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update this account.');
    } finally {
      setPendingId(null);
    }
  };

  const resendInvite = async (admin: AdminAccount) => {
    setPendingId(admin.id);
    setError(null);
    try {
      const result = await accountApi.reissueAdminInvite(admin.id);
      setInviteLink({
        name: admin.name,
        email: admin.email,
        url: new URL(result.invitePath, window.location.origin).toString(),
        expiresAt: result.expiresAt,
        emailSent: result.emailSent,
      });
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to reissue the invitation.');
    } finally {
      setPendingId(null);
    }
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink.url);
    } catch {
      setError('Clipboard access was blocked. Select and copy the invitation link manually.');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>HR admin access</h2>
            <span className="badge badge-neutral">{admins.length} accounts</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
            Invite HR teammates to use their own sign-in. Only the AAVIL owner can manage these accounts.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Invite HR admin
        </button>
      </div>

      {error && !inviteOpen && <div role="alert" style={{ padding: '12px 14px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>{error}</div>}

      {inviteLink && (
        <section className="card" style={{ padding: '20px', marginBottom: '20px', borderColor: 'var(--primary)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <KeyRound size={20} color="var(--primary)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>Invitation link for {inviteLink.name}</strong>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 12px' }}>
                {inviteLink.emailSent
                  ? `An invitation email was sent to ${inviteLink.email}. You can also share this one-time link directly.`
                  : `No invitation email was sent. Copy this one-time link and share it with ${inviteLink.email}.`}
                {' '}It expires {new Date(inviteLink.expiresAt).toLocaleString()}.
              </p>
              <input aria-label="HR admin invitation link" readOnly value={inviteLink.url} className="form-control" />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void copyInvite()}>
              <Copy size={14} /> Copy
            </button>
          </div>
        </section>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="table-container" style={{ border: 0, borderRadius: 0 }}>
            <table className="erp-table">
              <tbody>
                <TableSkeletonRows columns={4} rows={4} />
              </tbody>
            </table>
          </div>
        ) : admins.length === 0 ? (
          <p style={{ padding: '28px', color: 'var(--text-secondary)' }}>No admin accounts found.</p>
        ) : (
          <div className="table-container" style={{ border: 0, borderRadius: 0 }}>
            <table className="erp-table">
              <thead>
                <tr><th>Account</th><th>Department</th><th>Access</th><th style={{ textAlign: 'right' }}>Action</th></tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserRound size={18} color="var(--text-muted)" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{admin.name}{admin.id === currentUser.id ? ' (you)' : ''}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{admin.email} · {admin.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td>{admin.department}</td>
                    <td>
                      {admin.isOwner ? (
                        <span className="badge badge-primary"><ShieldCheck size={12} /> Owner</span>
                      ) : admin.hasCompletedSetup ? (
                        <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          <span className="badge-dot" />{admin.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      ) : (
                        <span className="badge badge-warning"><span className="badge-dot" />Invitation pending</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!admin.isOwner && !admin.hasCompletedSetup && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={pendingId === admin.id}
                          onClick={() => void resendInvite(admin)}
                        >
                          <KeyRound size={14} /> Reissue invite
                        </button>
                      )}
                      {!admin.isOwner && admin.hasCompletedSetup && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={pendingId === admin.id}
                          onClick={() => void toggleAccess(admin)}
                        >
                          {admin.isActive ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Reactivate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inviteOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setInviteOpen(false);
        }}>
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="invite-admin-title" style={{ padding: '28px' }}>
            <h2 id="invite-admin-title" style={{ fontSize: '20px', marginBottom: '6px' }}>Invite an HR admin</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>They will create their own password using a secure, one-time link.</p>
            {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
            <form onSubmit={sendInvite}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-name">Full name</label>
                <input id="admin-name" className="form-control" required maxLength={120} value={invite.name} onChange={event => setInvite({ ...invite, name: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-email">Work email</label>
                <input id="admin-email" type="email" className="form-control" required maxLength={254} value={invite.email} onChange={event => setInvite({ ...invite, email: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-department">Department</label>
                <input id="admin-department" className="form-control" required maxLength={100} value={invite.department} onChange={event => setInvite({ ...invite, department: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-designation">Job title</label>
                <input id="admin-designation" className="form-control" required maxLength={100} value={invite.designation} onChange={event => setInvite({ ...invite, designation: event.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setInviteOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pendingId === 'invite'}>
                  {pendingId === 'invite' ? 'Creating…' : 'Create invitation'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
