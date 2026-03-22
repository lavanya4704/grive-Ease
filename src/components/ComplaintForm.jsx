import React, { useState } from 'react';
import { submitComplaint } from '../utils/api';
import './ComplaintForm.css';

const categories = ['', 'Academic', 'Infrastructure', 'Hostel', 'Discipline', 'Administration', 'Others'];

export default function ComplaintForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    is_anonymous: false,
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      if (formData.category) fd.append('category', formData.category);
      fd.append('is_anonymous', formData.is_anonymous);

      for (const file of files) {
        fd.append('attachments', file);
      }

      await submitComplaint(fd);
      setSuccess('Complaint submitted successfully! Our AI has auto-categorized and assigned it.');
      setFormData({ title: '', description: '', category: '', is_anonymous: false });
      setFiles([]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  return (
    <form className="complaint-form" onSubmit={handleSubmit} id="complaint-form">
      <div className="complaint-form__header">
        <h2 className="complaint-form__title">Submit a Complaint</h2>
        <p className="complaint-form__subtitle">
          Describe your issue and our AI will automatically categorize and route it
        </p>
      </div>

      {error && <div className="complaint-form__alert complaint-form__alert--error">{error}</div>}
      {success && <div className="complaint-form__alert complaint-form__alert--success">{success}</div>}

      <div className="complaint-form__fields">
        <div className="input-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            className="input-field"
            placeholder="Brief summary of your complaint"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            className="input-field"
            placeholder="Provide a detailed description of the issue. Our AI will analyze this to categorize your complaint."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows="5"
          />
        </div>

        <div className="complaint-form__row">
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="category">Category (optional — AI auto-detects)</label>
            <select
              id="category"
              className="input-field"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Let AI decide</option>
              {categories.filter(c => c).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="attachments">Attachments (images, videos, PDFs)</label>
          <div className="complaint-form__upload">
            <input
              id="attachments"
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={handleFileChange}
              className="complaint-form__file-input"
            />
            <div className="complaint-form__upload-label">
              <span className="complaint-form__upload-icon">📎</span>
              <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Click or drag files here'}</span>
            </div>
          </div>
        </div>

        <div className="complaint-form__toggle-row">
          <label className="complaint-form__toggle" htmlFor="anonymous-toggle">
            <input
              id="anonymous-toggle"
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
            />
            <span className="complaint-form__toggle-slider"></span>
            <div className="complaint-form__toggle-info">
              <span className="complaint-form__toggle-label">Submit Anonymously</span>
              <span className="complaint-form__toggle-hint">Your identity will be hidden from admins</span>
            </div>
          </label>
        </div>
      </div>

      <div className="complaint-form__actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="submit-complaint-btn">
          {loading ? '⏳ Submitting...' : '🚀 Submit Complaint'}
        </button>
      </div>
    </form>
  );
}
