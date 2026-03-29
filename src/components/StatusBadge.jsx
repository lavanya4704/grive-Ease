import React from 'react';
import './StatusBadge.css';

const statusConfig = {
  pending: { label: 'Pending', icon: '' },
  'in-progress': { label: 'In Progress', icon: '' },
  resolved: { label: 'Resolved', icon: '' },
  escalated: { label: 'Escalated', icon: '' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, icon: '' };

  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot"></span>
      {config.label}
    </span>
  );
}
