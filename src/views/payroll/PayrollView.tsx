import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileText, Send, Sparkles } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { PayrollRecord } from '../../types/erp';
import { CreatePayrollRunModal } from '../../components/modals/CreatePayrollRunModal';
import { PayslipDetailModal } from '../../components/modals/PayslipDetailModal';

export const PayrollView: React.FC = () => {
  const {
    payroll,
    payrollLoading,
    payrollError,
    role,
    currentUser,
    employees,
    updatePayrollStatus,
    setFigmaOverlayAsset,
  } = useERP();
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const ownEmployee = employees.find(employee => employee.email === currentUser.email);

  const periods = useMemo(() => [...new Set(payroll.map(record => `${record.year}-${String(new Date(`${record.month} 1, ${record.year}`).getMonth() + 1).padStart(2, '0')}`))].sort().reverse(), [payroll]);
  const displayedPayroll = payroll.filter(record => (
    (role === 'admin' || record.employeeId === ownEmployee?.id)
    && (filterPeriod === 'all' || `${record.year}-${String(new Date(`${record.month} 1, ${record.year}`).getMonth() + 1).padStart(2, '0')}` === filterPeriod)
  ));
  const totalNetPay = displayedPayroll.reduce((sum, record) => sum + record.netPay, 0);
  const totalEarnings = displayedPayroll.reduce((sum, record) => sum + record.totalEarnings, 0);
  const totalDeductions = displayedPayroll.reduce((sum, record) => sum + record.totalDeductions, 0);
  const periodLabel = filterPeriod === 'all'
    ? 'All pay periods'
    : new Date(`${filterPeriod}-01T00:00:00.000Z`).toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const markAsPaid = async (record: PayrollRecord) => {
    setActionError(null);
    setIsMarkingPaid(record.id);
    try {
      const updated = await updatePayrollStatus(record.id, 'Paid');
      setSelectedRecord(current => current?.id === record.id ? updated : current);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update payroll status.');
    } finally {
      setIsMarkingPaid(null);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              {role === 'admin' ? 'Payroll Records' : 'My Payslips'}
            </h2>
            <span className="badge badge-neutral">{periodLabel}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Payroll figures are recorded for review; this module does not calculate tax rules or transfer money.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setFigmaOverlayAsset(
              role === 'admin'
                ? '/design-assets/Payroll/Payroll — Overview.svg'
                : '/design-assets/Payroll/Employee — My Payslips.svg'
            )}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#0052FF" />
            <span>Compare Figma Spec</span>
          </button>
          {role === 'admin' && (
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <Send size={16} />
              <span>Create Payroll Run</span>
            </button>
          )}
        </div>
      </div>

      {(payrollError || actionError) && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {actionError ?? payrollError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>NET PAY IN VIEW</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0052FF', marginTop: '4px' }}>${totalNetPay.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{displayedPayroll.length} payroll records</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL EARNINGS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#05B169', marginTop: '4px' }}>${totalEarnings.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Admin-entered amounts</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL DEDUCTIONS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#CF202F', marginTop: '4px' }}>${totalDeductions.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>No tax rules are applied</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>PENDING STATUS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>
            {displayedPayroll.filter(record => record.status !== 'Paid').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Payment status records only</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label htmlFor="payroll-period" style={{ fontSize: '13px', fontWeight: '600' }}>Pay period</label>
        <select id="payroll-period" className="form-control" style={{ width: '220px' }} value={filterPeriod} onChange={event => setFilterPeriod(event.target.value)}>
          <option value="all">All periods</option>
          {periods.map(period => (
            <option key={period} value={period}>
              {new Date(`${period}-01T00:00:00.000Z`).toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Basic Salary</th>
              <th>Gross Earnings</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrollLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading payroll records…</td></tr>
            ) : displayedPayroll.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No payroll records for this period.</td></tr>
            ) : displayedPayroll.map(record => (
              <tr key={record.id} onClick={() => setSelectedRecord(record)} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{record.employeeName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{record.employeeCode} · {record.designation}</div>
                </td>
                <td><span style={{ color: 'var(--text-secondary)' }}>{record.department}</span></td>
                <td>${record.basicSalary.toLocaleString()}</td>
                <td><span style={{ fontWeight: '600', color: '#05B169' }}>+${record.totalEarnings.toLocaleString()}</span></td>
                <td><span style={{ fontWeight: '600', color: '#CF202F' }}>-${record.totalDeductions.toLocaleString()}</span></td>
                <td><strong style={{ fontSize: '15px', color: '#0052FF' }}>${record.netPay.toLocaleString()}</strong></td>
                <td><span className={`badge ${record.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}><span className="badge-dot" />{record.status}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={event => { event.stopPropagation(); setSelectedRecord(record); }} className="btn btn-sm btn-ghost">
                    <FileText size={14} color="#0052FF" /> View
                  </button>
                  {role === 'admin' && record.status !== 'Paid' && (
                    <button
                      disabled={isMarkingPaid === record.id}
                      onClick={event => { event.stopPropagation(); void markAsPaid(record); }}
                      className="btn btn-sm btn-secondary"
                      title="Record payment status only; this does not transfer money."
                    >
                      <CheckCircle2 size={14} /> {isMarkingPaid === record.id ? 'Saving…' : 'Mark paid'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreatePayrollRunModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <PayslipDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
};
