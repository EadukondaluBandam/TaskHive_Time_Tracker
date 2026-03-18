import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

const dbPath = path.join(app.getPath('userData'), 'taskhive.db')

const db = new Database(dbPath)

db.exec(`
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  app_name TEXT,
  window_title TEXT,
  website TEXT,
  start_time TEXT,
  end_time TEXT,
  duration INTEGER,
  synced INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS desktop_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id TEXT,
  name TEXT,
  email TEXT,
  role TEXT,
  department TEXT,
  company_name TEXT,
  login_time TEXT
);
`)

function ensureColumn(tableName, columnName, columnDefinition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all()
  if (!columns.some((column) => column.name === columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`).run()
  }
}

ensureColumn('activity_logs', 'email', 'TEXT')
ensureColumn('activity_logs', 'window_title', 'TEXT')
ensureColumn('desktop_session', 'user_id', 'TEXT')
ensureColumn('desktop_session', 'name', 'TEXT')
ensureColumn('desktop_session', 'email', 'TEXT')
ensureColumn('desktop_session', 'role', 'TEXT')
ensureColumn('desktop_session', 'department', 'TEXT')
ensureColumn('desktop_session', 'company_name', 'TEXT')
ensureColumn('desktop_session', 'login_time', 'TEXT')

export function insertLog(email, appName, windowTitle, site, start, end, duration) {
  db.prepare(`
    INSERT INTO activity_logs
    (email, app_name, window_title, website, start_time, end_time, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(email, appName, windowTitle, site, start, end, duration)
}

export function getAllLogs() {
  return db.prepare(`
    SELECT
      id,
      email,
      app_name AS appName,
      window_title AS windowTitle,
      website,
      start_time AS startTime,
      end_time AS endTime,
      duration
    FROM activity_logs
    ORDER BY id DESC
  `).all()
}

export function getLogsByEmail(email) {
  return db.prepare(`
    SELECT
      id,
      email,
      app_name AS appName,
      window_title AS windowTitle,
      website,
      start_time AS startTime,
      end_time AS endTime,
      duration
    FROM activity_logs
    WHERE lower(email) = lower(?)
    ORDER BY id DESC
  `).all(email)
}

export function saveDesktopSession(user) {
  db.prepare('DELETE FROM desktop_session').run()
  db.prepare(`
    INSERT INTO desktop_session
    (id, user_id, name, email, role, department, company_name, login_time)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    user.name,
    user.email,
    user.role,
    user.department ?? '',
    user.companyName ?? '',
    new Date().toISOString()
  )
}

export function getDesktopSession() {
  const session = db.prepare(`
    SELECT
      user_id AS id,
      name,
      email,
      role,
      department,
      company_name AS companyName,
      login_time AS loginTime
    FROM desktop_session
    WHERE id = 1
  `).get()

  return session || null
}

export function clearDesktopSession() {
  db.prepare('DELETE FROM desktop_session').run()
}

export default db
