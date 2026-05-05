import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup } from '../api';

export default function Signup() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await signup(form);
      loginUser(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.msg).join(' ') : err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">⚡</div>
            <span className="auth-logo-text">TeamFlow</span>
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join your team on TeamFlow</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name" name="name" type="text" className="form-input"
                placeholder="Jane Smith" value={form.name} onChange={handleChange} required autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email" name="email" type="email" className="form-input"
                placeholder="you@example.com" value={form.email} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password" className="form-input"
                placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select id="role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
