import { getDb } from './connection'

export type FormRecord = {
  id: string
  name: string
  code: string
  issue_round?: string
  issue_date?: string
  created_by?: string
  updated_by?: string
}

export function listForms(): FormRecord[] {
  const db = getDb()
  const stmt = db.prepare(`SELECT id, name, code, issue_round as issueRound, issue_date as issueDate, created_by as createdBy, updated_by as updatedBy FROM forms ORDER BY created_at DESC`)
  return stmt.all() as any
}

export function createForm(payload: FormRecord): FormRecord {
  const db = getDb()
  const id = payload.id || String(Date.now())
  db.prepare(`INSERT INTO forms(id, name, code, issue_round, issue_date, created_by, updated_by) VALUES(?,?,?,?,?,?,?)`)
    .run(id, payload.name, payload.code, payload.issue_round || null, payload.issue_date || null, payload.created_by || 'admin', null)
  return { ...payload, id }
}

export function updateForm(payload: FormRecord): FormRecord {
  const db = getDb()
  db.prepare(`UPDATE forms SET name=?, code=?, issue_round=?, issue_date=?, updated_by=? WHERE id=?`)
    .run(payload.name, payload.code, payload.issue_round || null, payload.issue_date || null, payload.updated_by || 'admin', payload.id)
  return payload
}

export function deleteForm(id: string) {
  const db = getDb()
  db.prepare(`DELETE FROM forms WHERE id=?`).run(id)
}


























