import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, ListTodo, Plus, Search, UserPlus, X, Pencil } from 'lucide-react';
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
  members: { id: string; name: string; isFormerMember?: boolean }[];
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
  const [isEditing, setIsEditing] = useState(false);

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
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the task update.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article style={{
      border: '1px solid var(--border-light)',
      borderRadius: '13px',
      padding: '16px',
      background: '#FFFFFF',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>{task.title}</h4>
            <span className={`badge ${task.status === 'Done' ? 'badge-success' : task.status === 'Blocked' ? 'badge-danger' : task.status === 'In Progress' ? 'badge-primary' : 'badge-neutral'}`}>
              {task.status}
            </span>
          </div>
          {task.description && (
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '12.5px', whiteSpace: 'pre-wrap' }}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="project-task-meta">
        <span className="project-task-assignee">
          <img src={task.assignedEmployeeAvatar} alt="" />
          <span>Assigned to <strong>{task.assignedEmployeeName}</strong></span>
        </span>
        <span className={`project-task-due${isPastDue(task.dueDate, task.status) ? ' overdue' : ''}`}>
          <CalendarDays size={14} aria-hidden="true" />
          <span>{formatDate(task.dueDate)}{isPastDue(task.dueDate, task.status) ? ' · overdue' : ''}</span>
        </span>
      </div>

      {task.updateNote && (
        <div className={`project-task-update${task.status === 'Blocked' ? ' blocked' : ''}`}>
          <strong>LATEST UPDATE</strong>
          <p>{task.updateNote}</p>
        </div>
      )}

      <div className="project-task-card-actions">
        <button type="button" className="btn btn-ghost btn-sm" aria-expanded={isEditing} onClick={() => {
          setIsEditing(editing => !editing);
          setError(null);
        }}>
          {isEditing ? <X size={14} /> : <Pencil size={14} />}
          {isEditing ? 'Close' : isAdmin ? 'Edit task' : 'Update task'}
        </button>
      </div>

      {isEditing && (
        <form onSubmit={event => void save(event)} style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'minmax(130px, 1fr) minmax(160px, 1fr)' : 'minmax(130px, 1fr)', gap: '12px' }}>
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
                  {members.map(member => <option key={member.id} value={member.id}>
                    {member.name}{member.isFormerMember ? ' · former member' : ''}
                  </option>)}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={isSaving} onClick={() => {
              setStatus(task.status);
              setUpdateNote(task.updateNote);
              setAssigneeId(task.assignedEmployeeId);
              setDueDate(task.dueDate ?? '');
              setError(null);
              setIsEditing(false);
            }}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              {isSaving ? 'Saving…' : isAdmin ? 'Save Task' : 'Update Task'}
            </button>
          </div>
        </form>
      )}
    </article>
  );
};

