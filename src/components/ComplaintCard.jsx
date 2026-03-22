import React from 'react';
import StatusBadge from './StatusBadge';
import './ComplaintCard.css';

export default function ComplaintCard({ complaint, onClick }) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className={`complaint-card complaint-card--${complaint.status}`}
      onClick={() => onClick && onClick(complaint)}
      role="button"
      tabIndex={0}
      id={`complaint-${complaint.id}`}
    >
      <div className="complaint-card__header">
        <h3 className="complaint-card__title">{complaint.title}</h3>
        <StatusBadge status={complaint.status} />
      </div>
      <p className="complaint-card__description">{complaint.description}</p>
      <div className="complaint-card__footer">
        <div className="complaint-card__meta">
          <span className="complaint-card__category">{complaint.category}</span>
          <span className="complaint-card__time">{timeAgo(complaint.created_at)}</span>
        </div>
        <div className="complaint-card__info">
          {complaint.is_anonymous ? (
            <span className="complaint-card__anonymous">Anonymous</span>
          ) : complaint.submitter_name ? (
            <span className="complaint-card__submitter">by {complaint.submitter_name}</span>
          ) : null}
          {complaint.assigned_name && (
            <span className="complaint-card__assigned">→ {complaint.assigned_name}</span>
          )}
        </div>
      </div>
      <div className="complaint-card__accent"></div>
    </div>
  );
}
