import React, { useState } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LeaveType } from '../../types/erp';

function countWeekdays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || endDate < startDate) return 0;

  const date = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  let total = 0;
  while (date <= end) {
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) total += 1;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return total;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApplyLeaveModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { applyLeave, leaveBalance, setFigmaOverlayAsset } = useERP();

  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const days = countWeekdays(startDate, endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await applyLeave({ leaveType, startDate, endDate, reason });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Apply for Leave
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Submit a formal time-off request to your reporting manager.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label">Leave Category *</label>
            <select 
              className="form-control"
              value={leaveType}
              onChange={e => setLeaveType(e.target.value as LeaveType)}
            >
              <option value="Annual Leave">Annual Leave ({leaveBalance?.annual ?? 0} days available)</option>
              <option value="Sick Leave">Sick Leave ({leaveBalance?.sick ?? 0} days available)</option>
              <option value="Casual Leave">Casual Leave ({leaveBalance?.casual ?? 0} days available)</option>
              <option value="Maternity/Paternity">Maternity/Paternity</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input 
                type="date"
                required
                className="form-control"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input 
                type="date"
                required
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total Business Days (Monday–Friday)</label>
            <div className="form-control" aria-live="polite">{days}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Justification *</label>
            <textarea 
              rows={3}
              required
              placeholder="Provide context for coverage and handoff..."
              className="form-control"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {error && (
            <div role="alert" style={{ padding: '10px 12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={() => setFigmaOverlayAsset('/design-assets/Leaves/Leaves — Apply Leave.svg')}
              style={{ background: 'none', border: 'none', color: '#0052FF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Compare Figma Spec ↗
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || days < 1} className="btn btn-primary">
                <CalendarIcon size={16} />
                <span>{isSubmitting ? 'Submitting…' : 'Submit Request'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
