import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-title">{title}</div>
      {children}
    </div>
  </div>
);

const PriorityBadge = ({ p }) => <span className={`priority-badge ${p}`}>{p}</span>;
const StatusBadge = ({ s }) => <span className={`status-badge ${s}`}>{s.replace('_', ' ')}</span>;

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const isOverdue = (d, status) => {
  if (!d || status === 'done') return false;
  return new Date(d) < new Date();
};

const EditTaskModal = ({ task, members, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    due_date: task.due_date ? task.due_date.split('T')[0] : '',
    priority: task.priority,
    status: task.status,
    assigned_to: task.assigned_to || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await onSave({ ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Task" onClose={onClose}>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
        <div className="form-group"><label>Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label>Priority</label>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option>
            </select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label>Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
          <div className="form-group"><label>Assign To</label>
            <select value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select></div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
};

const TaskCard = ({ task, isAdmin, onUpdate, onDelete, members }) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="task-item" style={{ flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div className="task-info">
          <div className="task-title">{task.title}</div>
          {task.description && <div className="task-desc">{task.description}</div>}
          <div className="task-meta">
            <PriorityBadge p={task.priority} />
            <StatusBadge s={task.status} />
            {task.assigned_to_name && (
              <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="avatar" style={{ width: 18, height: 18, fontSize: 9 }}>{task.assigned_to_name[0]}</div>
                {task.assigned_to_name}
              </span>
            )}
            {task.due_date && (
              <span className={`task-due ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}>
                {isOverdue(task.due_date, task.status) ? '⚠️ ' : '📅 '}{formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
        <div className="task-actions">
          {isAdmin ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>Del</button>
            </>
          ) : (
            <select value={task.status} onChange={e => onUpdate(task.id, { status: e.target.value })}
              style={{ padding: '5px 8px', fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer' }}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
        </div>
      </div>
      {editing && (
        <EditTaskModal task={task} members={members} onClose={() => setEditing(false)}
          onSave={async (data) => { await onUpdate(task.id, data); setEditing(false); }} />
      )}
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const [proj, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ]);
      setProject(proj.data);
      setTasks(taskRes.data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    const res = await api.get(`/projects/${id}/tasks?${params}`);
    setTasks(res.data);
  }, [id, filters]);

  useEffect(() => { if (project) fetchTasks(); }, [fetchTasks, project]);

  const isAdmin = project?.currentUserRole === 'admin';

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post(`/projects/${id}/tasks`, {
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date || null
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (taskId, data) => {
    await api.put(`/tasks/${taskId}`, data);
    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    fetchTasks();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post(`/projects/${id}/members`, memberForm);
      setMemberForm({ email: '', role: 'member' });
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? All tasks will be deleted too.`)) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading project…</div>;
  if (!project) return null;

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <button onClick={() => navigate('/projects')}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 8 }}>
              ← Back to Projects
            </button>
            <div className="page-title">{project.name}</div>
            {project.description && <div className="page-sub">{project.description}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isAdmin && <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>👥 Members</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            </>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          {project.members?.slice(0, 6).map(m => (
            <div key={m.id} className="avatar" style={{ width: 28, height: 28, fontSize: 11 }} title={`${m.name} (${m.role})`}>
              {m.name[0]}
            </div>
          ))}
          {project.members?.length > 6 && <span style={{ fontSize: 12, color: 'var(--text3)' }}>+{project.members.length - 6}</span>}
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>
            {project.members?.length} member{project.members?.length !== 1 ? 's' : ''} ·{' '}
            <span className={`role-badge ${project.currentUserRole}`}>{project.currentUserRole}</span>
          </span>
        </div>
      </div>

      {/* View toggle + filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div className="tabs">
          <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
          <button className={`tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
        </div>
        <div className="filters">
          <select className="filter-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select className="filter-select" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Task content */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Tasks Found</h3>
          <p>{isAdmin ? 'Create the first task for this project' : 'No tasks match your filters'}</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowTaskModal(true)}>Add Task</button>}
        </div>
      ) : view === 'list' ? (
        <div className="task-list">
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} isAdmin={isAdmin} members={project.members || []}
              onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
          ))}
        </div>
      ) : (
        <div className="kanban">
          {[['todo', 'To Do', 'var(--border2)'], ['in_progress', 'In Progress', 'var(--yellow)'], ['done', 'Done', 'var(--green)']].map(([status, label, color]) => (
            <div key={status} className="kanban-col">
              <div className="kanban-header">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                {label}
                <span className="kanban-count">{grouped[status].length}</span>
              </div>
              <div className="kanban-cards">
                {grouped[status].map(t => (
                  <div key={t.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{t.description.slice(0, 80)}{t.description.length > 80 ? '…' : ''}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      <PriorityBadge p={t.priority} />
                      {t.assigned_to_name && <div style={{ fontSize: 11, color: 'var(--text3)' }}>→ {t.assigned_to_name}</div>}
                    </div>
                    {t.due_date && (
                      <div className={`task-due ${isOverdue(t.due_date, t.status) ? 'overdue' : ''}`} style={{ fontSize: 11, marginBottom: 8 }}>
                        {isOverdue(t.due_date, t.status) ? '⚠️ ' : '📅 '}{formatDate(t.due_date)}
                      </div>
                    )}
                    <select value={t.status} onChange={e => handleUpdateTask(t.id, { status: e.target.value })}
                      style={{ width: '100%', padding: '4px 6px', fontSize: 11, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', cursor: 'pointer' }}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 6, justifyContent: 'center', padding: '4px', fontSize: 11 }}
                        onClick={() => handleDeleteTask(t.id)}>Delete</button>
                    )}
                  </div>
                ))}
                {grouped[status].length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: '20px 0' }}>No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <Modal title="New Task" onClose={() => { setShowTaskModal(false); setError(''); }}>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleCreateTask}>
            <div className="form-group"><label>Title *</label>
              <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" required autoFocus /></div>
            <div className="form-group"><label>Description</label>
              <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="What needs to be done?" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select></div>
              <div className="form-group"><label>Due Date</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Assign To</label>
              <select value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))}>
                <option value="">Unassigned</option>
                {project.members?.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
              </select></div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Task'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Members Modal */}
      {showMemberModal && (
        <Modal title="Manage Members" onClose={() => { setShowMemberModal(false); setError(''); }}>
          {isAdmin && (
            <>
              <div className="section-title" style={{ marginBottom: 10 }}>Add New Member</div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={handleAddMember}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <input value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@email.com" type="email" style={{ flex: 1 }} required />
                  <select value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))}
                    style={{ width: 110 }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '…' : 'Add'}</button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>The user must already have an account</div>
              </form>
              <hr className="divider" />
            </>
          )}
          <div className="section-title" style={{ marginBottom: 12 }}>Members ({project.members?.length})</div>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.id} className="member-item">
                <div className="avatar">{m.name[0]}</div>
                <div className="member-info">
                  <div className="member-name">{m.name} {m.id === user?.id && <span style={{ fontSize: 11, color: 'var(--text3)' }}>(you)</span>}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                <span className={`role-badge ${m.role}`}>{m.role}</span>
                {isAdmin && m.id !== user?.id && (
                  <button className="btn btn-danger btn-sm" style={{ fontSize: 11, padding: '4px 8px' }}
                    onClick={() => handleRemoveMember(m.id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
