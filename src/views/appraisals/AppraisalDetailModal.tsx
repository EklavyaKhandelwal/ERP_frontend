import React, { useState } from 'react';
import { Award, CheckCircle2, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { AppraisalReview } from '../../types/erp';

interface Props {
  appraisal: AppraisalReview | null;
  onClose: () => void;
}

const ratingAreas = [
  { key: 'deliveryRating', label: 'Delivery of work', description: 'Completes agreed work and meets priorities.' },
  { key: 'qualityRating', label: 'Quality', description: 'Produces accurate, thoughtful, dependable work.' },
  { key: 'ownershipRating', label: 'Ownership & reliability', description: 'Takes responsibility and follows through.' },
  { key: 'collaborationRating', label: 'Collaboration', description: 'Communicates and works constructively with others.' },
] as const;

type RatingKey = typeof ratingAreas[number]['key'];
type AdminRatings = Record<RatingKey, number | ''>;

const emptyRatings: AdminRatings = {
  deliveryRating: '',
  qualityRating: '',
  ownershipRating: '',
  collaborationRating: '',
};

const ratingLabels: Record<number, string> = {
  1: 'Needs improvement',
  2: 'Developing',
  3: 'Meets expectations',
  4: 'Exceeds expectations',
  5: 'Exceptional impact',
};

export const AppraisalDetailModal: React.FC<Props> = ({ appraisal, onClose }) => {
  const { role, submitSelfAssessment, completeAdminReview } = useERP();
  const [ratings, setRatings] = useState<AdminRatings>(emptyRatings);
  const [reflection, setReflection] = useState('');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextGoals, setNextGoals] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appraisal) return null;

  const isCompleted = appraisal.status === 'Completed';
  const canSubmitSelf = role === 'employee' && appraisal.status === 'Self Assessment';
  const canCompleteReview = role === 'admin' && appraisal.status === 'Admin Review';
  const hasStructuredRatings = ratingAreas.every(area => typeof appraisal[area.key] === 'number');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (canSubmitSelf) {
        await submitSelfAssessment(appraisal.id, {
          reflection,
          achievements,
          challenges,
          nextGoals,
        });
      } else if (canCompleteReview) {
        if (ratingAreas.some(area => ratings[area.key] === '')) {
          setError('Choose a rating for each performance area.');
          return;
        }
        await completeAdminReview(appraisal.id, {
          deliveryRating: Number(ratings.deliveryRating),
          qualityRating: Number(ratings.qualityRating),
          ownershipRating: Number(ratings.ownershipRating),
          collaborationRating: Number(ratings.collaborationRating),
          comments,
        });
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save this review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const section = (label: string, content: string | undefined) => (
    <div style={{ marginBottom: '18px' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{label}</span>
      <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginTop: '4px', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
        {content || 'Not provided.'}
      </p>
    </div>
  );

  const ratingSummary = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', marginBottom: '20px' }}>
      {ratingAreas.map(area => (
        <div key={area.key} style={{ padding: '12px', background: '#F8F9FA', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{area.label}</div>
          <strong style={{ display: 'block', marginTop: '4px', color: 'var(--text-main)' }}>
            {appraisal[area.key]}/5 · {ratingLabels[appraisal[area.key] ?? 0]}
          </strong>
        </div>
      ))}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
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
                {appraisal.status === 'Admin Review' ? 'Awaiting admin review' : appraisal.status}
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
                    Admin performance assessment
                  </div>
                  <div style={{ fontSize: '14px', color: '#14532D', marginTop: '2px' }}>
                    Completed on {appraisal.completedDate}
                  </div>
                </div>
                {hasStructuredRatings ? (
                  <div style={{ fontSize: '30px', fontWeight: '800', color: '#05B169' }}>
                    {appraisal.overallRating} <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>/ 5.0 average</span>
                  </div>
                ) : appraisal.legacyAdminRating !== undefined ? (
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#166534' }}>
                    Previous single rating: {appraisal.legacyAdminRating} / 5
                  </div>
                ) : null}
              </div>
              {hasStructuredRatings && ratingSummary()}
              {section('EMPLOYEE REFLECTION', appraisal.selfComments)}
              {section('KEY ACHIEVEMENTS', appraisal.goalsAchieved)}
              {section('CHALLENGES', appraisal.selfChallenges)}
              {section('GOALS FOR THE NEXT PERIOD', appraisal.nextGoals)}
              {section('ADMIN FEEDBACK', appraisal.adminComments)}
            </div>
          ) : canSubmitSelf ? (
            <form onSubmit={handleSubmit}>
              <p style={{ margin: '0 0 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Share your work and perspective. Your admin will provide the performance ratings after reviewing your self-review.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="self-achievements">Key achievements and work delivered *</label>
                <textarea
                  id="self-achievements"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="Describe the work, outcomes, and contributions you delivered during this period."
                  className="form-control"
                  value={achievements}
                  onChange={event => setAchievements(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="self-challenges">Challenges and lessons learned *</label>
                <textarea
                  id="self-challenges"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="What was challenging, and what did you learn?"
                  className="form-control"
                  value={challenges}
                  onChange={event => setChallenges(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="self-reflection">Reflection on your work *</label>
                <textarea
                  id="self-reflection"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="What went well, and what would you approach differently?"
                  className="form-control"
                  value={reflection}
                  onChange={event => setReflection(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="self-next-goals">Goals for the next period *</label>
                <textarea
                  id="self-next-goals"
                  rows={3}
                  required
                  maxLength={5000}
                  placeholder="What skills or outcomes would you like to focus on next?"
                  className="form-control"
                  value={nextGoals}
                  onChange={event => setNextGoals(event.target.value)}
                />
              </div>
              {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <Award size={16} />
                <span>{isSubmitting ? 'Submitting…' : 'Submit Self-Review'}</span>
              </button>
            </form>
          ) : canCompleteReview ? (
            <form onSubmit={handleSubmit}>
              <p style={{ margin: '0 0 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Rate each area using the same scale. A rating of 3 means the employee consistently meets expectations; 5 should be supported by clear evidence of exceptional impact.
              </p>
              {section('EMPLOYEE REFLECTION', appraisal.selfComments)}
              {section('KEY ACHIEVEMENTS', appraisal.goalsAchieved)}
              {section('CHALLENGES', appraisal.selfChallenges)}
              {section('GOALS FOR THE NEXT PERIOD', appraisal.nextGoals)}
              {ratingAreas.map(area => (
                <div className="form-group" key={area.key}>
                  <label className="form-label" htmlFor={area.key}>{area.label} *</label>
                  <p style={{ margin: '-4px 0 7px', color: 'var(--text-secondary)', fontSize: '12px' }}>{area.description}</p>
                  <select
                    id={area.key}
                    required
                    className="form-control"
                    value={ratings[area.key]}
                    onChange={event => setRatings(previous => ({
                      ...previous,
                      [area.key]: event.target.value ? Number(event.target.value) : '',
                    }))}
                  >
                    <option value="">Select a rating</option>
                    {Object.entries(ratingLabels).map(([score, label]) => (
                      <option key={score} value={score}>{score} — {label}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="form-group">
                <label className="form-label" htmlFor="admin-comments">Admin feedback and supporting examples *</label>
                <textarea
                  id="admin-comments"
                  rows={4}
                  required
                  maxLength={5000}
                  placeholder="Explain the ratings with specific examples and include constructive feedback."
                  className="form-control"
                  value={comments}
                  onChange={event => setComments(event.target.value)}
                />
              </div>
              {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '12px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Completing…' : 'Complete Admin Review'}</span>
              </button>
            </form>
          ) : (
            <div>
              {section('EMPLOYEE REFLECTION', appraisal.selfComments)}
              {section('KEY ACHIEVEMENTS', appraisal.goalsAchieved)}
              {section('CHALLENGES', appraisal.selfChallenges)}
              {section('GOALS FOR THE NEXT PERIOD', appraisal.nextGoals)}
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {appraisal.status === 'Self Assessment'
                  ? 'The employee has not submitted their self-review yet.'
                  : 'The self-review has been submitted and is awaiting an admin review.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
