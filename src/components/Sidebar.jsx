import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/api';
import './Sidebar.css';

const roleConfig = {
  student: {
    label: 'Student',
    color: '#6366f1',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: '' },
      { path: '/submit', label: 'New Complaint', icon: '' },
      { path: '/my-complaints', label: 'My Complaints', icon: '' },
    ]
  },
  'sub-admin': {
    label: 'Sub-Admin',
    color: '#f59e0b',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: '' },
      { path: '/assigned', label: 'Assigned', icon: '' },
    ]
  },
  admin: {
    label: 'Administrator',
    color: '#ef4444',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: '' },
      { path: '/all-complaints', label: 'All Complaints', icon: '' },
      { path: '/escalated', label: 'Escalated', icon: '' },
    ]
  }
};

export default function Sidebar({ isMobileOpen, onCloseMobile }) {
  const user = getUser();
  const navigate = useNavigate();
  const config = roleConfig[user?.role] || roleConfig.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile}></div>}
      <aside className={`sidebar ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-text">
              <span className="sidebar__brand">GrievEase</span>
              <span className="sidebar__tagline">Grievance Portal</span>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {config.links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onCloseMobile}
            >
              <span className="sidebar__link-icon">{link.icon}</span>
              <span className="sidebar__link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" style={{ background: config.color }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || 'User'}</span>
              <span className="sidebar__user-role">{config.label}{user?.category ? ` - ${user.category}` : ''}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm sidebar__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
