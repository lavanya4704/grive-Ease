import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup, saveAuth } from '../utils/api';
import './Login.css';

export default function Signup() {
  const [name, setName] = useState('');
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
      const data = await signup(name, email, password);
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
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Join the GrievEase Grievance Portal</p>
        </div>

        {error && <div className="auth-card__error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-card__form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-card__submit" disabled={loading} id="signup-btn">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-card__footer">
          Already have an account? <Link to="/login" className="auth-card__link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
