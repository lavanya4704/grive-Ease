import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, saveAuth } from '../utils/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      saveAuth(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__orb auth-page__orb--1"></div>
        <div className="auth-page__orb auth-page__orb--2"></div>
        <div className="auth-page__orb auth-page__orb--3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to AnonVoice Grievance Portal</p>
        </div>

        {error && <div className="auth-card__error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-card__form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-card__submit" disabled={loading} id="login-btn">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-card__footer">
          Don't have an account? <Link to="/signup" className="auth-card__link">Sign Up</Link>
        </div>

        <div className="auth-card__demo">
          <p className="auth-card__demo-title">Demo Accounts</p>
          <div className="auth-card__demo-accounts">
            <button type="button" className="auth-card__demo-btn" onClick={() => { setEmail('student1@campus.edu'); setPassword('student123'); }}>
              Student
            </button>
            <button type="button" className="auth-card__demo-btn" onClick={() => { setEmail('academic@campus.edu'); setPassword('sub123'); }}>
              Sub-Admin
            </button>
            <button type="button" className="auth-card__demo-btn" onClick={() => { setEmail('admin@campus.edu'); setPassword('admin123'); }}>
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
