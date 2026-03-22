const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken, requireRole } = require('../auth');
const { categorizeComplaint } = require('../ai');

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|webm|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images, videos, and PDFs are allowed'));
  }
});

// POST /api/complaints - Submit a new complaint
router.post('/', upload.array('attachments', 5), (req, res) => {
  try {
    const { title, description, category: userCategory, is_anonymous } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // AI categorization (use user-provided or AI-detected)
    const category = userCategory || categorizeComplaint(title, description);

    // Find the sub-admin for this category
    const subAdmin = db.prepare('SELECT id FROM users WHERE role = ? AND category = ?').get('sub-admin', category);
    const assignedTo = subAdmin ? subAdmin.id : null;

    const isAnon = is_anonymous === 'true' || is_anonymous === '1' || is_anonymous === true ? 1 : 0;

    // If user is authenticated, get user_id from token; otherwise null
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../auth');
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = isAnon ? null : decoded.id;
      } catch (e) {
        // Token invalid, proceed as anonymous
      }
    }

    const result = db.prepare(
      `INSERT INTO complaints (title, description, category, status, is_anonymous, user_id, assigned_to)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`
    ).run(title, description, category, isAnon, userId, assignedTo);

    const complaintId = result.lastInsertRowid;

    // Save attachments
    if (req.files && req.files.length > 0) {
      const insertAttachment = db.prepare(
        'INSERT INTO attachments (complaint_id, file_url, original_name) VALUES (?, ?, ?)'
      );
      for (const file of req.files) {
        insertAttachment.run(complaintId, `/uploads/${file.filename}`, file.originalname);
      }
    }

    // Log the creation
    db.prepare(
      'INSERT INTO logs (complaint_id, action, details, performed_by) VALUES (?, ?, ?, ?)'
    ).run(complaintId, 'created', `Complaint submitted. Category: ${category}`, userId);

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
    res.status(201).json(complaint);
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints - List complaints (role-filtered)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { role, id, category } = req.user;
    const { status, search } = req.query;
    let complaints;

    if (role === 'admin') {
      // Admin sees all
      let query = `
        SELECT c.*, u.name as submitter_name, sa.name as assigned_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users sa ON c.assigned_to = sa.id
      `;
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('c.status = ?');
        params.push(status);
      }
      if (search) {
        conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY c.created_at DESC';

      complaints = db.prepare(query).all(...params);
    } else if (role === 'sub-admin') {
      // Sub-admin sees their category's complaints
      let query = `
        SELECT c.*, u.name as submitter_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.assigned_to = ?
      `;
      const params = [id];

      if (status) {
        query += ' AND c.status = ?';
        params.push(status);
      }
      query += ' ORDER BY c.created_at DESC';

      complaints = db.prepare(query).all(...params);
    } else {
      // Student sees their own complaints (non-anonymous only)
      let query = `
        SELECT c.*, sa.name as assigned_name
        FROM complaints c
        LEFT JOIN users sa ON c.assigned_to = sa.id
        WHERE c.user_id = ?
      `;
      const params = [id];

      if (status) {
        query += ' AND c.status = ?';
        params.push(status);
      }
      query += ' ORDER BY c.created_at DESC';

      complaints = db.prepare(query).all(...params);
    }

    res.json(complaints);
  } catch (err) {
    console.error('List complaints error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/stats - Get complaint statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { role, id } = req.user;
    let whereClause = '';
    let params = [];

    if (role === 'sub-admin') {
      whereClause = 'WHERE assigned_to = ?';
      params = [id];
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM complaints ${whereClause}`).get(...params).count;
    const pending = db.prepare(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'pending'`).get(...params).count;
    const inProgress = db.prepare(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'in-progress'`).get(...params).count;
    const resolved = db.prepare(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'resolved'`).get(...params).count;
    const escalated = db.prepare(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'escalated'`).get(...params).count;

    // Category breakdown
    const byCategory = db.prepare(
      `SELECT category, COUNT(*) as count FROM complaints ${whereClause} GROUP BY category`
    ).all(...params);

    res.json({ total, pending, inProgress, resolved, escalated, byCategory });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/:id - Get single complaint with logs
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const complaint = db.prepare(`
      SELECT c.*, u.name as submitter_name, sa.name as assigned_name
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users sa ON c.assigned_to = sa.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const attachments = db.prepare('SELECT * FROM attachments WHERE complaint_id = ?').all(req.params.id);
    const logs = db.prepare(`
      SELECT l.*, u.name as performer_name
      FROM logs l
      LEFT JOIN users u ON l.performed_by = u.id
      WHERE l.complaint_id = ?
      ORDER BY l.created_at ASC
    `).all(req.params.id);

    res.json({ ...complaint, attachments, logs });
  } catch (err) {
    console.error('Get complaint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/complaints/:id/status - Update complaint status
router.patch('/:id/status', authenticateToken, requireRole('sub-admin', 'admin'), (req, res) => {
  try {
    const { status, remarks } = req.body;
    const validStatuses = ['pending', 'in-progress', 'resolved', 'escalated'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare(
      "UPDATE complaints SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(status, req.params.id);

    // Log the status change
    const details = remarks ? `Status changed to ${status}. Remarks: ${remarks}` : `Status changed to ${status}`;
    db.prepare(
      'INSERT INTO logs (complaint_id, action, details, performed_by) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, 'status_changed', details, req.user.id);

    const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/complaints/:id/assign - Reassign complaint (admin only)
router.patch('/:id/assign', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { assigned_to } = req.body;

    const subAdmin = db.prepare('SELECT id, name, category FROM users WHERE id = ? AND role = ?').get(assigned_to, 'sub-admin');
    if (!subAdmin) {
      return res.status(400).json({ error: 'Invalid sub-admin ID' });
    }

    db.prepare(
      "UPDATE complaints SET assigned_to = ?, category = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(assigned_to, subAdmin.category, req.params.id);

    db.prepare(
      'INSERT INTO logs (complaint_id, action, details, performed_by) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, 'reassigned', `Reassigned to ${subAdmin.name} (${subAdmin.category})`, req.user.id);

    const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Reassign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/:id/logs - Get complaint logs
router.get('/:id/logs', authenticateToken, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, u.name as performer_name
      FROM logs l
      LEFT JOIN users u ON l.performed_by = u.id
      WHERE l.complaint_id = ?
      ORDER BY l.created_at ASC
    `).all(req.params.id);

    res.json(logs);
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
