import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  ChevronRight, 
  FolderOpen
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AddProjectModal } from '../../components/modals/AddProjectModal';

export const ProjectsView: React.FC = () => {
  const { 
    projects, 
    projectsLoading,
    projectsError,
    role,
    setCurrentView, 
    setSelectedProjectId, 
    setFigmaOverlayAsset 
  } = useERP();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewState, setViewState] = useState<'default' | 'empty'>('default');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Enterprise Project Portfolio
            </h2>
            <span className="badge badge-neutral">{projects.length} Active Initiatives</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Track project deliverables, milestone velocity, budgets, and engineering assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* State Switcher */}
          <div style={{ display: 'flex', gap: '4px', background: '#F1F3F5', padding: '3px', borderRadius: '6px' }}>
            <button
              onClick={() => setViewState('default')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: viewState === 'default' ? '#0052FF' : 'transparent',
                color: viewState === 'default' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Default List
            </button>
            <button
              onClick={() => setViewState('empty')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: viewState === 'empty' ? '#0052FF' : 'transparent',
                color: viewState === 'empty' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Empty State Spec
            </button>
          </div>

          <button
            onClick={() => setFigmaOverlayAsset(
              viewState === 'default' 
                ? '/design-assets/Projects/Projects — List.svg' 
                : '/design-assets/Projects/Projects — Empty State.svg'
            )}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#0052FF" />
            <span>Compare Figma Spec</span>
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State View matching Projects — Empty State.svg */}
      {viewState === 'empty' ? (
        <div className="card" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#8A8F98' }}>
            <FolderOpen size={32} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A0B0D', margin: 0 }}>No Projects Created Yet</h3>
          <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '8px', lineHeight: '1.5' }}>
            Your enterprise initiative pipeline is currently clear. Initialize your first project container to assign team members and track billable sprints.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create New Project</span>
            </button>
            <button onClick={() => setViewState('default')} className="btn btn-secondary">
              Restore Portfolio Data
            </button>
          </div>
        </div>
      ) : (
        <>
          {projectsError && (
            <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
              {projectsError}
            </div>
          )}
          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Search project name or client..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '38px', height: '38px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'Active', 'In Progress', 'Completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: filterStatus === status ? 'var(--primary)' : 'var(--border-default)',
                      backgroundColor: filterStatus === status ? 'var(--primary-light)' : '#FFFFFF',
                      color: filterStatus === status ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '12.5px',
                      fontWeight: filterStatus === status ? '600' : '500',
                      cursor: 'pointer'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          {projectsLoading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading projects…</div>
          ) : filteredProjects.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No projects are assigned or match this search.
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {filteredProjects.map(project => (
              <div 
                key={project.id}
                className="card"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setCurrentView('project-detail');
                }}
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge badge-neutral">{project.code}</span>
                    <span className="badge badge-primary">{project.status}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {project.name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Client: <strong>{project.client}</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                    {project.description.length > 90 ? `${project.description.slice(0, 90)}...` : project.description}
                  </p>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <strong style={{ color: '#0052FF' }}>{project.progress}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#EEF0F3', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${project.progress}%`, height: '100%', backgroundColor: '#0052FF', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Team Avatars & Due Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {project.team.map((m, idx) => (
                        <img 
                          key={m.id}
                          src={m.avatar} 
                          alt={m.name}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #FFFFFF',
                            marginLeft: idx > 0 ? '-8px' : 0
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>Due: {project.deadline}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <AddProjectModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
