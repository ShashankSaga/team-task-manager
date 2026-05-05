import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { getDashboard } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', overdue: 'Overdue' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="loading-screen" style={{ height: '60vh' }}>
        <div className="spinner" /><p>Loading dashboard…</p>
      </div>
    </Layout>
  );

  const stats = data?.stats || {};

  const statCards = [
    { key: 'total', label: 'Total Tasks', value: stats.total || 0, icon: '◉', cls: 'total' },
    { key: 'todo', label: 'To Do', value: stats.todo || 0, icon: '○', cls: 'todo' },
    { key: 'in_progress', label: 'In Progress', value: stats.in_progress || 0, icon: '◑', cls: 'in-progress' },
    { key: 'done', label: 'Done', value: stats.done || 0, icon: '●', cls: 'done' },
    { key: 'overdue', label: 'Overdue', value: stats.overdue || 0, icon: '⚠', cls: 'overdue' },
    { key: 'projects', label: 'Projects', value: stats.projects || 0, icon: '◫', cls: 'projects' },
  ];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          {statCards.map(s => (
            <div key={s.key} className={`stat-card ${s.cls}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-icon">{s.icon}</div>
            </div>
          ))}
        </div>

        <div className="dash-grid">
          {/* My Tasks */}
          <div className="card">
            <div className="section-title">📋 My Tasks</div>
            {data?.myTasks?.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon">✅</div>
                <div className="empty-title">All caught up!</div>
                <div className="empty-desc">No active tasks assigned to you.</div>
              </div>
            ) : (
              <div className="tasks-list">
                {data?.myTasks?.map(task => (
                  <Link to={`/tasks/${task.id}`} key={task.id} style={{ textDecoration: 'none' }}>
                    <div className={`task-item ${task.status}`}>
                      <div className={`task-check ${task.status === 'done' ? 'done' : ''}`}>
                        {task.status === 'done' && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                      </div>
                      <div className="task-info">
                        <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                        <div className="task-meta">
                          <span className={`badge badge-${task.status.replace('_', '-')}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          {task.project_name && (
                            <span style={{ color: task.project_color }}>{task.project_name}</span>
                          )}
                          {task.due_date && (
                            <span className={`task-due ${task.status === 'overdue' ? 'overdue' : ''}`}>
                              📅 {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="badge"
                        style={{ background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority] }}
                      >
                        {task.priority}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="card">
            <div className="section-title" style={{ color: 'var(--status-overdue)' }}>⚠️ Overdue Tasks</div>
            {data?.overdueTasks?.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon">🎉</div>
                <div className="empty-title">No overdue tasks!</div>
              </div>
            ) : (
              <div className="tasks-list">
                {data?.overdueTasks?.map(task => (
                  <Link to={`/tasks/${task.id}`} key={task.id} style={{ textDecoration: 'none' }}>
                    <div className="task-item overdue">
                      <div className="task-info">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          {task.project_name && <span style={{ color: task.project_color }}>{task.project_name}</span>}
                          <span className="task-due overdue">📅 {formatDate(task.due_date)}</span>
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card col-full">
            <div className="section-title">🕐 Recent Activity</div>
            {data?.recentTasks?.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">No recent tasks</div>
              </div>
            ) : (
              <div className="tasks-list">
                {data?.recentTasks?.map(task => (
                  <Link to={`/tasks/${task.id}`} key={task.id} style={{ textDecoration: 'none' }}>
                    <div className={`task-item ${task.status}`}>
                      <div className="task-info">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span className={`badge badge-${task.status.replace('_', '-')}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          {task.project_name && (
                            <span style={{ color: task.project_color }}>{task.project_name}</span>
                          )}
                          {task.assignee_name && (
                            <span>👤 {task.assignee_name}</span>
                          )}
                          <span style={{ marginLeft: 'auto' }}>
                            Updated {formatDate(task.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
