import React, { useEffect, useMemo, useState } from 'react';
import { X, Send, Search } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { employeesApi } from '../../lib/api';
import type { Employee } from '../../types/erp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function defaultCycle(): string {
  const now = new Date();
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()} Performance Review`;
}

export const CreateAppraisalCycleModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createAppraisalCycle } = useERP();
  const [cycle, setCycle] = useState(defaultCycle);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void employeesApi.list()
      .then(records => {
        if (active) setEmployees(records.filter(employee => employee.status === 'Active'));
      })
      .catch(loadError => {
        if (active) {
          setEmployees([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load active employees.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingEmployees(false);
      });
    return () => { active = false; };
  }, [isOpen]);

  const visibleEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(employee => (
      `${employee.firstName} ${employee.lastName} ${employee.department} ${employee.designation}`
        .toLowerCase()
        .includes(query)
    ));
  }, [employees, search]);
  const allEmployeesSelected = employees.length > 0 && selectedEmployeeIds.length === employees.length;

  if (!isOpen) return null;

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(previous => previous.includes(employeeId)
      ? previous.filter(id => id !== employeeId)
      : [...previous, employeeId]);
  };

  const toggleAllEmployees = () => {
    setSelectedEmployeeIds(allEmployeesSelected ? [] : employees.map(employee => employee.id));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (selectedEmployeeIds.length === 0) {
      setError('Select at least one active employee for this cycle.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createAppraisalCycle(cycle, selectedEmployeeIds);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to start this review cycle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '90vh' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Start appraisal cycle</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Choose one or more active employees. Only selected employees receive a self-review.
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="appraisal-cycle">Review cycle name *</label>
            <input
              id="appraisal-cycle"
              required
              maxLength={100}
              className="form-control"
              value={cycle}
              onChange={event => setCycle(event.target.value)}
              placeholder="Q4 2026 Performance Review"
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Employees *</label>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {selectedEmployeeIds.length} selected
              </span>
            </div>
            <label style={{ position: 'relative', display: 'block', marginBottom: '10px' }}>
              <Search size={16} aria-hidden="true" style={{ position: 'absolute', top: '11px', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="form-control"
                aria-label="Search active employees"
                placeholder="Search name, department, or job title"
                value={search}
                onChange={event => setSearch(event.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {employees.length} active employee{employees.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={isLoadingEmployees || employees.length === 0}
                onClick={toggleAllEmployees}
              >
                {allEmployeesSelected ? 'Clear selection' : 'Select all active'}
              </button>
            </div>
            <div style={{
              maxHeight: '230px',
              overflowY: 'auto',
              border: '1px solid var(--border-light)',
              borderRadius: '9px',
              padding: '4px',
            }}>
              {isLoadingEmployees ? (
                <p role="status" style={{ margin: 0, padding: '18px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                  Loading active employees…
                </p>
              ) : visibleEmployees.length === 0 ? (
                <p style={{ margin: 0, padding: '18px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                  {employees.length ? 'No employees match your search.' : 'No active employees available.'}
                </p>
              ) : visibleEmployees.map(employee => (
                <label key={employee.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                  />
                  <img
                    src={employee.avatar}
                    alt=""
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ display: 'grid', gap: '2px' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '12px' }}>{employee.firstName} {employee.lastName}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{employee.department} · {employee.designation}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          {error && (
            <div role="alert" style={{ padding: '10px 12px', marginTop: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || isLoadingEmployees || cycle.trim().length < 2 || selectedEmployeeIds.length === 0} className="btn btn-primary">
              <Send size={15} /> {isSubmitting ? 'Starting…' : `Start cycle${selectedEmployeeIds.length ? ` (${selectedEmployeeIds.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
