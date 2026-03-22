const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

// Serve frontend build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Auto-escalation: check every 60 seconds for complaints pending > 48 hours
setInterval(() => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const staleComplaints = db.prepare(
      "SELECT id FROM complaints WHERE status = 'pending' AND created_at < ?"
    ).all(cutoff);

    for (const complaint of staleComplaints) {
      db.prepare(
        "UPDATE complaints SET status = 'escalated', updated_at = datetime('now') WHERE id = ?"
      ).run(complaint.id);

      db.prepare(
        'INSERT INTO logs (complaint_id, action, details) VALUES (?, ?, ?)'
      ).run(complaint.id, 'escalated', 'Auto-escalated: pending for more than 48 hours');
    }

    if (staleComplaints.length > 0) {
      console.log(`Auto-escalated ${staleComplaints.length} complaint(s)`);
    }
  } catch (err) {
    console.error('Auto-escalation error:', err);
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Grievance Management Server running on http://localhost:${PORT}`);
});
