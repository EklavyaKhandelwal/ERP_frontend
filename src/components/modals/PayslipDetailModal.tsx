import React from 'react';
import { X, Printer } from 'lucide-react';
import { PayrollRecord } from '../../types/erp';
import { formatINR } from '../../lib/formatCurrency';

interface Props {
  record: PayrollRecord | null;
  onClose: () => void;
}

export const PayslipDetailModal: React.FC<Props> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', padding: 0, overflow: 'hidden' }}>
        {/* Top Actions */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8F9FA'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary">Confidential Payslip</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
              Period: {record.month} {record.year}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Paystub Body */}
        <div style={{ padding: '32px', backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0A0B0D', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', backgroundColor: '#0052FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' }}>
                  A
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0A0B0D' }}>AAVIL Inc.</div>
              </div>
              <div style={{ fontSize: '12px', color: '#5B616E', marginTop: '6px' }}>
                Payroll record for informational purposes
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0052FF' }}>SALARY PAYSLIP</div>
              <div style={{ fontSize: '12px', color: '#5B616E', marginTop: '2px' }}>
                Slip Ref: <strong>AAV-PAY-{record.id.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#5B616E' }}>
                Payment status date: <strong>{record.paymentDate || 'Not recorded'}</strong>
              </div>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#F8F9FB',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '12.5px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Employee Name</span>
              <div style={{ fontWeight: '700', color: '#0A0B0D' }}>{record.employeeName}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Employee ID</span>
              <div style={{ fontWeight: '700', color: '#0A0B0D' }}>{record.employeeCode}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Department</span>
              <div style={{ fontWeight: '700', color: '#0A0B0D' }}>{record.department}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Designation</span>
              <div style={{ fontWeight: '700', color: '#0A0B0D' }}>{record.designation}</div>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Earnings */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', backgroundColor: '#F0FDF4', color: '#166534', fontWeight: '700', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                Earnings / Allowances
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Basic Salary</span>
                  <span style={{ fontWeight: '600' }}>{formatINR(record.basicSalary)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>House Rent Allowance (HRA)</span>
                  <span style={{ fontWeight: '600' }}>{formatINR(record.hra)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Special Allowance</span>
                  <span style={{ fontWeight: '600' }}>{formatINR(record.specialAllowance)}</span>
                </div>
                {record.bonus > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Performance Bonus</span>
                    <span style={{ fontWeight: '600', color: '#05B169' }}>+{formatINR(record.bonus)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>Gross Earnings</span>
                  <span style={{ color: '#05B169' }}>{formatINR(record.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', color: '#991B1B', fontWeight: '700', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                Statutory Deductions & Taxes
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Provident Fund (PF)</span>
                  <span style={{ fontWeight: '600' }}>{formatINR(record.providentFund)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Income Tax (TDS)</span>
                  <span style={{ fontWeight: '600' }}>{formatINR(record.incomeTax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Professional Tax</span>
                  <span style={{ fontWeight: '600' }}>{formatINR(record.professionalTax)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '28px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>Total Deductions</span>
                  <span style={{ color: '#CF202F' }}>−{formatINR(record.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box */}
          <div style={{
            padding: '20px 24px',
            backgroundColor: '#0A0B0D',
            color: '#FFFFFF',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net Take-Home Pay
              </div>
              <div style={{ fontSize: '13px', color: '#DDE2E8', marginTop: '4px' }}>
                Status: {record.status}. No payment transfer is initiated by this application.
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {formatINR(record.netPay)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
