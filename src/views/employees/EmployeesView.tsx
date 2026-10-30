import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  MapPin, 
  KeyRound,
  UserCheck,
  UserX,
  Copy,
  X,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AddEmployeeModal } from '../../components/modals/AddEmployeeModal';
import { TableSkeletonRows } from '../../components/feedback/LoadingSkeleton';

export const EmployeesView: React.FC = () => {
  const { 
    employees, 
    employeesLoading,
    role,
    issueEmployeeAccessLink,
    setEmployeeAccountActive,
    setCurrentView, 
    setSelectedEmployeeId
  } = useERP();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState<{ employeeName: string; url: string; purpose: 'setup' | 'reset'; expiresAt: string } | null>(null);
  const [accountActionError, setAccountActionError] = useState<string | null>(null);
  const [pendingAccountAction, setPendingAccountAction] = useState<string | null>(null);

  const departments = ['All', ...new Set(employees.map(employee => employee.department))];

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || 
                          emp.designation.toLowerCase().includes(search.toLowerCase()) ||
                          emp.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="badge badge-success"><span className="badge-dot" />Active</span>;
      case 'On Leave':
        return <span className="badge badge-warning"><span className="badge-dot" />On Leave</span>;
      case 'Probation':
        return <span className="badge badge-primary"><span className="badge-dot" />Probation</span>;
      default:
        return <span className="badge badge-neutral"><span className="badge-dot" />{status}</span>;
    }
  };

  const createAccessLink = async (employeeId: string, employeeName: string) => {
    setPendingAccountAction(employeeId);
    setAccountActionError(null);
    try {
      const result = await issueEmployeeAccessLink(employeeId);
      setAccessLink({
        employeeName,
        url: new URL(result.accessPath, window.location.origin).toString(),
        purpose: result.purpose,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      setAccountActionError(error instanceof Error ? error.message : 'Unable to create an access link.');
    } finally {
      setPendingAccountAction(null);
    }
  };

  const updateAccountAccess = async (employeeId: string, isActive: boolean) => {
    setPendingAccountAction(employeeId);
    setAccountActionError(null);
    try {
      await setEmployeeAccountActive(employeeId, isActive);
    } catch (error) {
      setAccountActionError(error instanceof Error ? error.message : 'Unable to update account access.');
    } finally {
      setPendingAccountAction(null);
    }
  };

  const copyAccessLink = async () => {
    if (!accessLink) return;
    try {
      await navigator.clipboard.writeText(accessLink.url);
    } catch {
      setAccountActionError('Clipboard access was blocked. Select and copy the access link manually.');
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Staff Directory
            </h2>
            <span className="badge badge-neutral">{filteredEmployees.length} Personnel</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Browse enterprise organizational charts, skill profiles, and contact details.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              <UserPlus size={16} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search Field */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search by name, role, code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '38px' }}
            />
          </div>

          {/* Department Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedDept === dept ? 'var(--primary)' : 'var(--border-default)',
                  backgroundColor: selectedDept === dept ? 'var(--primary-light)' : '#FFFFFF',
                  color: selectedDept === dept ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: selectedDept === dept ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Status:</span>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                width: 'auto',
                minWidth: '150px',
                padding: '6px 36px 6px 12px',
                fontSize: '12.5px',
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Probation">Probation</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee directory */}
      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              {role === 'admin' && <th>Login Access</th>}
              <th>Location</th>
              <th>Join Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employeesLoading ? (
              <TableSkeletonRows columns={role === 'admin' ? 8 : 7} rows={6} />
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={role === 'admin' ? 8 : 7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  No employees matched your current search filters.
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr 
                  key={emp.id}
                  className="arrow-lift-row"
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setCurrentView('employee-profile');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={emp.avatar} 
                        alt={emp.firstName} 
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {emp.employeeCode} • {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{emp.department}</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>{emp.designation}</span>
                  </td>
                  <td>
                    {getStatusBadge(emp.status)}
                  </td>
                  {role === 'admin' && (
                    <td className="employee-account-cell" onClick={event => event.stopPropagation()}>
                      <div className="employee-account-controls">
                        <span className={`badge ${emp.accountStatus === 'Active' || emp.accountStatus === 'Admin account' ? 'badge-success' : emp.accountStatus === 'Deactivated' ? 'badge-neutral' : 'badge-warning'}`}>
                          <span className="badge-dot" />{emp.accountStatus ?? 'Not set up'}
                        </span>
                        <div className="employee-account-actions">
                          {emp.accountStatus !== 'Admin account' && (
                            <button
                              type="button"
                              disabled={pendingAccountAction === emp.id || emp.status === 'Inactive'}
                              onClick={() => void createAccessLink(emp.id, `${emp.firstName} ${emp.lastName}`)}
                              className="btn btn-secondary btn-sm"
                              title="Create a one-time password setup or reset link."
                            >
                              <KeyRound size={14} />
                              {pendingAccountAction === emp.id ? 'Please wait…' : emp.accountStatus === 'Active' || emp.accountStatus === 'Deactivated' ? 'Reset link' : 'Setup link'}
                            </button>
                          )}
                          {(emp.accountStatus === 'Active' || emp.accountStatus === 'Deactivated') && (
                            <button
                              type="button"
                              disabled={pendingAccountAction === emp.id || (emp.accountStatus === 'Deactivated' && emp.status === 'Inactive')}
                              onClick={() => void updateAccountAccess(emp.id, emp.accountStatus === 'Deactivated')}
                              className={`btn btn-sm ${emp.accountStatus === 'Active' ? 'employee-account-deactivate' : 'btn-secondary'}`}
                              title={emp.accountStatus === 'Active' ? 'Deactivate and revoke this employee’s sessions.' : 'Reactivate login access.'}
                            >
                              {emp.accountStatus === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                              {pendingAccountAction === emp.id ? 'Please wait…' : emp.accountStatus === 'Active' ? 'Deactivate' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      <MapPin size={13} color="var(--text-muted)" />
                      <span>{emp.location}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{emp.joinDate}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployeeId(emp.id);
                        setCurrentView('employee-profile');
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="arrow-lift-trigger" size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {role === 'admin' && (
        <AddEmployeeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {accountActionError && (
        <div role="alert" style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 1300, maxWidth: '420px', padding: '12px 16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', boxShadow: 'var(--shadow-md)' }}>
          {accountActionError}
          <button type="button" aria-label="Dismiss" onClick={() => setAccountActionError(null)} style={{ marginLeft: '12px', border: 0, background: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {accessLink && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  {accessLink.purpose === 'setup' ? 'Employee setup link' : 'Password reset link'}
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{accessLink.employeeName} · expires {new Date(accessLink.expiresAt).toLocaleString()}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setAccessLink(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 0 }}>
                Share this one-time link with the employee through a trusted channel. It expires in 24 hours and can only be used once. The app does not send email.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input aria-label="One-time access link" readOnly className="form-control" value={accessLink.url} onFocus={event => event.currentTarget.select()} />
                <button type="button" className="btn btn-secondary" onClick={() => void copyAccessLink()}>
                  <Copy size={15} /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
