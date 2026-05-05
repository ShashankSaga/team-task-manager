import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '▦', label: 'Dashboard' },
  { to: '/projects', icon: '◫', label: 'Projects' },
];

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Layout({ children }) {
  const { user, logoutUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">TeamFlow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 24 }}>Admin</div>
              <div className="sidebar-nav-item" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'default' }}>
                <span className="nav-icon">👑</span>
                Admin Mode Active
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div
              className="user-avatar"
              style={{ background: user?.avatar_color || '#6366f1' }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
