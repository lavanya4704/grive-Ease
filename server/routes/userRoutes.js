const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../auth');

const router = express.Router();

// GET /api/users/sub-admins - List all sub-admins (for admin reassignment)
router.get('/sub-admins', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const subAdmins = db.prepare(
      'SELECT id, name, email, category FROM users WHERE role = ?'
    ).all('sub-admin');
    res.json(subAdmins);
  } catch (err) {
    console.error('List sub-admins error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
