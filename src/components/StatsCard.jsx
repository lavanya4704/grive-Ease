import React from 'react';
import './StatsCard.css';

export default function StatsCard({ icon, label, value, color, delay = 0 }) {
  return (
    <div className={`stats-card stats-card--${color}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__info">
        <span className="stats-card__value">{value}</span>
        <span className="stats-card__label">{label}</span>
      </div>
      <div className="stats-card__glow"></div>
    </div>
  );
}
