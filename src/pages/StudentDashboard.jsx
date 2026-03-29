import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getUser, getComplaints, getComplaintStats, getComplaint } from '../utils/api';
import Sidebar from '../components/Sidebar';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintCard from '../components/ComplaintCard';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

function getViewFromPath(pathname) {
  if (pathname === '/submit') return 'submit';
  if (pathname === '/my-complaints') return 'complaints';
  return 'dashboard';
}

export default function StudentDashboard() {
  const user = getUser();
  const location = useLocation();
  const [view, setView] = useState(() => getViewFromPath(location.pathname));
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [complaintsData, statsData] = await Promise.all([
        getComplaints(),
        getComplaintStats(),
      ]);
      setComplaints(complaintsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Sync view with URL when sidebar navigation changes the route
  useEffect(() => {
    setView(getViewFromPath(location.pathname));
  }, [location.pathname]);

  const handleComplaintClick = async (complaint) => {
    try {
      const detail = await getComplaint(complaint.id);
      setSelectedComplaint(detail);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isMobileOpen={mobileMenu} onCloseMobile={() => setMobileMenu(false)} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-btn" onClick={() => setMobileMenu(true)}>Menu</button>
          <div>
            <h1 className="dashboard-header__title">Welcome, {user?.name || 'Student'}</h1>
            <p className="dashboard-header__subtitle">Track and manage your grievances</p>
          </div>
        </header>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${view === 'dashboard' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setView('dashboard')}
          >Overview</button>
          <button
            className={`dashboard-tab ${view === 'submit' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setView('submit')}
          >New Complaint</button>
          <button
            className={`dashboard-tab ${view === 'complaints' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setView('complaints')}
          >My Complaints</button>
        </div>

        <div className="dashboard-content">
          {view === 'dashboard' && (
            <div className="animate-fade-in">
              {stats && (
                <div className="stats-grid">
                  <StatsCard icon="total" label="Total Submitted" value={stats.total} color="purple" delay={0} />
                  <StatsCard icon="pending" label="Pending" value={stats.pending} color="yellow" delay={100} />
                  <StatsCard icon="progress" label="In Progress" value={stats.inProgress} color="blue" delay={200} />
                  <StatsCard icon="resolved" label="Resolved" value={stats.resolved} color="green" delay={300} />
                </div>
              )}

              <div className="dashboard-section">
                <h2 className="dashboard-section__title">Recent Complaints</h2>
                {loading ? (
                  <div className="dashboard-loading">Loading...</div>
                ) : complaints.length === 0 ? (
                  <div className="dashboard-empty">
                    <p>No complaints submitted yet.</p>
                    <button className="btn btn-primary" onClick={() => setView('submit')}>Submit Your First Complaint</button>
                  </div>
                ) : (
                  <div className="complaints-grid">
                    {complaints.slice(0, 6).map((c, i) => (
                      <ComplaintCard key={c.id} complaint={c} onClick={handleComplaintClick} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'submit' && (
            <div className="dashboard-form-wrapper animate-fade-in">
              <ComplaintForm onSuccess={() => { fetchData(); setView('complaints'); }} />
            </div>
          )}

          {view === 'complaints' && (
            <div className="animate-fade-in">
              <h2 className="dashboard-section__title">My Complaints</h2>
              {loading ? (
                <div className="dashboard-loading">Loading...</div>
              ) : complaints.length === 0 ? (
                <div className="dashboard-empty">
                  <span className="dashboard-empty__icon">[Empty]</span>
                  <p>No complaints found.</p>
                </div>
              ) : (
                <div className="complaints-grid">
                  {complaints.map((c) => (
                    <ComplaintCard key={c.id} complaint={c} onClick={handleComplaintClick} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complaint #{selectedComplaint.id}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedComplaint(null)}>X</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <StatusBadge status={selectedComplaint.status} />
              </div>
              <div className="detail-row">
                <span className="detail-label">Category</span>
                <span className="detail-value">{selectedComplaint.category}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Title</span>
                <span className="detail-value">{selectedComplaint.title}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <p className="detail-description">{selectedComplaint.description}</p>
              </div>
              {selectedComplaint.assigned_name && (
                <div className="detail-row">
                  <span className="detail-label">Assigned To</span>
                  <span className="detail-value">{selectedComplaint.assigned_name}</span>
                </div>
              )}

              {/* Timeline */}
              {selectedComplaint.logs && selectedComplaint.logs.length > 0 && (
                <div className="detail-timeline">
                  <h3 className="detail-timeline__title">Activity Timeline</h3>
                  {selectedComplaint.logs.map((log, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-item__dot"></div>
                      <div className="timeline-item__content">
                        <span className="timeline-item__action">{log.details}</span>
                        <span className="timeline-item__time">
                          {log.performer_name && `by ${log.performer_name} - `}
                          {new Date(log.created_at + 'Z').toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="detail-attachments">
                  <h3>Attachments</h3>
                  <div className="detail-attachments__list">
                    {selectedComplaint.attachments.map((att) => (
                      <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="detail-attachment">
                        {att.original_name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
