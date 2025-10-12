import { getDb, ensureDepartmentByName } from './connection'

export type User = {
  id: string
  username: string
  password_hash: string
  full_name: string
  role: string
  position?: string
  department?: string
  dob?: string
  created_by?: string
  updated_by?: string
}

export function listUsers(): any[] {
  const db = getDb()
  const rows = db.prepare(`SELECT u.id, u.username, u.full_name as name, u.role, u.position, u.dob, d.name as department, u.created_by as createdBy, u.updated_by as updatedBy FROM users u LEFT JOIN departments d ON d.id = u.department_id ORDER BY u.username`).all() as any
  return rows
}

export function createUser(p: User): any {
  const db = getDb()
  const id = p.id || String(Date.now())
  const deptId = ensureDepartmentByName(p.department || undefined)
  db.prepare(`INSERT INTO users(id, username, password_hash, full_name, role, position, department_id, dob, created_by, updated_by) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(id, p.username, p.password_hash, p.full_name, p.role, p.position || null, deptId, p.dob || null, p.created_by || 'admin', null)
  return { id }
}

export function updateUser(p: User): any {
  const db = getDb()
  const deptId = ensureDepartmentByName(p.department || undefined)
  db.prepare(`UPDATE users SET username=?, full_name=?, role=?, position=?, department_id=?, dob=?, updated_by=? WHERE id=?`).run(
    p.username, p.full_name, p.role, p.position || null, deptId, p.dob || null, p.updated_by || 'admin', p.id
  )
  if (p.password_hash) {
    db.prepare(`UPDATE users SET password_hash=? WHERE id=?`).run(p.password_hash, p.id)
  }
  return { id: p.id }
}

export function deleteUser(id: string) {
  const db = getDb()
  const u = db.prepare(`SELECT username FROM users WHERE id=?`).get(id) as any
  if (u && u.username === 'admin') {
    throw new Error('Không thể xóa tài khoản admin')
  }
  db.prepare(`DELETE FROM users WHERE id=?`).run(id)
}

// Profile API functions
export function getCurrentUser(username: string): any {
  const db = getDb()
  const row = db.prepare(`SELECT u.id, u.username, u.full_name as name, u.role, u.position, u.dob, d.name as department FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.username=?`).get(username) as any
  return row
}

export function updateProfile(username: string, data: { name?: string; department?: string; dob?: string; password?: string }): any {
  const db = getDb()
  
  // Get current user
  const currentUser = getCurrentUser(username)
  if (!currentUser) {
    throw new Error('Người dùng không tồn tại')
  }
  
  const deptId = ensureDepartmentByName(data.department || undefined)
  
  // Update basic info
  db.prepare(`UPDATE users SET full_name=?, department_id=?, dob=?, updated_by=? WHERE username=?`).run(
    data.name || currentUser.name,
    deptId,
    data.dob || currentUser.dob,
    username,
    username
  )
  
  // Update password if provided
  if (data.password) {
    // In real app, hash the password
    const hashedPassword = data.password // TODO: hash password
    db.prepare(`UPDATE users SET password_hash=? WHERE username=?`).run(hashedPassword, username)
  }
  
  return { success: true }
}

export function logout(): any {
  // In a real app, you might want to invalidate tokens, clear sessions, etc.
  return { success: true }
}





