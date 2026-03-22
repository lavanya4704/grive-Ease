import React, { useState, useEffect } from 'react';
import { getUser, getComplaints, getComplaintStats, getComplaint, updateComplaintStatus } from '../utils/api';
import Sidebar from '../components/Sidebar';
import ComplaintCard from '../components/ComplaintCard';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

export default function SubAdminDashboard() {
  const user = getUser();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `status=${filter}` : '';
      const [complaintsData, statsData] = await Promise.all([
        getComplaints(params),
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

  useEffect(() => { fetchData(); }, [filter]);

  const handleComplaintClick = async (complaint) => {
    try {
      const detail = await getComplaint(complaint.id);
      setSelectedComplaint(detail);
      setRemarks('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedComplaint) return;
    setUpdating(true);
    try {
      await updateComplaintStatus(selectedComplaint.id, newStatus, remarks);
      const detail = await getComplaint(selectedComplaint.id);
      setSelectedComplaint(detail);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isMobileOpen={mobileMenu} onCloseMobile={() => setMobileMenu(false)} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-btn" onClick={() => setMobileMenu(true)}>☰</button>
          <div>
            <h1 className="dashboard-header__title">{user?.category || 'Sub-Admin'} Department 🧑‍💼</h1>
            <p className="dashboard-header__subtitle">Manage complaints assigned to your department</p>
          </div>
        </header>

        <div className="dashboard-content">
          {stats && (
            <div className="stats-grid">
              <StatsCard icon="📥" label="Total Assigned" value={stats.total} color="purple" delay={0} />
              <StatsCard icon="⏳" label="Pending" value={stats.pending} color="yellow" delay={100} />
              <StatsCard icon="🔄" label="In Progress" value={stats.inProgress} color="blue" delay={200} />
              <StatsCard icon="✅" label="Resolved" value={stats.resolved} color="green" delay={300} />
              {stats.escalated > 0 && (
                <StatsCard icon="🔴" label="Escalated" value={stats.escalated} color="red" delay={400} />
              )}
            </div>
          )}

          <div className="filter-bar">
            <div className="filter-pills">
              {['all', 'pending', 'in-progress', 'resolved', 'escalated'].map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${filter === f ? 'filter-pill--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="dashboard-empty">
              <span className="dashboard-empty__icon">📭</span>
              <p>No complaints found for this filter.</p>
            </div>
          ) : (
            <div className="complaints-grid">
              {complaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} onClick={handleComplaintClick} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail + Action Modal */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complaint #{selectedComplaint.id}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedComplaint(null)}>✕</button>
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
              <div className="detail-row">
                <span className="detail-label">Submitted</span>
                <span className="detail-value">
                  {selectedComplaint.is_anonymous ? 'Anonymous' : (selectedComplaint.submitter_name || 'Unknown')}
                  {' · '}
                  {new Date(selectedComplaint.created_at + 'Z').toLocaleString()}
                </span>
              </div>

              {/* Attachments */}
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="detail-attachments">
                  <h3>Attachments</h3>
                  <div className="detail-attachments__list">
                    {selectedComplaint.attachments.map((att) => (
                      <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="detail-attachment">
                        📎 {att.original_name}
                      </a>
                    ))}
                  </div>
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
                          {log.performer_name && `by ${log.performer_name} · `}
                          {new Date(log.created_at + 'Z').toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Update */}
              {selectedComplaint.status !== 'resolved' && (
                <div className="status-update">
                  <h3 className="status-update__title">Update Status</h3>
                  <div className="input-group">
                    <label htmlFor="remarks">Remarks</label>
                    <textarea
                      id="remarks"
                      className="input-field"
                      placeholder="Add your remarks or notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="status-update__actions">
                    {selectedComplaint.status === 'pending' && (
                      <button
                        className="status-btn status-btn--in-progress"
                        onClick={() => handleStatusUpdate('in-progress')}
                        disabled={updating}
                      >
                        {updating ? '...' : '🔄 Mark In Progress'}
                      </button>
                    )}
                    <button
                      className="status-btn status-btn--resolved"
                      onClick={() => handleStatusUpdate('resolved')}
                      disabled={updating}
                    >
                      {updating ? '...' : '✅ Mark Resolved'}
                    </button>
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
