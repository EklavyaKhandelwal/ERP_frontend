import React from 'react';
import { Download, Pencil, X } from 'lucide-react';
import type { PayrollRecord } from '../../types/erp';
import { amountInWords, maskBankAccountNumber } from '../../lib/payrollPdf';
import { formatINR } from '../../lib/formatCurrency';

interface Props {
  record: PayrollRecord | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDownload: () => void;
}

export const PayslipDetailModal: React.FC<Props> = ({ record, isAdmin, onClose, onEdit, onDownload }) => {
  if (!record) return null;
  const masterEarnings = record.basicSalaryMaster + record.hraMaster + record.specialAllowanceMaster + record.bonusMaster;
  const earnings = [
    { label: 'Basic salary', master: record.basicSalaryMaster, actual: record.basicSalary },
    { label: 'HRA', master: record.hraMaster, actual: record.hra },
    { label: 'Special allowance', master: record.specialAllowanceMaster, actual: record.specialAllowance },
    { label: 'Bonus', master: record.bonusMaster, actual: record.bonus },
  ];
  const deductions = [
    { label: 'Provident Fund', actual: record.providentFund },
    { label: 'Professional Tax', actual: record.professionalTax },
    { label: 'Income Tax', actual: record.incomeTax },
  ];
  const employeeDetails = [
    { label: 'Name', value: record.employeeName },
    { label: 'Employee no.', value: record.employeeCode },
    { label: 'Designation', value: record.designation },
    { label: 'Department', value: record.department },
    { label: 'Joining date', value: record.joiningDate },
    { label: 'Location', value: record.location },
    { label: 'Work days', value: String(record.effectiveWorkDays) },
    { label: 'Loss of pay', value: String(record.lossOfPayDays) },
    { label: 'Bank', value: [record.bankName, maskBankAccountNumber(record.bankAccountNumber)].filter(Boolean).join(' · ') || '—' },
    { label: 'PAN', value: record.panNumber || '—' },
    { label: 'PF no.', value: record.providentFundNumber || '—' },
    { label: 'PF UAN', value: record.providentFundUan || '—' },
    ...(record.otherDetails ? [{ label: 'Other', value: record.otherDetails }] : []),
  ];

  return (
    <div className="modal-overlay">
      <section className="modal-content payslip-modal">
        <header className="payslip-modal-toolbar">
          <div className="payslip-modal-heading">
            <strong>{record.payslipStatus} payslip</strong>
            <span>{record.month} {record.year} · Revision {record.revision}</span>
          </div>
          <div className="payslip-modal-actions">
            {isAdmin && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}><Pencil size={14} /> {record.payslipStatus === 'Draft' ? 'Edit draft' : 'Correct'}</button>
            )}
            {record.payslipStatus === 'Published' && (
              <button type="button" className="btn btn-primary btn-sm" onClick={onDownload}><Download size={14} /> Download PDF</button>
            )}
            <button type="button" aria-label="Close payslip" className="btn btn-ghost btn-sm payslip-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </header>

        <article className="payslip-document">
          <header className="payslip-document-title">
            <div className="payslip-brand">
              <span className="payslip-brand-mark">A</span>
              <div className="payslip-brand-copy">
                <strong>AAV INNOVATION LABS</strong>
                <span className="payslip-brand-caption">PEOPLE & PAYROLL</span>
              </div>
            </div>
            <div className="payslip-title-meta">
              <strong>PAYSLIP</strong>
              <span>{record.month} {record.year} · Revision {record.revision}</span>
              <span className={`payslip-status-badge ${record.status.toLowerCase()}`}>{record.status}</span>
            </div>
          </header>

          <section className="payslip-summary" aria-label="Payroll totals">
            <div>
              <span>Gross earnings</span>
              <strong>{formatINR(record.totalEarnings)}</strong>
            </div>
            <div>
              <span>Total deductions</span>
              <strong>{formatINR(record.totalDeductions)}</strong>
            </div>
            <div className="payslip-summary-net">
              <span>Net pay</span>
              <strong>{formatINR(record.netPay)}</strong>
              <small>{amountInWords(record.netPay)}</small>
            </div>
          </section>

          <section className="payslip-employee-card">
            <h3 className="payslip-section-heading">Employee & payment details</h3>
            <div className="payslip-employee-details">
              {employeeDetails.map(item => (
                <div className="payslip-detail-item" key={item.label}>
                  <span>{item.label}</span><strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <div className="payslip-financial-grid">
            <section className="payslip-financial-table">
              <h3>Earnings</h3>
              <div className="payslip-table-heading"><span>Component</span><span>Master</span><span>Actual</span></div>
              {earnings.map(item => (
                <div className="payslip-table-row" key={item.label}>
                  <span>{item.label}</span><span>{formatINR(item.master)}</span><strong>{formatINR(item.actual)}</strong>
                </div>
              ))}
              <div className="payslip-table-row payslip-total-row">
                <strong>Total Earnings</strong><strong>{formatINR(masterEarnings)}</strong><strong>{formatINR(record.totalEarnings)}</strong>
              </div>
            </section>
            <section className="payslip-financial-table">
              <h3>Deductions</h3>
              <div className="payslip-table-heading"><span>Component</span><span /><span>Actual</span></div>
              {deductions.map(item => (
                <div className="payslip-table-row" key={item.label}>
                  <span>{item.label}</span><span /><strong>{formatINR(item.actual)}</strong>
                </div>
              ))}
              <div className="payslip-table-row payslip-total-row">
                <strong>Total Deductions</strong><span /><strong>{formatINR(record.totalDeductions)}</strong>
              </div>
            </section>
          </div>

          <footer className="payslip-footer">
            <span>Confidential. System-generated pay slip, no signature required.</span>
            <span>AAV Innovation Labs · Payslip {record.month} {record.year} · Rev {record.revision}</span>
          </footer>
        </article>
      </section>
    </div>
  );
};
