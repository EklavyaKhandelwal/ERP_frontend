import React, { useMemo, useState } from 'react';
import { X, Send } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { PayrollRunRecordInput } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type DraftPayroll = Omit<PayrollRunRecordInput, 'employeeId'>;

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export const CreatePayrollRunModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { employees, createPayrollRun } = useERP();
  const activeEmployees = useMemo(() => employees.filter(employee => employee.status === 'Active'), [employees]);
  const [payPeriod, setPayPeriod] = useState(currentPeriod);
  const [figures, setFigures] = useState<Record<string, DraftPayroll>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const payrollFor = (employeeId: string, salary: number): DraftPayroll => figures[employeeId] ?? ({
    basicSalary: salary,
    hra: 0,
    specialAllowance: 0,
    bonus: 0,
    providentFund: 0,
    professionalTax: 0,
    incomeTax: 0,
  });

  const updateFigure = (employeeId: string, salary: number, field: keyof DraftPayroll, value: number) => {
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
      if (activeEmployees.length === 0) throw new Error('There are no active employees to include in this run.');
      await createPayrollRun(payPeriod, activeEmployees.map(employee => ({
        employeeId: employee.id,
        ...payrollFor(employee.id, employee.salary ?? 0),
      })));
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create payroll run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields: Array<{ key: keyof DraftPayroll; label: string }> = [
    { key: 'basicSalary', label: 'Basic' },
    { key: 'hra', label: 'HRA' },
    { key: 'specialAllowance', label: 'Allowance' },
    { key: 'bonus', label: 'Bonus' },
    { key: 'providentFund', label: 'PF' },
    { key: 'professionalTax', label: 'Prof. tax' },
    { key: 'incomeTax', label: 'Income tax' },
  ];

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

          <div className="table-container" style={{ maxHeight: '48vh', overflow: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  {fields.map(field => <th key={field.key}>{field.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td style={{ minWidth: '160px' }}>{employee.firstName} {employee.lastName}</td>
                    {fields.map(field => (
                      <td key={field.key}>
                        <input
                          type="number"
                          min="0"
                          max="1000000000"
                          step="0.01"
                          required
                          aria-label={`${field.label} for ${employee.firstName} ${employee.lastName}`}
                          className="form-control"
                          style={{ minWidth: '100px' }}
                          value={payrollFor(employee.id, employee.salary ?? 0)[field.key]}
                          onChange={event => updateFigure(employee.id, employee.salary ?? 0, field.key, Number(event.target.value))}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {activeEmployees.length === 0 && (
                  <tr><td colSpan={fields.length + 1} style={{ padding: '24px', textAlign: 'center' }}>No active employee records found.</td></tr>
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
            <button type="submit" disabled={isSubmitting || activeEmployees.length === 0} className="btn btn-primary">
              <Send size={15} /> {isSubmitting ? 'Creating…' : 'Create pending run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