export const ProjectDetailView: React.FC = () => {
  const {
    selectedProjectId,
    projects,
    projectsLoading,
    projectsError,
    role,
    employees,
    employeesLoading,
    setCurrentView,
    updateProjectMembers,
    addProjectTask,
    updateProjectTask,
  } = useERP();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<ProjectTaskStatus | ''>('');
  const [taskDueDateFrom, setTaskDueDateFrom] = useState('');
  const [taskDueDateTo, setTaskDueDateTo] = useState('');
  const [isManagingTeam, setIsManagingTeam] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const project = projects.find(p => p.id === selectedProjectId);

  if (!project) {
    return (
      <div style={{ padding: '32px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('projects')}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        {projectsError && <div role="alert" style={{ padding: '12px 16px', marginTop: '16px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>{projectsError}</div>}
        {projectsLoading
          ? <div style={{ marginTop: '24px' }}><SectionSkeleton rows={6} /></div>
          : <div className="card" style={{ padding: '40px', marginTop: '24px', textAlign: 'center' }}>This project is unavailable or has not been assigned to you.</div>}
      </div>
    );
  }

  const isAdmin = role === 'admin';
  const progress = project.totalTasks ? Math.round((project.tasksCompleted / project.totalTasks) * 100) : 0;
  const startManagingTeam = () => {
    setSelectedMemberIds([...new Set([
      ...project.team.map(member => member.id),
      ...(project.leadId ? [project.leadId] : []),
    ])]);
    setMemberSearch('');
    setTeamError(null);
    setIsManagingTeam(true);
  };
  const saveTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamError(null);
    setIsSavingTeam(true);
    try {
      await updateProjectMembers(project.id, selectedMemberIds);
      setIsManagingTeam(false);
    } catch (saveError) {
      setTeamError(saveError instanceof Error ? saveError.message : 'Unable to update the project team.');
    } finally {
      setIsSavingTeam(false);
    }
  };
  const filteredEmployees = employees.filter(employee => (
    `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.department}`
      .toLowerCase()
      .includes(memberSearch.toLowerCase())
  ));
  const teamChanged = project.team.length !== selectedMemberIds.length
    || project.team.some(member => !selectedMemberIds.includes(member.id));
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
      setAssignedEmployeeId('');
      setIsCreateTaskOpen(false);
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
  const taskAssigneesById = new Map<string, string>([
    ...project.team.map(member => [member.id, member.name] as const),
    ...project.tasks.map(task => [task.assignedEmployeeId, task.assignedEmployeeName] as const),
  ]);
  const taskAssignees = [...taskAssigneesById].map(([id, name]) => ({
    id,
    name,
    department: employees.find(employee => employee.id === id)?.department,
  }));
  const normalizedTaskSearch = taskSearch.trim().toLowerCase();
  const filteredTasks = project.tasks.filter(task => {
    if (taskAssigneeFilter && task.assignedEmployeeId !== taskAssigneeFilter) return false;
    if (taskStatusFilter && task.status !== taskStatusFilter) return false;
    if (taskDueDateFrom && (!task.dueDate || task.dueDate.slice(0, 10) < taskDueDateFrom)) return false;
    if (taskDueDateTo && (!task.dueDate || task.dueDate.slice(0, 10) > taskDueDateTo)) return false;
    if (normalizedTaskSearch && !`${task.title} ${task.description} ${task.assignedEmployeeName}`
      .toLowerCase().includes(normalizedTaskSearch)) return false;
    return true;
  });
  const hasTaskFilters = Boolean(taskSearch || taskAssigneeFilter || taskStatusFilter || taskDueDateFrom || taskDueDateTo);
  const clearTaskFilters = () => {
    setTaskSearch('');
    setTaskAssigneeFilter('');
    setTaskStatusFilter('');
    setTaskDueDateFrom('');
    setTaskDueDateTo('');
  };

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
      {projectsError && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          {projectsError}
        </div>
      )}

      <section className="card color-accent-card color-accent-blue" style={{ padding: '28px', marginBottom: '20px' }}>
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
          <section className="card color-accent-card color-accent-blue" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px' }}>
                  <ListTodo size={18} /> Project Tasks
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {project.tasksCompleted} of {project.totalTasks} tasks completed · progress is calculated from task status
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-neutral">{filteredTasks.length} of {project.tasks.length} tasks</span>
                {isAdmin && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => {
                    setCreateError(null);
                    setAssignedEmployeeId(project.team[0]?.id ?? '');
                    setIsCreateTaskOpen(true);
                  }}>
                    <Plus size={14} /> Add task
                  </button>
                )}
              </div>
            </div>

            {project.tasks.length > 0 && (
              <div className="project-task-filters">
                <label className="project-task-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    className="form-control"
                    aria-label="Search project tasks"
                    placeholder="Search task title, description, or employee"
                    value={taskSearch}
                    onChange={event => setTaskSearch(event.target.value)}
                  />
                </label>
                <div className="project-task-filter-controls">
                  <label className="project-task-filter">
                    <span className="form-label">Employee</span>
                    <select className="form-control project-task-employee-select" value={taskAssigneeFilter} onChange={event => setTaskAssigneeFilter(event.target.value)}>
                      <option value="">All employees</option>
                      {taskAssignees.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}{member.department ? ` · ${member.department}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="project-task-filter">
                    <span className="form-label">Status</span>
                    <select className="form-control" value={taskStatusFilter} onChange={event => setTaskStatusFilter(event.target.value as ProjectTaskStatus | '')}>
                      <option value="">All statuses</option>
                      {taskStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <div className="project-task-filter project-task-date-range">
                    <span className="form-label">Due date range</span>
                    <div className="project-task-date-inputs">
                      <input
                        className="form-control"
                        type="date"
                        aria-label="Due date from"
                        value={taskDueDateFrom}
                        onChange={event => setTaskDueDateFrom(event.target.value)}
                      />
                      <span aria-hidden="true">to</span>
                      <input
                        className="form-control"
                        type="date"
                        aria-label="Due date to"
                        min={taskDueDateFrom || undefined}
                        value={taskDueDateTo}
                        onChange={event => setTaskDueDateTo(event.target.value)}
                      />
                    </div>
                  </div>
                  {hasTaskFilters && (
                    <button type="button" className="btn btn-ghost btn-sm project-task-clear" onClick={clearTaskFilters}>
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {project.tasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 12px' }}>
                <ListTodo size={26} style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>{isAdmin ? 'No tasks yet. Create a task and assign it to a project team member.' : 'No tasks have been assigned to this project yet.'}</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 12px' }}>
                <ListTodo size={26} style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>No tasks match these filters.</p>
                {hasTaskFilters && <button type="button" className="btn btn-ghost btn-sm" onClick={clearTaskFilters}>Clear filters</button>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTasks.map(task => (
                  <TaskCard
                    key={`${task.id}-${task.updatedAt}`}
                    task={task}
                    members={[
                      ...project.team.map(member => ({ id: member.id, name: member.name })),
                      ...(!project.team.some(member => member.id === task.assignedEmployeeId)
                        ? [{ id: task.assignedEmployeeId, name: task.assignedEmployeeName, isFormerMember: true }]
                        : []),
                    ]}
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
            <section className="card color-accent-card color-accent-amber" style={{ padding: '22px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Project Budget</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Approved Budget</span><strong style={{ display: 'block', marginTop: '3px' }}>{formatINR(project.budget)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Spent to Date</span><strong style={{ display: 'block', marginTop: '3px', color: 'var(--danger)' }}>{formatINR(project.spent)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Remaining Budget</span><strong style={{ display: 'block', marginTop: '3px', color: 'var(--success)' }}>{formatINR(project.budget - project.spent)}</strong></div>
              </div>
            </section>
          )}

          <section className="card color-accent-card color-accent-purple" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Project Team ({project.team.length})</h3>
              {isAdmin && !isManagingTeam && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={startManagingTeam} disabled={employeesLoading}>
                  <UserPlus size={14} /> Manage Team
                </button>
              )}
            </div>
            {isManagingTeam && (
              <form onSubmit={event => void saveTeam(event)} style={{ marginBottom: '16px', padding: '14px', borderRadius: '10px', background: 'var(--bg-canvas)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '13px' }}>Add or remove employees</strong>
                  <button type="button" aria-label="Cancel team editing" onClick={() => setIsManagingTeam(false)} style={{ display: 'inline-flex', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={17} />
                  </button>
                </div>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="search"
                    aria-label="Search employees"
                    className="form-control"
                    placeholder="Search name, email, or department"
                    value={memberSearch}
                    onChange={event => setMemberSearch(event.target.value)}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
                {employeesLoading ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Loading employee profiles…</p>
                ) : employees.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No employee profiles are available to assign.</p>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', background: '#FFFFFF' }}>
                    {filteredEmployees.map(employee => {
                      const isSelected = selectedMemberIds.includes(employee.id);
                      const isLead = employee.id === project.leadId;
                      return (
                        <label key={employee.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', cursor: isLead ? 'default' : 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isLead}
                            onChange={event => setSelectedMemberIds(current => event.target.checked
                              ? [...current, employee.id]
                              : current.filter(id => id !== employee.id))}
                          />
                          <span style={{ flex: 1 }}>
                            <strong style={{ color: 'var(--text-main)' }}>{employee.firstName} {employee.lastName}</strong>
                            <span style={{ display: 'block', color: 'var(--text-muted)' }}>{employee.designation} · {employee.department}</span>
                          </span>
                          {isLead && <span className="badge badge-neutral">Project lead</span>}
                        </label>
                      );
                    })}
                    {filteredEmployees.length === 0 && (
                      <p style={{ padding: '10px', margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>No employees match your search.</p>
                    )}
                  </div>
                )}
                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Members with unfinished tasks can only be removed after those tasks are reassigned or completed.
                </p>
                {teamError && <p role="alert" style={{ margin: '8px 0 0', color: 'var(--danger)', fontSize: '12px' }}>{teamError}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsManagingTeam(false)} disabled={isSavingTeam}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isSavingTeam || employeesLoading || !teamChanged}>
                    {isSavingTeam ? 'Saving…' : 'Save Team'}
                  </button>
                </div>
              </form>
            )}
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

          <section className="card color-accent-card color-accent-green" style={{ padding: '22px' }}>
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
      {isCreateTaskOpen && isAdmin && (
        <div className="modal-overlay" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !isCreatingTask) setIsCreateTaskOpen(false);
        }}>
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="create-project-task-title" style={{ maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2 id="create-project-task-title" style={{ margin: 0, fontSize: '18px' }}>Add project task</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Assign a task to a member of this project team.
                </p>
              </div>
              <button type="button" aria-label="Close task form" onClick={() => setIsCreateTaskOpen(false)} disabled={isCreatingTask} style={{ border: 0, background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={event => void submitTask(event)} style={{ display: 'grid', gap: '14px', marginTop: '20px' }}>
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
                <textarea className="form-control" rows={3} maxLength={3000} value={description} onChange={event => setDescription(event.target.value)} />
              </label>
              {project.team.length === 0 && (
                <p style={{ color: 'var(--danger)', fontSize: '12px', margin: 0 }}>Add project team members before creating tasks.</p>
              )}
              {createError && <p role="alert" style={{ color: 'var(--danger)', fontSize: '12px', margin: 0 }}>{createError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateTaskOpen(false)} disabled={isCreatingTask}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingTask || project.team.length === 0}>
                  <Plus size={14} /> {isCreatingTask ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
