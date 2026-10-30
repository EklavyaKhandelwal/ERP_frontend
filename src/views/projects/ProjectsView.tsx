import React, { useState } from 'react';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AddProjectModal } from '../../components/modals/AddProjectModal';
import { CardGridSkeleton } from '../../components/feedback/LoadingSkeleton';

export const ProjectsView: React.FC = () => {
  const { 
    projects, 
    projectsLoading,
    projectsError,
    role,
    setCurrentView,
    setSelectedProjectId,
  } = useERP();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hoveredArrowProjectId, setHoveredArrowProjectId] = useState<string | null>(null);

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
              {role === 'admin' ? 'Project Portfolio' : 'My Projects'}
            </h2>
            <span className="badge badge-neutral">{projects.length} {role === 'admin' ? 'Projects' : 'Assigned'}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {role === 'admin'
              ? 'Manage project teams, assign tasks, and track delivery and budgets.'
              : `View your project teams, assigned tasks, and delivery progress.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['All', 'Active', 'In Progress', 'On Hold', 'Completed'].map(status => (
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
            <CardGridSkeleton count={6} minHeight={250} />
          ) : filteredProjects.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No projects are assigned or match this search.
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {filteredProjects.map(project => (
              <div 
                key={project.id}
                className={`card project-card${hoveredArrowProjectId === project.id ? ' project-card-arrow-hover' : ''}`}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <span><strong>{project.tasksCompleted}</strong> of <strong>{project.totalTasks}</strong> tasks done</span>
                    <span>·</span>
                    <span>{project.tasks.filter(task => task.status === 'Blocked').length} blocked</span>
                  </div>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Task progress</span>
                      <strong style={{ color: '#0052FF' }}>{project.totalTasks ? project.progress : '—'}{project.totalTasks ? '%' : ''}</strong>
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
                      <span
                        className={`project-card-arrow${hoveredArrowProjectId === project.id ? ' project-card-arrow-active' : ''}`}
                        onMouseEnter={() => setHoveredArrowProjectId(project.id)}
                        onMouseLeave={() => setHoveredArrowProjectId(null)}
                      >
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      )}

      {/* Add Modal */}
      <AddProjectModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
