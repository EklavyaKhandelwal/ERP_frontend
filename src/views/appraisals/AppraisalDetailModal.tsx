import React, { useState } from 'react';
import { X, Award, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { AppraisalReview } from '../../types/erp';

interface Props {
  appraisal: AppraisalReview | null;
  onClose: () => void;
}

export const AppraisalDetailModal: React.FC<Props> = ({ appraisal, onClose }) => {
  const { role, submitSelfAssessment, completeManagerReview, setFigmaOverlayAsset } = useERP();
  const [rating, setRating] = useState(
    role === 'admin' ? appraisal?.managerRating ?? 4.5 : appraisal?.selfRating ?? 4.5,
  );
  const [comments, setComments] = useState(
    role === 'admin' ? appraisal?.managerComments ?? '' : appraisal?.selfComments ?? '',
  );
  const [goals, setGoals] = useState(appraisal?.goalsAchieved ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appraisal) return null;

  const isCompleted = appraisal.status === 'Completed';
  const canSubmitSelf = role === 'employee' && appraisal.status === 'Self Assessment';
  const canCompleteReview = role === 'admin' && appraisal.status === 'Manager Review';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (canSubmitSelf) {
        await submitSelfAssessment(appraisal.id, { rating, comments, goals });
      } else if (canCompleteReview) {
        await completeManagerReview(appraisal.id, { rating, comments });
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save this review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const section = (label: string, content: string | undefined) => (
    <div style={{ marginBottom: '20px' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{label}</span>
      <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginTop: '4px', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
        {content || 'Not provided.'}
      </p>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8F9FA',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary">{appraisal.cycle}</span>
              <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
                {appraisal.status}
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginTop: '6px' }}>
              Performance Review: {appraisal.employeeName}
            </h3>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {isCompleted ? (
            <div>
              <div style={{
                padding: '20px',
                backgroundColor: '#E3F6EC',
                borderRadius: '12px',
                border: '1px solid #A3E6C5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                    Final Performance Assessment
                  </div>
                  <div style={{ fontSize: '14px', color: '#14532D', marginTop: '2px' }}>
                    Completed on {appraisal.completedDate}
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#05B169' }}>
                  ★ {appraisal.overallRating} <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>/ 5.0</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <span>Self rating: <strong>{appraisal.selfRating} / 5</strong></span>
                <span>Manager rating: <strong>{appraisal.managerRating} / 5</strong></span>
              </div>
              {section('EMPLOYEE SELF REFLECTION', appraisal.selfComments)}
              {section('CORE ACHIEVEMENTS', appraisal.goalsAchieved)}
              {section('MANAGER FEEDBACK', appraisal.managerComments)}
            </div>
          ) : canSubmitSelf ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="self-rating">Self rating (1.0 to 5.0) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    id="self-rating"
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={event => setRating(Number(event.target.value))}
                    style={{ flex: 1, accentColor: '#0052FF' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0052FF', minWidth: '40px' }}>★ {rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="self-goals">Core achievements & milestones delivered *</label>
                <textarea
                  id="self-goals"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="List your delivered project work, mentorship, or operational improvements..."
                  className="form-control"
                  value={goals}
                  onChange={event => setGoals(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="self-comments">Self reflection & career objectives *</label>
                <textarea
                  id="self-comments"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="Where did you excel, and which skills would you like to develop?"
                  className="form-control"
                  value={comments}
                  onChange={event => setComments(event.target.value)}
                />
              </div>
              {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <Award size={16} />
                <span>{isSubmitting ? 'Submitting…' : 'Submit Self Assessment'}</span>
              </button>
            </form>
          ) : canCompleteReview ? (
            <form onSubmit={handleSubmit}>
              {section('EMPLOYEE SELF REFLECTION', appraisal.selfComments)}
              {section('CORE ACHIEVEMENTS', appraisal.goalsAchieved)}
              <div className="form-group">
                <label className="form-label" htmlFor="manager-rating">Manager rating (1.0 to 5.0) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    id="manager-rating"
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={event => setRating(Number(event.target.value))}
                    style={{ flex: 1, accentColor: '#0052FF' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0052FF', minWidth: '40px' }}>★ {rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="manager-comments">Manager assessment & growth feedback *</label>
                <textarea
                  id="manager-comments"
                  rows={4}
                  required
                  maxLength={5000}
                  placeholder="Summarize accomplishments, contributions, and development goals..."
                  className="form-control"
                  value={comments}
                  onChange={event => setComments(event.target.value)}
                />
              </div>
              {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Completing…' : 'Complete Performance Review'}</span>
              </button>
            </form>
          ) : (
            <div>
              {section('EMPLOYEE SELF REFLECTION', appraisal.selfComments)}
              {section('CORE ACHIEVEMENTS', appraisal.goalsAchieved)}
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {appraisal.status === 'Self Assessment'
                  ? 'The employee has not submitted their self-assessment yet.'
                  : 'This self-assessment has been submitted and is awaiting manager review.'}
              </p>
            </div>
          )}

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setFigmaOverlayAsset(
                isCompleted
                  ? '/design-assets/Appraisals/Appraisals — Completed Review.svg'
                  : role === 'admin'
                    ? '/design-assets/Appraisals/Appraisals — Review Detail.svg'
                    : '/design-assets/Appraisals/Employee — Self Assessment.svg'
              )}
              style={{ background: 'none', border: 'none', color: '#0052FF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Compare Figma Spec ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
