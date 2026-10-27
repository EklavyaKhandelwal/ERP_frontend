import React, { useState } from 'react';
import { Plus, Sparkles, ChevronRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LeaveRequest } from '../../types/erp';
import { ApplyLeaveModal } from '../../components/modals/ApplyLeaveModal';
import { LeaveApprovalModal } from '../../components/modals/LeaveApprovalModal';

export const LeavesView: React.FC = () => {
  const { 
    leaves, 
    leavesLoading,
    leavesError,
    leaveBalance,
    role, 
    setFigmaOverlayAsset 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedReviewLeave, setSelectedReviewLeave] = useState<LeaveRequest | null>(null);

  // If in Employee mode, can choose to view only own leaves or all team leaves
  const displayedLeaves = leaves.filter(l => {
    if (activeTab === 'All') return true;
    return l.status === activeTab;
  });

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Approved':
        return <span className="badge badge-success"><span className="badge-dot" />Approved</span>;
      case 'Pending':
        return <span className="badge badge-warning"><span className="badge-dot" />Pending Review</span>;
      case 'Rejected':
        return <span className="badge badge-danger"><span className="badge-dot" />Rejected</span>;
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              {role === 'admin' ? 'Time-Off Administration & Approvals' : 'My Leave Allowances & History'}
            </h2>
            <span className="badge badge-neutral">{leaves.length} Total Requests</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {role === 'admin' 
              ? 'Review, approve, or reject employee annual, medical, and personal leave applications.' 
              : 'Track accrued time-off balances and submit vacation requests.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setFigmaOverlayAsset(
              role === 'admin' 
                ? '/design-assets/Leaves/Leaves — Admin Dashboard.svg' 
                : '/design-assets/Leaves/Employee — Leave Balance.svg'
            )}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#0052FF" />
            <span>Compare Figma Spec</span>
          </button>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Quota Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>ANNUAL VACATION</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0052FF', marginTop: '4px' }}>
            {leaveBalance ? `${leaveBalance.annual} / ${leaveBalance.annualTotal}` : '— / —'} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Current balance</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>SICK / MEDICAL</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#05B169', marginTop: '4px' }}>
            {leaveBalance ? `${leaveBalance.sick} / ${leaveBalance.sickTotal}` : '— / —'} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Current balance</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>CASUAL / PERSONAL</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#F4B000', marginTop: '4px' }}>
            {leaveBalance ? `${leaveBalance.casual} / ${leaveBalance.casualTotal}` : '— / —'} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Current balance</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>PENDING DECISIONS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>
            {leaves.filter(l => l.status === 'Pending').length} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>awaiting</span>
          </div>
          <div style={{ fontSize: '12px', color: '#B45309', marginTop: '4px' }}>Awaiting administrator review</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} Requests ({leaves.filter(l => tab === 'All' ? true : l.status === tab).length})
          </button>
        ))}
      </div>

      {/* Leave Requests Table */}
      {leavesError && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {leavesError}
        </div>
      )}
      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Category</th>
              <th>Dates & Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {leavesLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading leave requests…
                </td>
              </tr>
            ) : displayedLeaves.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No leave requests in this category.
                </td>
              </tr>
            ) : (
              displayedLeaves.map(leave => (
                <tr key={leave.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={leave.employeeAvatar} 
                        alt={leave.employeeName} 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{leave.employeeName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{leave.department}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#0052FF' }}>{leave.leaveType}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {leave.days} Business Days
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {leave.startDate} → {leave.endDate}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }} title={leave.reason}>
                      {leave.reason.length > 45 ? `${leave.reason.slice(0, 45)}...` : leave.reason}
                    </span>
                    {leave.reviewNote && (
                      <div style={{ fontSize: '11px', color: '#05B169', marginTop: '2px' }}>
                        Note: {leave.reviewNote}
                      </div>
                    )}
                  </td>
                  <td>
                    {getStatusBadge(leave.status)}
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{leave.appliedOn}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {role === 'admin' && leave.status === 'Pending' ? (
                      <button
                        onClick={() => setSelectedReviewLeave(leave)}
                        className="btn btn-sm btn-primary"
                        style={{ padding: '6px 12px' }}
                      >
                        <span>Review</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedReviewLeave(leave)}
                        className="btn btn-sm btn-ghost"
                      >
                        <span>View Details</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ApplyLeaveModal 
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />

      <LeaveApprovalModal 
        key={selectedReviewLeave?.id ?? 'closed'}
        leave={selectedReviewLeave}
        onClose={() => setSelectedReviewLeave(null)}
      />
    </div>
  );
};
