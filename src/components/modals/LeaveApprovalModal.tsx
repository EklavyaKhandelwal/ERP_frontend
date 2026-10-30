import React, { useState } from 'react';
import { X, Check, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LeaveRequest } from '../../types/erp';

interface Props {
  leave: LeaveRequest | null;
  onClose: () => void;
  onReviewed?: () => void;
}

export const LeaveApprovalModal: React.FC<Props> = ({ leave, onClose, onReviewed }) => {
  const { reviewLeave, role } = useERP();
  const [note, setNote] = useState('');
  const [resultState, setResultState] = useState<'approved' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!leave) return null;

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    setError(null);
    setIsSubmitting(true);
    try {
      await reviewLeave(leave.id, status, note);
      setResultState(status === 'Approved' ? 'approved' : 'rejected');
      onReviewed?.();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {role === 'admin' && leave.status === 'Pending' ? 'Review Leave Application' : 'Leave Request Details'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {role === 'admin' && leave.status === 'Pending' ? 'Review and record a decision' : `Request status: ${leave.status}`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Success / Rejection confirmation */}
        {resultState ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: resultState === 'approved' ? '#E3F6EC' : '#FEECEE',
              color: resultState === 'approved' ? '#05B169' : '#CF202F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              {resultState === 'approved' ? <CheckCircle2 size={32} /> : <X size={32} />}
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0A0B0D' }}>
              {resultState === 'approved' ? 'Leave Application Approved' : 'Leave Application Rejected'}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              The request status has been saved. Email notifications and external calendar sync are not enabled yet.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              <button onClick={onClose} className="btn btn-primary btn-sm">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            {/* Applicant Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#F8F9FA',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              marginBottom: '20px'
            }}>
              <img 
                src={leave.employeeAvatar} 
                alt={leave.employeeName} 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                  {leave.employeeName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {leave.department} • Applied on {leave.appliedOn}
                </div>
              </div>
            </div>

            {/* Leave Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ padding: '12px', backgroundColor: '#FAFCFF', borderRadius: '8px', border: '1px solid #E5EDFF' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Leave Type</span>
                <div style={{ fontWeight: '700', color: '#0052FF', marginTop: '2px' }}>{leave.leaveType}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FAFCFF', borderRadius: '8px', border: '1px solid #E5EDFF' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Duration</span>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                  {leave.days} Business Days ({leave.startDate} to {leave.endDate})
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>Employee Justification</span>
              <div style={{ marginTop: '4px', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px', fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                "{leave.reason}"
              </div>
            </div>

            {role === 'admin' && leave.status === 'Pending' ? (
              <div className="form-group">
                <label className="form-label">Reviewer Notes / Feedback (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add comments visible to the applicant..."
                  className="form-control"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            ) : leave.reviewNote ? (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>Reviewer Notes</span>
                <div style={{ marginTop: '4px', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px', fontSize: '13px', color: 'var(--text-main)' }}>
                  {leave.reviewNote}
                </div>
              </div>
            ) : null}

            {error && (
              <div role="alert" style={{ padding: '10px 12px', marginTop: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-light)'
            }}>
              {role === 'admin' && leave.status === 'Pending' ? (
                <div style={{ display: 'flex', gap: '10px', marginRight: 'auto' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('Rejected')}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#FEECEE', color: '#CF202F', border: '1px solid #F7BAC0' }}
                >
                  <X size={14} />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('Approved')}
                  className="btn btn-sm btn-primary"
                  style={{ backgroundColor: '#05B169', borderColor: '#05B169' }}
                >
                  <Check size={14} />
                  <span>Approve Leave</span>
                </button>
              </div>
              ) : null}
              <button type="button" onClick={onClose} className="btn btn-secondary">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
