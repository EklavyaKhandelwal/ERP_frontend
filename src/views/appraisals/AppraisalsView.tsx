import React, { useState } from 'react';
import { Award, CheckCircle2, Clock, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { AppraisalReview } from '../../types/erp';
import { AppraisalDetailModal } from './AppraisalDetailModal';
import { CreateAppraisalCycleModal } from '../../components/modals/CreateAppraisalCycleModal';

export const AppraisalsView: React.FC = () => {
  const {
    appraisals,
    appraisalsLoading,
    appraisalsError,
    role,
    setFigmaOverlayAsset,
  } = useERP();
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalReview | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const completed = appraisals.filter(review => review.status === 'Completed');
  const awaitingSelfAssessment = appraisals.filter(review => review.status === 'Self Assessment').length;
  const awaitingManagerReview = appraisals.filter(review => review.status === 'Manager Review').length;
  const averageRating = completed.length
    ? (completed.reduce((sum, review) => sum + (review.overallRating ?? 0), 0) / completed.length).toFixed(1)
    : '—';

  const getStatusBadge = (status: AppraisalReview['status']) => {
    switch (status) {
      case 'Completed':
        return <span className="badge badge-success"><span className="badge-dot" />Completed</span>;
      case 'Manager Review':
        return <span className="badge badge-warning"><span className="badge-dot" />Manager Review</span>;
      case 'Self Assessment':
        return <span className="badge badge-primary"><span className="badge-dot" />Self Assessment</span>;
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Performance & Appraisals
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {role === 'admin'
              ? 'Start review cycles, review employee reflections, and record manager feedback.'
              : 'Complete self-assessments and view your performance review history.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setFigmaOverlayAsset('/design-assets/Appraisals/Appraisals — Overview.svg')}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#0052FF" />
            <span>Compare Figma Spec</span>
          </button>
          {role === 'admin' && (
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <Award size={16} />
              <span>Start Review Cycle</span>
            </button>
          )}
        </div>
      </div>

      {appraisalsError && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {appraisalsError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL REVIEWS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0A0B0D', marginTop: '4px' }}>{appraisals.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Records in this account's view</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>SELF ASSESSMENTS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0052FF', marginTop: '4px' }}>{awaitingSelfAssessment}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting employee submission</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>MANAGER REVIEWS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>{awaitingManagerReview}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting manager completion</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>COMPLETED · AVG RATING</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#05B169', marginTop: '4px' }}>
            <CheckCircle2 size={20} style={{ verticalAlign: 'middle' }} /> {completed.length} · {averageRating}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Average of completed reviews</div>
        </div>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department & Role</th>
              <th>Review Cycle</th>
              <th>Self Rating</th>
              <th>Manager Rating</th>
              <th>Overall Score</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {appraisalsLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading performance reviews…</td></tr>
            ) : appraisals.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No appraisal reviews found{role === 'admin' ? '. Start a review cycle to begin.' : ' for your account.'}
                </td>
              </tr>
            ) : appraisals.map(review => (
              <tr
                key={review.id}
                onClick={() => setSelectedAppraisal(review)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={review.employeeAvatar}
                      alt={review.employeeName}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{review.employeeName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{review.designation}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{review.department}</span></td>
                <td><span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{review.cycle}</span></td>
                <td>
                  <span style={{ fontWeight: '600', color: review.selfRating ? '#0052FF' : 'var(--text-muted)' }}>
                    {review.selfRating ? `★ ${review.selfRating}` : 'Pending'}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: '600', color: review.managerRating ? '#05B169' : 'var(--text-muted)' }}>
                    {review.managerRating ? `★ ${review.managerRating}` : 'Pending'}
                  </span>
                </td>
                <td>
                  {review.overallRating ? (
                    <strong style={{ fontSize: '14.5px', color: '#05B169' }}>★ {review.overallRating} / 5.0</strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>In Progress</span>
                  )}
                </td>
                <td>{getStatusBadge(review.status)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      setSelectedAppraisal(review);
                    }}
                    className="btn btn-sm btn-ghost"
                  >
                    <span>{review.status === 'Completed' ? 'View Report' : 'Open Review'}</span>
                    {review.status === 'Manager Review' ? <TrendingUp size={14} /> : <Clock size={14} />}
                    <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AppraisalDetailModal key={selectedAppraisal?.id ?? 'closed'} appraisal={selectedAppraisal} onClose={() => setSelectedAppraisal(null)} />
      <CreateAppraisalCycleModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};
