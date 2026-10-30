import React, { useState } from 'react';
import { Award, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { AppraisalReview } from '../../types/erp';
import { AppraisalDetailModal } from './AppraisalDetailModal';
import { TableSkeletonRows } from '../../components/feedback/LoadingSkeleton';
import { CreateAppraisalCycleModal } from '../../components/modals/CreateAppraisalCycleModal';

export const AppraisalsView: React.FC = () => {
  const {
    appraisals,
    appraisalsLoading,
    appraisalsError,
    role,
  } = useERP();
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalReview | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const completed = appraisals.filter(review => review.status === 'Completed');
  const completedWithRatings = completed.filter(review => review.overallRating !== undefined);
  const awaitingSelfReview = appraisals.filter(review => review.status === 'Self Assessment').length;
  const awaitingAdminReview = appraisals.filter(review => review.status === 'Admin Review').length;
  const latestCompletedReview = completed
    .filter(review => review.overallRating !== undefined || review.legacyAdminRating !== undefined)
    .sort((left, right) => (right.completedDate ?? '').localeCompare(left.completedDate ?? ''))[0];
  const averageRating = completedWithRatings.length
    ? (completedWithRatings.reduce((sum, review) => sum + (review.overallRating ?? 0), 0) / completedWithRatings.length).toFixed(1)
    : '—';
  const summaryCards = role === 'admin'
    ? [
      { title: 'TOTAL REVIEWS', value: appraisals.length, description: 'Across all employees', color: '#0A0B0D' },
      { title: 'TO COMPLETE', value: awaitingSelfReview, description: 'Awaiting employee self-review', color: '#0052FF' },
      { title: 'AWAITING ADMIN REVIEW', value: awaitingAdminReview, description: 'Self-reviews submitted', color: '#B45309' },
      { title: 'COMPLETED REVIEWS', value: completed.length, description: 'Finalized appraisals', color: '#05B169' },
      { title: 'AVERAGE ADMIN RATING', value: averageRating, description: 'Across completed rated reviews', color: '#05B169' },
    ]
    : [
      { title: 'TOTAL REVIEWS', value: appraisals.length, description: 'In your appraisal history', color: '#0A0B0D' },
      { title: 'TO COMPLETE', value: awaitingSelfReview, description: 'Self-reviews waiting for you', color: '#0052FF' },
      { title: 'AWAITING ADMIN REVIEW', value: awaitingAdminReview, description: 'Submitted and awaiting review', color: '#B45309' },
      { title: 'COMPLETED REVIEWS', value: completed.length, description: 'Finalized appraisals', color: '#05B169' },
      {
        title: 'LATEST ADMIN RATING',
        value: latestCompletedReview?.overallRating ?? latestCompletedReview?.legacyAdminRating ?? '—',
        description: latestCompletedReview?.legacyAdminRating !== undefined
          ? 'Previous single-rating format'
          : latestCompletedReview?.overallRating !== undefined
            ? `${latestCompletedReview.cycle} · out of 5`
            : 'No completed rating yet',
        color: '#05B169',
      },
    ];

  const getStatusBadge = (status: AppraisalReview['status']) => {
    switch (status) {
      case 'Completed':
        return <span className="badge badge-success"><span className="badge-dot" />Completed</span>;
      case 'Admin Review':
        return <span className="badge badge-warning"><span className="badge-dot" />Admin Review</span>;
      case 'Self Assessment':
        return <span className="badge badge-primary"><span className="badge-dot" />Self-Review</span>;
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
              ? 'Start review cycles, review employee self-reviews, and provide consistent ratings and feedback.'
              : 'Share your work and reflections, then view your admin-reviewed appraisal history.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {summaryCards.map(card => (
          <div className="card interactive-lift-card" style={{ padding: '20px' }} key={card.title}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{card.title}</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: card.color, marginTop: '4px' }}>
              {appraisalsLoading ? '—' : card.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.description}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Review Cycle</th>
              <th>Admin Rating</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {appraisalsLoading ? (
              <TableSkeletonRows columns={6} rows={5} />
            ) : appraisals.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No appraisal reviews found{role === 'admin' ? '. Start a review cycle to begin.' : ' for your account.'}
                </td>
              </tr>
            ) : appraisals.map(review => (
              <tr
                key={review.id}
                className="arrow-lift-row"
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
                  {review.overallRating ? (
                    <strong style={{ fontSize: '14.5px', color: '#05B169' }}>★ {review.overallRating} / 5.0</strong>
                  ) : review.legacyAdminRating !== undefined ? (
                    <span title="Single rating from a previous appraisal format" style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {review.legacyAdminRating} / 5 · previous
                    </span>
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
                    {review.status === 'Admin Review' ? <TrendingUp size={14} /> : <Clock size={14} />}
                    <ChevronRight className="arrow-lift-trigger" size={14} />
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
