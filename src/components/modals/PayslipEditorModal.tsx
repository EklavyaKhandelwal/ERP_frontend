import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { PayrollRecord } from '../../types/erp';
import type { PayrollRecordUpdate } from '../../lib/api';

interface Props {
  record: PayrollRecord;
  onClose: () => void;
  onSaved: (record: PayrollRecord) => void;
}

type NumericField =
  | 'basicSalaryMaster'
  | 'basicSalary'
  | 'hraMaster'
  | 'hra'
  | 'specialAllowanceMaster'
  | 'specialAllowance'
  | 'bonusMaster'
  | 'bonus'
  | 'providentFund'
  | 'professionalTax'
  | 'incomeTax'
  | 'effectiveWorkDays'
  | 'lossOfPayDays';
type TextFields = Omit<PayrollRecordUpdate, NumericField>;
type NumericDraft = Record<NumericField, string>;

const numericFields: Array<{ key: NumericField; label: string }> = [
  { key: 'basicSalaryMaster', label: 'Basic salary (master)' },
  { key: 'basicSalary', label: 'Basic salary (actual)' },
  { key: 'hraMaster', label: 'HRA (master)' },
  { key: 'hra', label: 'HRA (actual)' },
  { key: 'specialAllowanceMaster', label: 'Special allowance (master)' },
  { key: 'specialAllowance', label: 'Special allowance (actual)' },
  { key: 'bonusMaster', label: 'Bonus (master)' },
  { key: 'bonus', label: 'Bonus (actual)' },
  { key: 'providentFund', label: 'Provident Fund' },
  { key: 'professionalTax', label: 'Professional Tax' },
  { key: 'incomeTax', label: 'Income Tax' },
  { key: 'effectiveWorkDays', label: 'Effective work days' },
  { key: 'lossOfPayDays', label: 'LOP days' },
];

const textFields: Array<{ key: keyof TextFields; label: string; maxLength: number }> = [
  { key: 'bankName', label: 'Bank name', maxLength: 120 },
  { key: 'bankAccountNumber', label: 'Bank account number', maxLength: 64 },
  { key: 'panNumber', label: 'PAN number', maxLength: 20 },
  { key: 'providentFundNumber', label: 'PF number', maxLength: 40 },
  { key: 'providentFundUan', label: 'PF UAN', maxLength: 40 },
  { key: 'otherDetails', label: 'Other details', maxLength: 500 },
];

function toNumericDraft(record: PayrollRecord): NumericDraft {
  return {
    basicSalaryMaster: String(record.basicSalaryMaster),
    hraMaster: String(record.hraMaster),
    specialAllowanceMaster: String(record.specialAllowanceMaster),
    bonusMaster: String(record.bonusMaster),
    basicSalary: String(record.basicSalary),
    hra: String(record.hra),
    specialAllowance: String(record.specialAllowance),
    bonus: String(record.bonus),
    providentFund: String(record.providentFund),
    professionalTax: String(record.professionalTax),
    incomeTax: String(record.incomeTax),
    effectiveWorkDays: String(record.effectiveWorkDays),
    lossOfPayDays: String(record.lossOfPayDays),
  };
}

function toTextFields(record: PayrollRecord): TextFields {
  return {
    bankName: record.bankName,
    bankAccountNumber: record.bankAccountNumber,
    panNumber: record.panNumber,
    providentFundNumber: record.providentFundNumber,
    providentFundUan: record.providentFundUan,
    otherDetails: record.otherDetails,
  };
}

