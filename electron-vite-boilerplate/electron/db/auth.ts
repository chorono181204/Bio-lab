import { getDb } from './connection'

export function login(username: string, password: string) {
  const db = getDb()
  const stmt = db.prepare(`SELECT u.id, u.username, u.full_name as fullName, u.role, u.position as position, d.name as department
    FROM users u LEFT JOIN departments d ON d.id = u.department_id
    WHERE u.username = ? AND u.password_hash = ?`)
  const user = stmt.get(username, password) as any
  if (!user) return null
  return user
}

export function getStats() {
  const db = getDb()
  const row = {
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c as number,
    devices: db.prepare('SELECT COUNT(*) as c FROM machines').get().c as number,
    analytes: db.prepare('SELECT COUNT(*) as c FROM analytes').get().c as number,
    qcLots: db.prepare('SELECT COUNT(*) as c FROM lots').get().c as number,
    entriesToday: db.prepare("SELECT COUNT(*) as c FROM qc_entries WHERE entry_date = date('now')").get().c as number,
  }
  return row
}





