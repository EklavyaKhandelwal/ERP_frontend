import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createAppraisalCycle(cycle);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to start this review cycle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Start appraisal cycle</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Creates one self-assessment for each active employee.
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
          {error && (
            <div role="alert" style={{ padding: '10px 12px', marginTop: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || cycle.trim().length < 2} className="btn btn-primary">
              <Send size={15} /> {isSubmitting ? 'Starting…' : 'Start cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
