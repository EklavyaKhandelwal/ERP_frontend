import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Send, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { PayrollRunRecordInput } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type DraftPayroll = Record<keyof Omit<PayrollRunRecordInput, 'employeeId'>, string>;

const fields: Array<{ key: keyof DraftPayroll; label: string }> = [
  { key: 'basicSalaryMaster', label: 'Basic master' },
  { key: 'basicSalary', label: 'Basic actual' },
  { key: 'hraMaster', label: 'HRA master' },
  { key: 'hra', label: 'HRA actual' },
  { key: 'specialAllowanceMaster', label: 'Allowance master' },
  { key: 'specialAllowance', label: 'Allowance actual' },
  { key: 'bonusMaster', label: 'Bonus master' },
  { key: 'bonus', label: 'Bonus actual' },
  { key: 'providentFund', label: 'PF' },
  { key: 'professionalTax', label: 'Prof. tax' },
  { key: 'incomeTax', label: 'Income tax' },
];

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export const CreatePayrollRunModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { employees, employeesLoading, createPayrollRun } = useERP();
  const activeEmployees = useMemo(() => employees.filter(employee => employee.status === 'Active'), [employees]);
  const activeEmployeeIds = useMemo(() => activeEmployees.map(employee => employee.id), [activeEmployees]);
  const [payPeriod, setPayPeriod] = useState(currentPeriod);
  const [figures, setFigures] = useState<Record<string, DraftPayroll>>({});
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(() => new Set());
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wasOpen = useRef(false);
  const initializedEmployeeIds = useRef('');

  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }
    if (employeesLoading) return;

    const employeeKey = activeEmployeeIds.join(',');
    if (!wasOpen.current || initializedEmployeeIds.current !== employeeKey) {
      setSelectedEmployeeIds(new Set(activeEmployeeIds));
      initializedEmployeeIds.current = employeeKey;
    }
    wasOpen.current = true;
  }, [activeEmployeeIds, employeesLoading, isOpen]);

  if (!isOpen) return null;

  const normalizedSearch = employeeSearch.trim().toLowerCase();
  const visibleEmployees = activeEmployees.filter(employee => (
    `${employee.firstName} ${employee.lastName} ${employee.employeeCode}`.toLowerCase().includes(normalizedSearch)
  ));
  const selectedEmployees = activeEmployees.filter(employee => selectedEmployeeIds.has(employee.id));
  const allVisibleSelected = visibleEmployees.length > 0
    && visibleEmployees.every(employee => selectedEmployeeIds.has(employee.id));

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(current => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const toggleVisibleEmployees = () => {
    setSelectedEmployeeIds(current => {
      const next = new Set(current);
      if (allVisibleSelected) visibleEmployees.forEach(employee => next.delete(employee.id));
      else visibleEmployees.forEach(employee => next.add(employee.id));
      return next;
    });
  };

  const payrollFor = (employeeId: string, salary: number): DraftPayroll => figures[employeeId] ?? ({
    basicSalaryMaster: String(salary),
    hraMaster: '0',
    specialAllowanceMaster: '0',
    bonusMaster: '0',
    basicSalary: String(salary),
    hra: '0',
    specialAllowance: '0',
    bonus: '0',
    providentFund: '0',
    professionalTax: '0',
    incomeTax: '0',
  });

  const updateFigure = (employeeId: string, salary: number, field: keyof DraftPayroll, value: string) => {
    setFigures(current => ({
      ...current,
      [employeeId]: { ...payrollFor(employeeId, salary), [field]: value },
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (selectedEmployees.length === 0) throw new Error('Select at least one employee for this payroll run.');
      const records = selectedEmployees.map(employee => {
        const draft = payrollFor(employee.id, employee.salary ?? 0);
        for (const field of fields) {
          const value = Number(draft[field.key]);
          if (!draft[field.key].trim() || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
            throw new Error(`Enter a valid ${field.label} for ${employee.firstName} ${employee.lastName}.`);
          }
        }
        return {
          employeeId: employee.id,
          basicSalaryMaster: Number(draft.basicSalaryMaster),
          hraMaster: Number(draft.hraMaster),
          specialAllowanceMaster: Number(draft.specialAllowanceMaster),
          bonusMaster: Number(draft.bonusMaster),
          basicSalary: Number(draft.basicSalary),
          hra: Number(draft.hra),
          specialAllowance: Number(draft.specialAllowance),
          bonus: Number(draft.bonus),
          providentFund: Number(draft.providentFund),
          professionalTax: Number(draft.professionalTax),
          incomeTax: Number(draft.incomeTax),
        };
      });
      await createPayrollRun(payPeriod, records);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create payroll run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Create payroll run</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Monthly base salary pre-fills Basic. Enter all amounts in Indian rupees (₹); totals are calculated, but deductions are not tax-advised and creating a run does not send payments.
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: '24px' }}>
          <div className="form-group" style={{ maxWidth: '220px' }}>
            <label className="form-label" htmlFor="pay-period">Pay period *</label>
            <input id="pay-period" type="month" required className="form-control" value={payPeriod} onChange={event => setPayPeriod(event.target.value)} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '18px 0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>Select employees</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {selectedEmployees.length} of {activeEmployees.length} selected
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedEmployeeIds(new Set(activeEmployeeIds))} disabled={!activeEmployees.length}>
                Select all
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedEmployeeIds(new Set())} disabled={!selectedEmployeeIds.size}>
                Clear
              </button>
            </div>
            <label style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 'min(100%, 260px)' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="form-control"
                aria-label="Search employees"
                placeholder="Search name or employee ID"
                value={employeeSearch}
                onChange={event => setEmployeeSearch(event.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </label>
          </div>
          <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: '11px' }}>
            Only selected employees will receive a payroll record for this pay period.
          </p>

          <div className="table-container" style={{ maxHeight: '48vh', overflow: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '44px' }}>
                    <input
                      type="checkbox"
                      aria-label={allVisibleSelected ? 'Deselect visible employees' : 'Select visible employees'}
                      checked={allVisibleSelected}
                      disabled={!visibleEmployees.length}
                      onChange={toggleVisibleEmployees}
                    />
                  </th>
                  <th>Employee</th>
                  {fields.map(field => <th key={field.key}>{field.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {employeesLoading ? (
                  <tr><td colSpan={fields.length + 2} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees…</td></tr>
                ) : (
                  <>
                {visibleEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Include ${employee.firstName} ${employee.lastName} in payroll`}
                        checked={selectedEmployeeIds.has(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                      />
                    </td>
                    <td style={{ minWidth: '190px' }}>
                      <strong style={{ display: 'block' }}>{employee.firstName} {employee.lastName}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{employee.employeeCode}</span>
                    </td>
                    {fields.map(field => (
                      <td key={field.key}>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*([.][0-9]{0,2})?"
                          min="0"
                          max="1000000000"
                          step="0.01"
                          required
                          aria-label={`${field.label} for ${employee.firstName} ${employee.lastName}`}
                          className="form-control"
                          style={{ minWidth: '100px' }}
                          value={payrollFor(employee.id, employee.salary ?? 0)[field.key]}
                          onFocus={event => {
                            if (event.currentTarget.value === '0') event.currentTarget.select();
                          }}
                          onChange={event => updateFigure(employee.id, employee.salary ?? 0, field.key, event.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {activeEmployees.length === 0 && (
                  <tr>
                    <td colSpan={fields.length + 2} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {employees.length
                        ? `No active employees found. ${employees.length} employee record${employees.length === 1 ? ' is' : 's are'} currently not marked Active.`
                        : 'No employee records found. Add employees before creating a payroll run.'}
                    </td>
                  </tr>
                )}
                {activeEmployees.length > 0 && visibleEmployees.length === 0 && (
                  <tr><td colSpan={fields.length + 2} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active employees match your search.</td></tr>
                )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {error && (
            <div role="alert" style={{ padding: '10px 12px', marginTop: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || employeesLoading || selectedEmployees.length === 0} className="btn btn-primary">
              <Send size={15} /> {isSubmitting ? 'Creating…' : 'Create pending run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
