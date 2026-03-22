const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'grievance.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'sub-admin', 'admin')),
    category TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'resolved', 'escalated')),
    is_anonymous INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER,
    assigned_to INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    original_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (complaint_id) REFERENCES complaints(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    performed_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (complaint_id) REFERENCES complaints(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
  );
`);

// Seed data
function seedDatabase() {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@campus.edu');
  if (existingAdmin) return; // Already seeded

  const hashedPassword = (pwd) => bcrypt.hashSync(pwd, 10);

  const insertUser = db.prepare('INSERT INTO users (name, email, password, role, category) VALUES (?, ?, ?, ?, ?)');

  const seedUsers = db.transaction(() => {
    // Admin
    insertUser.run('Main Admin', 'admin@campus.edu', hashedPassword('admin123'), 'admin', null);

    // Sub-admins
    insertUser.run('Academic Head', 'academic@campus.edu', hashedPassword('sub123'), 'sub-admin', 'Academic');
    insertUser.run('Infrastructure Head', 'infra@campus.edu', hashedPassword('sub123'), 'sub-admin', 'Infrastructure');
    insertUser.run('Hostel Warden', 'hostel@campus.edu', hashedPassword('sub123'), 'sub-admin', 'Hostel');
    insertUser.run('Discipline Head', 'discipline@campus.edu', hashedPassword('sub123'), 'sub-admin', 'Discipline');
    insertUser.run('Admin Officer', 'admin_dept@campus.edu', hashedPassword('sub123'), 'sub-admin', 'Administration');
    insertUser.run('General Affairs', 'others@campus.edu', hashedPassword('sub123'), 'sub-admin', 'Others');

    // Students
    insertUser.run('Rahul Sharma', 'student1@campus.edu', hashedPassword('student123'), 'student', null);
    insertUser.run('Priya Patel', 'student2@campus.edu', hashedPassword('student123'), 'student', null);
  });

  seedUsers();
  console.log('Database seeded with default users.');
}

seedDatabase();

module.exports = db;
