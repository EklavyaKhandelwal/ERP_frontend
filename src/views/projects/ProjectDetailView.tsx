import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, ListTodo, Plus } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { ProjectTask, ProjectTaskStatus } from '../../types/erp';
import { SectionSkeleton } from '../../components/feedback/LoadingSkeleton';
import { formatINR } from '../../lib/formatCurrency';

const taskStatuses: ProjectTaskStatus[] = ['To Do', 'In Progress', 'Blocked', 'Done'];

function formatDate(value: string | null): string {
  if (!value) return 'No due date';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'No due date'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isPastDue(value: string | null, status: ProjectTaskStatus): boolean {
  if (!value || status === 'Done') return false;
  return value.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

interface TaskCardProps {
  task: ProjectTask;
  members: { id: string; name: string }[];
  isAdmin: boolean;
  onSave: (taskId: string, updates: {
    status: ProjectTaskStatus;
    updateNote: string;
    assignedEmployeeId?: string;
    dueDate?: string | null;
  }) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, members, isAdmin, onSave }) => {
  const [status, setStatus] = useState<ProjectTaskStatus>(task.status);
  const [updateNote, setUpdateNote] = useState(task.updateNote);
  const [assigneeId, setAssigneeId] = useState(task.assignedEmployeeId);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave(task.id, {
        status,
        updateNote,
        ...(isAdmin ? { assignedEmployeeId: assigneeId, dueDate: dueDate || null } : {}),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the task update.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={event => void save(event)} style={{
      border: '1px solid var(--border-light)',
      borderRadius: '12px',
      padding: '16px',
      background: '#FFFFFF',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>{task.title}</h4>
          {task.description && (
            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
              {task.description}
            </p>
          )}
        </div>
        <span className={`badge ${status === 'Done' ? 'badge-success' : status === 'Blocked' ? 'badge-danger' : status === 'In Progress' ? 'badge-primary' : 'badge-neutral'}`}>
          {status}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
        <span>Assigned to: <strong style={{ color: 'var(--text-main)' }}>{task.assignedEmployeeName}</strong></span>
        <span style={{ color: isPastDue(task.dueDate, status) ? 'var(--danger)' : undefined }}>
          Due: {formatDate(task.dueDate)}
          {isPastDue(task.dueDate, status) ? ' · overdue' : ''}
        </span>
      </div>

      {task.updateNote && (
        <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: status === 'Blocked' ? 'var(--danger-bg)' : 'var(--bg-canvas)' }}>
          <strong style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>LATEST UPDATE</strong>
          <p style={{ margin: '4px 0 0', color: 'var(--text-main)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{task.updateNote}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'minmax(130px, 1fr) minmax(160px, 1fr)' : 'minmax(130px, 1fr)', gap: '12px', marginTop: '14px' }}>
        <label className="form-group" style={{ margin: 0 }}>
          <span className="form-label">Status</span>
          <select className="form-control" value={status} onChange={event => setStatus(event.target.value as ProjectTaskStatus)}>
            {taskStatuses.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        {isAdmin && (
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Assign to</span>
            <select className="form-control" value={assigneeId} required onChange={event => setAssigneeId(event.target.value)}>
              {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {isAdmin && (
        <label className="form-group" style={{ display: 'block', margin: '12px 0 0' }}>
          <span className="form-label">Due date</span>
          <input type="date" className="form-control" value={dueDate} onChange={event => setDueDate(event.target.value)} />
        </label>
      )}

      <label className="form-group" style={{ display: 'block', margin: '12px 0 0' }}>
        <span className="form-label">{isAdmin ? 'Task update / note' : status === 'Blocked' ? 'What is blocking this task?' : 'Progress update'}</span>
        <textarea
          className="form-control"
          rows={2}
          maxLength={2000}
          required={status === 'Blocked'}
          value={updateNote}
          onChange={event => setUpdateNote(event.target.value)}
          placeholder={status === 'Blocked' ? 'Explain what is blocking progress...' : 'Share a brief update (optional)'}
        />
      </label>

      {error && <div role="alert" style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '10px' }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : isAdmin ? 'Save Task' : 'Update Task'}
        </button>
      </div>
    </form>
  );
};

export const ProjectDetailView: React.FC = () => {
  const {
    selectedProjectId,
    projects,
    projectsLoading,
    projectsError,
    role,
    setCurrentView,
    addProjectTask,
    updateProjectTask,
  } = useERP();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const project = projects.find(p => p.id === selectedProjectId);

  if (!project) {
    return (
      <div style={{ padding: '32px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('projects')}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        {projectsError && <div role="alert" style={{ padding: '12px 16px', marginTop: '16px', color: '#CF202F', backgroundColor: '#FEECEE' }}>{projectsError}</div>}
        {projectsLoading
          ? <div style={{ marginTop: '24px' }}><SectionSkeleton rows={6} /></div>
          : <div className="card" style={{ padding: '40px', marginTop: '24px', textAlign: 'center' }}>This project is unavailable or has not been assigned to you.</div>}
      </div>
    );
  }

  const isAdmin = role === 'admin';
  const progress = project.totalTasks ? Math.round((project.tasksCompleted / project.totalTasks) * 100) : 0;
  const submitTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setIsCreatingTask(true);
    try {
      await addProjectTask(project.id, {
        title,
        description,
        assignedEmployeeId,
        dueDate: dueDate || null,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'Unable to create the task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const saveTask = async (taskId: string, updates: {
    status: ProjectTaskStatus;
    updateNote: string;
    assignedEmployeeId?: string;
    dueDate?: string | null;
  }) => updateProjectTask(project.id, taskId, updates);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentView('projects')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>
      </div>
      {(projectsError || createError) && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', color: '#CF202F', backgroundColor: '#FEECEE' }}>
          {projectsError || createError}
        </div>
      )}

      <section className="card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-neutral">{project.code}</span>
              <span className="badge badge-primary">{project.status}</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px' }}>{project.name}</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Client: <strong>{project.client}</strong> · Lead: <strong>{project.leadName}</strong>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '12px', lineHeight: '1.5' }}>
              {project.description || 'No project description provided.'}
            </p>
          </div>
          <div style={{ padding: '18px', background: 'var(--bg-canvas)', borderRadius: '12px', border: '1px solid var(--border-light)', minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Task progress</span>
              <strong style={{ color: 'var(--primary)' }}>{progress}%</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#E2E5EA', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>Done: {project.tasksCompleted} / {project.totalTasks}</span>
              <span>Due: {formatDate(project.deadline)}</span>
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px' }}>
                  <ListTodo size={18} /> Project Tasks
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {project.tasksCompleted} of {project.totalTasks} tasks completed · progress is calculated from task status
                </p>
              </div>
              {isAdmin && <span className="badge badge-neutral">{project.tasks.length} tasks</span>}
            </div>

            {isAdmin && (
              <form onSubmit={event => void submitTask(event)} style={{ padding: '16px', marginBottom: '16px', borderRadius: '10px', background: 'var(--bg-canvas)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Add and assign a task</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label className="form-group" style={{ margin: 0 }}>
                    <span className="form-label">Task title *</span>
                    <input className="form-control" required maxLength={180} value={title} onChange={event => setTitle(event.target.value)} />
                  </label>
                  <label className="form-group" style={{ margin: 0 }}>
                    <span className="form-label">Assign to *</span>
                    <select className="form-control" required value={assignedEmployeeId} onChange={event => setAssignedEmployeeId(event.target.value)}>
                      <option value="">Select a team member</option>
                      {project.team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                  </label>
                  <label className="form-group" style={{ margin: 0 }}>
                    <span className="form-label">Due date</span>
                    <input className="form-control" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
                  </label>
                  <label className="form-group" style={{ margin: 0 }}>
                    <span className="form-label">Description</span>
                    <input className="form-control" maxLength={3000} value={description} onChange={event => setDescription(event.target.value)} />
                  </label>
                </div>
                {project.team.length === 0 && <p style={{ color: 'var(--danger)', fontSize: '12px', margin: '10px 0 0' }}>Add project team members before creating tasks.</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isCreatingTask || project.team.length === 0}>
                    <Plus size={14} /> {isCreatingTask ? 'Creating…' : 'Create Task'}
                  </button>
                </div>
              </form>
            )}

            {project.tasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 12px' }}>
                <ListTodo size={26} style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>{isAdmin ? 'No tasks yet. Create a task and assign it to a project team member.' : 'No tasks have been assigned to this project yet.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.tasks.map(task => (
                  <TaskCard
                    key={`${task.id}-${task.updatedAt}`}
                    task={task}
                    members={project.team.map(member => ({ id: member.id, name: member.name }))}
                    isAdmin={isAdmin}
                    onSave={saveTask}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isAdmin && (
            <section className="card" style={{ padding: '22px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Project Budget</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Approved Budget</span><strong style={{ display: 'block', marginTop: '3px' }}>{formatINR(project.budget)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Spent to Date</span><strong style={{ display: 'block', marginTop: '3px', color: 'var(--danger)' }}>{formatINR(project.spent)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Remaining Budget</span><strong style={{ display: 'block', marginTop: '3px', color: 'var(--success)' }}>{formatINR(project.budget - project.spent)}</strong></div>
              </div>
            </section>
          )}

          <section className="card" style={{ padding: '22px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Project Team ({project.team.length})</h3>
            {project.team.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No team members assigned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.team.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={member.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{member.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card" style={{ padding: '22px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Key Dates</h3>
            <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <CalendarDays size={15} /> Started: {formatDate(project.startDate)}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Clock3 size={15} /> Project deadline: {formatDate(project.deadline)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
