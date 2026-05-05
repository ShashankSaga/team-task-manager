import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { getProjects, createProject, deleteProject } from '../api';
import { useAuth } from '../context/AuthContext';

const PROJECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];

export default function Projects() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    getProjects()
      .then(r => setProjects(r.data.projects))
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Project name is required.'); return; }
    setSubmitting(true);
    try {
      await createProject(form);
      setShowModal(false);
      setForm({ name: '', description: '', color: '#6366f1' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      setProjects(p => p.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete project.');
    }
  };

  const getProgress = (p) => {
    const total = parseInt(p.task_count) || 0;
    const done = parseInt(p.completed_count) || 0;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track all team projects</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-create-project">
            + New Project
          </button>
        )}
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-screen" style={{ height: '40vh' }}>
            <div className="spinner" />
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◫</div>
            <div className="empty-title">No projects yet</div>
            <div className="empty-desc">
              {isAdmin ? 'Create your first project to get started.' : 'No projects have been created yet.'}
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 8 }}>
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => {
              const progress = getProgress(project);
              return (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  style={{ '--proj-color': project.color }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: project.color, borderRadius: '16px 16px 0 0' }} />
                  <div className="project-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="project-dot" style={{ background: project.color }} />
                      <span className={`badge badge-${project.status}`}>{project.status}</span>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn btn-icon btn-danger btn-sm"
                        onClick={(e) => handleDelete(e, project.id)}
                        title="Delete project"
                        style={{ opacity: 0.7 }}
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  <div className="project-name">{project.name}</div>
                  <div className="project-desc">{project.description || 'No description provided.'}</div>

                  <div className="project-progress">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>{project.task_count || 0} tasks</span>
                      <span>{progress}% complete</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }} />
                    </div>
                  </div>

                  <div className="project-meta" style={{ marginTop: 12 }}>
                    <span>By {project.created_by_name || 'Unknown'}</span>
                    {parseInt(project.overdue_count) > 0 && (
                      <span style={{ color: 'var(--status-overdue)', fontWeight: 600 }}>
                        ⚠ {project.overdue_count} overdue
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-name">Project Name *</label>
                <input
                  id="proj-name" className="form-input" placeholder="e.g. Website Redesign"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc" className="form-textarea" placeholder="What is this project about?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 80 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Color</label>
                <div className="color-picker">
                  {PROJECT_COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-submit-project">
                  {submitting ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
