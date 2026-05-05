import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from './Layout';
import { getProject, createTask, updateTask, deleteTask, getAllUsers } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const STATUS_FILTERS = ['all', 'todo', 'in_progress', 'done', 'overdue'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'todo', assigned_to: '', due_date: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getProject(id), getAllUsers()])
      .then(([projRes, usersRes]) => {
        setProject(projRes.data.project);
        setTasks(projRes.data.tasks);
        setUsers(usersRes.data.users);
      })
      .catch(() => setError('Failed to load project.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('Task title is required.'); return; }
    setSubmitting(true);
    try {
      await createTask({
        ...form,
        project_id: parseInt(id),
        assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
        due_date: form.due_date || null,
      });
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium', status: 'todo', assigned_to: '', due_date: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? updated.data.task : t));
    } catch {
      alert('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {
      alert('Failed to delete task.');
    }
  };

  if (loading) return (
    <Layout>
      <div className="loading-screen" style={{ height: '60vh' }}>
        <div className="spinner" /><p>Loading project…</p>
      </div>
    </Layout>
  );

  if (error || !project) return (
    <Layout>
      <div className="page-content">
        <div className="alert alert-error">{error || 'Project not found.'}</div>
        <button className="btn btn-ghost" onClick={() => navigate('/projects')}>← Back to Projects</button>
      </div>
    </Layout>
  );

  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/projects">Projects</Link>
            <span className="breadcrumb-sep">›</span>
            <span>{project.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            <h1 className="page-title">{project.name}</h1>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          {project.description && <p className="page-subtitle" style={{ marginTop: 8 }}>{project.description}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-task">
          + Add Task
        </button>
      </div>

      <div className="page-content">
        {/* Progress */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{tasks.length} tasks · {doneTasks} done</span>
            <span style={{ fontWeight: 600 }}>{progress}%</span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }} />
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              {' '}
              <span style={{ opacity: 0.7 }}>
                ({f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length})
              </span>
            </button>
          ))}
        </div>

        {/* Task List */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No tasks here</div>
            <div className="empty-desc">Add a task to get started on this project.</div>
          </div>
        ) : (
          <div className="tasks-list">
            {filtered.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.status}`}
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div
                  className={`task-check ${task.status === 'done' ? 'done' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done');
                  }}
                  title="Toggle done"
                >
                  {task.status === 'done' && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                </div>
                <div className="task-info">
                  <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                  <div className="task-meta">
                    <span className={`badge badge-${task.status.replace('_', '-')}`}>
                      {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className={`task-due ${task.status === 'overdue' ? 'overdue' : ''}`}>
                        📅 {formatDate(task.due_date)}
                      </span>
                    )}
                    {task.assignee_name && (
                      <div
                        className="avatar avatar-sm"
                        style={{ background: task.assignee_color || '#6366f1' }}
                        title={task.assignee_name}
                      >
                        {getInitials(task.assignee_name)}
                      </div>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    className="btn btn-icon btn-danger btn-sm"
                    onClick={e => handleDeleteTask(e, task.id)}
                    title="Delete task"
                    style={{ opacity: 0.7 }}
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Task</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Title *</label>
                <input
                  id="task-title" className="form-input" placeholder="Task title"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc" className="form-textarea" placeholder="Optional description"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 70 }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-status">Status</label>
                  <select id="task-status" className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-priority">Priority</label>
                  <select id="task-priority" className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-assignee">Assign To</label>
                  <select id="task-assignee" className="form-select" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due" type="date" className="form-input"
                    value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-submit-task">
                  {submitting ? 'Adding…' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