export const PayslipEditorModal: React.FC<Props> = ({ record, onClose, onSaved }) => {
  const { updatePayrollRecord } = useERP();
  const [numericDraft, setNumericDraft] = useState<NumericDraft>(() => toNumericDraft(record));
  const [values, setValues] = useState<TextFields>(() => toTextFields(record));
  const [correctionNote, setCorrectionNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isCorrection = record.payslipStatus === 'Published';
  const updateNumber = (key: NumericField, value: string) => {
    setNumericDraft(previous => ({ ...previous, [key]: value }));
  };
  const updateText = (key: keyof PayrollRecordUpdate, value: string) => {
    setValues(previous => ({ ...previous, [key]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isCorrection && correctionNote.trim().length < 10) {
      setError('Enter a correction reason of at least 10 characters.');
      return;
    }
    const parsedNumbers: Pick<PayrollRecordUpdate, NumericField> = {
      basicSalaryMaster: 0,
      hraMaster: 0,
      specialAllowanceMaster: 0,
      bonusMaster: 0,
      basicSalary: 0,
      hra: 0,
      specialAllowance: 0,
      bonus: 0,
      providentFund: 0,
      professionalTax: 0,
      incomeTax: 0,
      effectiveWorkDays: 0,
      lossOfPayDays: 0,
    };
    for (const field of numericFields) {
      const rawValue = numericDraft[field.key].trim();
      const value = Number(rawValue);
      const isDayCount = field.key === 'effectiveWorkDays' || field.key === 'lossOfPayDays';
      if (!rawValue || !Number.isFinite(value) || value < 0 || value > (isDayCount ? 31 : 1_000_000_000)
        || (isDayCount && !Number.isInteger(value))) {
        setError(`Enter a valid ${field.label.toLowerCase()}.`);
        return;
      }
      parsedNumbers[field.key] = value;
    }
    setIsSaving(true);
    try {
      const updated = await updatePayrollRecord(
        record.id,
        { ...values, ...parsedNumbers },
        isCorrection ? correctionNote.trim() : undefined,
      );
      onSaved(updated);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save payslip changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <section className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}>
        <header style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px' }}>{isCorrection ? 'Issue payslip correction' : 'Edit payslip draft'}</h2>
            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              {record.employeeName} · {record.month} {record.year} · Revision {record.revision}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="btn btn-ghost"><X size={18} /></button>
        </header>
        <form onSubmit={event => void save(event)} style={{ padding: '22px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>Earnings and deductions (INR)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
            {numericFields.map(field => (
              <label key={field.key} className="form-group" style={{ margin: 0 }}>
                <span className="form-label">{field.label}</span>
                <input
                  type="text"
                  className="form-control"
                  inputMode="decimal"
                  pattern={field.key === 'effectiveWorkDays' || field.key === 'lossOfPayDays' ? '[0-9]*' : '[0-9]*([.][0-9]{0,2})?'}
                  value={numericDraft[field.key]}
                  onFocus={event => {
                    if (numericDraft[field.key] === '0') event.currentTarget.select();
                  }}
                  onChange={event => updateNumber(field.key, event.target.value)}
                  required
                />
              </label>
            ))}
          </div>
          <h3 style={{ margin: '22px 0 12px', fontSize: '14px' }}>Employee payment details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {textFields.map(field => (
              <label key={field.key} className="form-group" style={{ margin: 0 }}>
                <span className="form-label">{field.label}</span>
                <input
                  className="form-control"
                  maxLength={field.maxLength}
                  value={values[field.key] as string}
                  onChange={event => updateText(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>
          {isCorrection && (
            <label className="form-group" style={{ marginTop: '18px' }}>
              <span className="form-label">Correction reason (required)</span>
              <textarea
                className="form-control"
                rows={3}
                minLength={10}
                maxLength={500}
                value={correctionNote}
                onChange={event => setCorrectionNote(event.target.value)}
                required
              />
            </label>
          )}
          {error && <div role="alert" style={{ marginTop: '14px', color: 'var(--danger)', background: 'var(--danger-bg)', borderRadius: '8px', padding: '10px 12px' }}>{error}</div>}
          <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Check size={15} /> {isSaving ? 'Saving…' : isCorrection ? 'Save revised payslip' : 'Save draft'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
