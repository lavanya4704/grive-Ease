import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getComplaints, getComplaintStats, getComplaint, updateComplaintStatus, reassignComplaint, getSubAdmins } from '../utils/api';
import Sidebar from '../components/Sidebar';
import ComplaintCard from '../components/ComplaintCard';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

function getViewFromPath(pathname) {
  if (pathname === '/all-complaints') return 'all';
  if (pathname === '/escalated') return 'escalated';
  return 'dashboard';
}

export default function AdminDashboard() {
  const location = useLocation();
  const [view, setView] = useState(() => getViewFromPath(location.pathname));
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [subAdmins, setSubAdmins] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);

      const [complaintsData, statsData, subAdminsData] = await Promise.all([
        getComplaints(params.toString()),
        getComplaintStats(),
        getSubAdmins(),
      ]);
      setComplaints(complaintsData);
      setStats(statsData);
      setSubAdmins(subAdminsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  // Sync view with URL when sidebar navigation changes the route
  useEffect(() => {
    const newView = getViewFromPath(location.pathname);
    setView(newView);
    if (newView === 'escalated') setFilter('escalated');
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleComplaintClick = async (complaint) => {
    try {
      const detail = await getComplaint(complaint.id);
      setSelectedComplaint(detail);
      setRemarks('');
      setReassignTo('');
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

  const handleReassign = async () => {
    if (!selectedComplaint || !reassignTo) return;
    setUpdating(true);
    try {
      await reassignComplaint(selectedComplaint.id, parseInt(reassignTo));
      const detail = await getComplaint(selectedComplaint.id);
      setSelectedComplaint(detail);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const escalatedComplaints = complaints.filter(c => c.status === 'escalated');

  return (
    <div className="dashboard-layout">
      <Sidebar isMobileOpen={mobileMenu} onCloseMobile={() => setMobileMenu(false)} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-btn" onClick={() => setMobileMenu(true)}>Menu</button>
          <div>
            <h1 className="dashboard-header__title">Admin Control Center</h1>
            <p className="dashboard-header__subtitle">Monitor and manage all grievances across departments</p>
          </div>
        </header>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${view === 'dashboard' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setView('dashboard')}
          >Overview</button>
          <button
            className={`dashboard-tab ${view === 'all' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setView('all')}
          >All Complaints</button>
          <button
            className={`dashboard-tab ${view === 'escalated' ? 'dashboard-tab--active' : ''}`}
            onClick={() => { setView('escalated'); setFilter('escalated'); }}
          >
            Escalated
            {stats && stats.escalated > 0 && (
              <span style={{ 
                marginLeft: 6, 
                background: 'var(--status-escalated)', 
                color: 'white', 
                borderRadius: 'var(--radius-full)',
                padding: '1px 8px',
                fontSize: 'var(--font-xs)',
                fontWeight: 700
              }}>{stats.escalated}</span>
            )}
          </button>
          <button
            className={`dashboard-tab ${view === 'analytics' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setView('analytics')}
          >Analytics</button>
        </div>

        <div className="dashboard-content">
          {/* Overview */}
          {view === 'dashboard' && (
            <div className="animate-fade-in">
              {stats && (
                <div className="stats-grid">
                  <StatsCard icon="total" label="Total Complaints" value={stats.total} color="purple" delay={0} />
                  <StatsCard icon="pending" label="Pending" value={stats.pending} color="yellow" delay={100} />
                  <StatsCard icon="progress" label="In Progress" value={stats.inProgress} color="blue" delay={200} />
                  <StatsCard icon="resolved" label="Resolved" value={stats.resolved} color="green" delay={300} />
                  <StatsCard icon="escalated" label="Escalated" value={stats.escalated} color="red" delay={400} />
                </div>
              )}

              {/* Escalated section */}
              {escalatedComplaints.length > 0 && (
                <div className="dashboard-section">
                  <h2 className="dashboard-section__title" style={{ color: 'var(--status-escalated)' }}>
                    Escalated - Requires Immediate Attention
                  </h2>
                  <div className="complaints-grid">
                    {escalatedComplaints.slice(0, 5).map((c) => (
                      <ComplaintCard key={c.id} complaint={c} onClick={handleComplaintClick} />
                    ))}
                  </div>
                </div>
              )}

              <div className="dashboard-section">
                <h2 className="dashboard-section__title">Recent Activity</h2>
                {complaints.slice(0, 8).length === 0 ? (
                  <div className="dashboard-empty">
                    <p>No complaints found.</p>
                  </div>
                ) : (
                  <div className="complaints-grid">
                    {complaints.slice(0, 8).map((c) => (
                      <ComplaintCard key={c.id} complaint={c} onClick={handleComplaintClick} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Complaints */}
          {view === 'all' && (
            <div className="animate-fade-in">
              <div className="filter-bar">
                <form onSubmit={handleSearch} className="filter-bar__search">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search complaints..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </form>
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
                <div className="dashboard-loading">Loading...</div>
              ) : complaints.length === 0 ? (
                <div className="dashboard-empty">
                  <p>No complaints match your filters.</p>
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

          {/* Escalated */}
          {view === 'escalated' && (
            <div className="animate-fade-in">
              <h2 className="dashboard-section__title" style={{ color: 'var(--status-escalated)' }}>
                Escalated Complaints
              </h2>
              {loading ? (
                <div className="dashboard-loading">Loading...</div>
              ) : complaints.filter(c => c.status === 'escalated').length === 0 ? (
                <div className="dashboard-empty">
                  <p>No escalated complaints! Everything is under control.</p>
                </div>
              ) : (
                <div className="complaints-grid">
                  {complaints.filter(c => c.status === 'escalated').map((c) => (
                    <ComplaintCard key={c.id} complaint={c} onClick={handleComplaintClick} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {view === 'analytics' && stats && (
            <div className="animate-fade-in">
              <h2 className="dashboard-section__title">Department Analytics</h2>
              <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <StatsCard icon="chart" label="Total" value={stats.total} color="purple" delay={0} />
                <StatsCard icon="rate" label="Resolution Rate" value={stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%'} color="green" delay={100} />
                <StatsCard icon="escalated" label="Escalation Rate" value={stats.total > 0 ? `${Math.round((stats.escalated / stats.total) * 100)}%` : '0%'} color="red" delay={200} />
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3 className="analytics-card__title">Complaints by Category</h3>
                  {stats.byCategory && stats.byCategory.map((item) => (
                    <div key={item.category} className="category-bar">
                      <span className="category-bar__label">{item.category}</span>
                      <div className="category-bar__track">
                        <div
                          className="category-bar__fill"
                          style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="category-bar__count">{item.count}</span>
                    </div>
                  ))}
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-card__title">Status Distribution</h3>
                  <div className="category-bar">
                    <span className="category-bar__label">Pending</span>
                    <div className="category-bar__track">
                      <div className="category-bar__fill" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`, background: 'var(--status-pending)' }}></div>
                    </div>
                    <span className="category-bar__count">{stats.pending}</span>
                  </div>
                  <div className="category-bar">
                    <span className="category-bar__label">In Progress</span>
                    <div className="category-bar__track">
                      <div className="category-bar__fill" style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`, background: 'var(--status-in-progress)' }}></div>
                    </div>
                    <span className="category-bar__count">{stats.inProgress}</span>
                  </div>
                  <div className="category-bar">
                    <span className="category-bar__label">Resolved</span>
                    <div className="category-bar__track">
                      <div className="category-bar__fill" style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`, background: 'var(--status-resolved)' }}></div>
                    </div>
                    <span className="category-bar__count">{stats.resolved}</span>
                  </div>
                  <div className="category-bar">
                    <span className="category-bar__label">Escalated</span>
                    <div className="category-bar__track">
                      <div className="category-bar__fill" style={{ width: `${stats.total > 0 ? (stats.escalated / stats.total) * 100 : 0}%`, background: 'var(--status-escalated)' }}></div>
                    </div>
                    <span className="category-bar__count">{stats.escalated}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Action Modal */}
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
              <div className="detail-row">
                <span className="detail-label">Submitted By</span>
                <span className="detail-value">
                  {selectedComplaint.is_anonymous ? 'Anonymous' : (selectedComplaint.submitter_name || 'Unknown')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assigned To</span>
                <span className="detail-value">{selectedComplaint.assigned_name || 'Unassigned'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value">{new Date(selectedComplaint.created_at + 'Z').toLocaleString()}</span>
              </div>

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

              {/* Admin Actions */}
              {selectedComplaint.status !== 'resolved' && (
                <div className="status-update">
                  <h3 className="status-update__title">Admin Actions</h3>
                  <div className="input-group">
                    <label htmlFor="admin-remarks">Remarks</label>
                    <textarea
                      id="admin-remarks"
                      className="input-field"
                      placeholder="Add remarks..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows="2"
                    />
                  </div>
                  <div className="status-update__actions">
                    {selectedComplaint.status !== 'in-progress' && (
                      <button
                        className="status-btn status-btn--in-progress"
                        onClick={() => handleStatusUpdate('in-progress')}
                        disabled={updating}
                      >In Progress</button>
                    )}
                    <button
                      className="status-btn status-btn--resolved"
                      onClick={() => handleStatusUpdate('resolved')}
                      disabled={updating}
                    >Resolve</button>
                  </div>
                </div>
              )}

              {/* Reassign */}
              <div className="reassign-section">
                <div className="input-group">
                  <label htmlFor="reassign-select">Reassign to Department</label>
                  <select
                    id="reassign-select"
                    className="input-field"
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                  >
                    <option value="">Select sub-admin...</option>
                    {subAdmins.map((sa) => (
                      <option key={sa.id} value={sa.id}>{sa.name} ({sa.category})</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleReassign}
                  disabled={!reassignTo || updating}
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
