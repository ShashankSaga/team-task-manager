import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from './Layout';
import { getTask, updateTask, deleteTask, getAllUsers } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: '#64748b' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#10b981' },
  { value: 'overdue', label: 'Overdue', color: '#ef4444' },
];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}
function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TaskDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getTask(id), getAllUsers()])
      .then(([taskRes, usersRes]) => {
        const t = taskRes.data.task;
        setTask(t);
        setUsers(usersRes.data.users);
        setForm({
          title: t.title,
          description: t.description || '',
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to || '',
          due_date: formatDateInput(t.due_date),
        });
      })
      .catch(() => setError('Failed to load task.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await updateTask(id, { status: newStatus });
      setTask(res.data.task);
      setForm(f => ({ ...f, status: newStatus }));
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      const res = await updateTask(id, {
        ...form,
        assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
        due_date: form.due_date || null,
      });
      setTask(res.data.task);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this task?')) return;
    try {
      await deleteTask(id);
      if (task?.project_id) navigate(`/projects/${task.project_id}`);
      else navigate('/dashboard');
    } catch {
      alert('Failed to delete task.');
    }
  };

  if (loading) return (
    <Layout>
      <div className="loading-screen" style={{ height: '60vh' }}>
        <div className="spinner" /><p>Loading task…</p>
      </div>
    </Layout>
  );
  if (error || !task) return (
    <Layout>
      <div className="page-content">
        <div className="alert alert-error">{error || 'Task not found.'}</div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/projects">Projects</Link>
            <span className="breadcrumb-sep">›</span>
            {task.project_name && (
              <>
                <Link to={`/projects/${task.project_id}`}>{task.project_name}</Link>
                <span className="breadcrumb-sep">›</span>
              </>
            )}
            <span>Task</span>
          </div>
          <h1 className="page-title">{task.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!editing && (
            <button className="btn btn-secondary" onClick={() => setEditing(true)} id="btn-edit-task">
              ✏ Edit
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-danger" onClick={handleDelete} id="btn-delete-task">
              🗑 Delete
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {saveError && <div className="alert alert-error">{saveError}</div>}

        <div className="task-detail-grid">
          {/* Main column */}
          <div>
            {editing ? (
              <form onSubmit={handleSave} className="card">
                <h2 className="section-title" style={{ marginBottom: 20 }}>Edit Task</h2>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-title">Title *</label>
                  <input
                    id="edit-title" className="form-input"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-desc">Description</label>
                  <textarea
                    id="edit-desc" className="form-textarea"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ minHeight: 120 }}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-status">Status</label>
                    <select id="edit-status" className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-priority">Priority</label>
                    <select id="edit-priority" className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-assignee">Assigned To</label>
                    <select id="edit-assignee" className="form-select" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-due">Due Date</label>
                    <input
                      id="edit-due" type="date" className="form-input"
                      value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-task">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="card">
                <div className="detail-field">
                  <div className="detail-label">Description</div>
                  <div className="detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {task.description || <em style={{ color: 'var(--text-muted)' }}>No description provided.</em>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="task-detail-sidebar">
            {/* Status Changer */}
            <div className="card">
              <div className="detail-label" style={{ marginBottom: 10 }}>Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    className="btn btn-ghost btn-sm"
                    style={{
                      justifyContent: 'flex-start',
                      borderColor: task.status === s.value ? s.color : 'transparent',
                      color: task.status === s.value ? s.color : 'var(--text-secondary)',
                      background: task.status === s.value ? `${s.color}18` : 'transparent',
                    }}
                    onClick={() => handleStatusChange(s.value)}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    {s.label}
                    {task.status === s.value && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="card">
              <div className="detail-field">
                <div className="detail-label">Priority</div>
                <div>
                  <span className={`badge badge-${task.priority}`} style={{ fontSize: 13 }}>
                    {task.priority}
                  </span>
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Assigned To</div>
                <div className="detail-value">
                  {task.assignee_name ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: task.assignee_color || '#6366f1' }}>
                        {getInitials(task.assignee_name)}
                      </div>
                      <span>{task.assignee_name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Project</div>
                <div className="detail-value">
                  {task.project_name ? (
                    <Link
                      to={`/projects/${task.project_id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.project_color }} />
                      <span style={{ color: 'var(--primary)' }}>{task.project_name}</span>
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No project</span>
                  )}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Due Date</div>
                <div
                  className="detail-value"
                  style={{ color: task.status === 'overdue' ? 'var(--status-overdue)' : 'inherit' }}
                >
                  {formatDate(task.due_date) || <span style={{ color: 'var(--text-muted)' }}>No due date</span>}
                </div>
              </div>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <div className="detail-label">Created By</div>
                <div className="detail-value">{task.creator_name || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
