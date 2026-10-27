import React from 'react';
import { ArrowLeft, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const ProjectDetailView: React.FC = () => {
  const { 
    selectedProjectId, 
    projects, 
    projectsLoading,
    projectsError,
    role,
    setCurrentView, 
    updateProjectProgress, 
    setFigmaOverlayAsset 
  } = useERP();

  const project = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!project) {
    return (
      <div style={{ padding: '32px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('projects')}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        {projectsError && <div role="alert" style={{ padding: '12px 16px', marginTop: '16px', color: '#CF202F', backgroundColor: '#FEECEE' }}>{projectsError}</div>}
        <div className="card" style={{ padding: '40px', marginTop: '24px', textAlign: 'center' }}>
          {projectsLoading ? 'Loading project…' : 'This project is unavailable or has not been assigned to you.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentView('projects')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>

        <button
          onClick={() => setFigmaOverlayAsset('/design-assets/Projects/Projects — Detail View.svg')}
          className="btn btn-secondary btn-sm"
        >
          <Sparkles size={14} color="#0052FF" />
          <span>Compare Figma Detail View Spec</span>
        </button>
      </div>
      {projectsError && <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', color: '#CF202F', backgroundColor: '#FEECEE' }}>{projectsError}</div>}

      {/* Main Project Header Card */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-neutral">{project.code}</span>
              <span className="badge badge-primary">{project.status}</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.02em' }}>
              {project.name}
            </h2>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Client: <strong>{project.client}</strong> • Lead: <strong>{project.leadName}</strong>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '12px', lineHeight: '1.5' }}>
              {project.description}
            </p>
          </div>

          {/* Progress Box */}
          <div style={{
            padding: '20px',
            backgroundColor: '#F8F9FA',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            minWidth: '240px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Overall Velocity</span>
              <strong style={{ color: '#0052FF', fontSize: '15px' }}>{project.progress}%</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E5EA', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${project.progress}%`, height: '100%', backgroundColor: '#0052FF', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>Tasks: {project.tasksCompleted} / {project.totalTasks}</span>
              <span>Due: {project.deadline}</span>
            </div>
          </div>
        </div>

        {/* Progress Slider (Interactive update) */}
        {role === 'admin' && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Update Progress:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={project.progress}
              onChange={event => void updateProjectProgress(project.id, Number(event.target.value))}
              style={{ width: '220px', accentColor: '#0052FF' }}
            />
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0052FF' }}>{project.progress}%</span>
          </div>
        )}
      </div>

      {/* Grid: Financials & Team */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Financial & Milestone Health */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
            Budget Allocation & Milestones
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approved Budget</div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px' }}>${project.budget.toLocaleString()}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spent to Date</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#CF202F', marginTop: '2px' }}>${project.spent.toLocaleString()}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining Runway</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#05B169', marginTop: '2px' }}>${(project.budget - project.spent).toLocaleString()}</div>
            </div>
          </div>

          {/* Sprints / Milestones */}
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Key Sprint Milestones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#05B169" />
                <span style={{ fontWeight: '600', fontSize: '13px' }}>Milestone 1: Architectural Foundation & Design Tokens</span>
              </div>
              <span className="badge badge-success">Completed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#0052FF" />
                <span style={{ fontWeight: '600', fontSize: '13px' }}>Milestone 2: Multi-Role ERP Workflows (Leaves, Payroll, Timesheets)</span>
              </div>
              <span className="badge badge-primary">In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Milestone 3: End-to-End Auditing & Production Launch</span>
              </div>
              <span className="badge badge-neutral">Scheduled</span>
            </div>
          </div>
        </div>

        {/* Assigned Team */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
            Assigned Core Team ({project.team.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.team.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: '#F8F9FA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={member.avatar} alt={member.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{member.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.role}</div>
                  </div>
                </div>
                <span className="badge badge-neutral">Active Member</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
