import { getDb } from './connection'

export type Analyte = {
  id: string
  code: string
  name: string
  unit?: string
  decimals?: number
  quality_requirement?: number
  note?: string
  created_by?: string
  updated_by?: string
}

export function listAnalytes(): Analyte[] {
  const db = getDb()
  const stmt = db.prepare(`SELECT id, code, name, unit, decimals, quality_requirement as qualityRequirement, note, created_by as createdBy, updated_by as updatedBy FROM analytes ORDER BY name`)
  return stmt.all() as any
}

export function createAnalyte(p: Analyte): Analyte {
  const db = getDb()
  const id = p.id || String(Date.now())
  db.prepare(`INSERT INTO analytes(id, code, name, unit, decimals, quality_requirement, note, created_by, updated_by) VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(id, p.code, p.name, p.unit || null, p.decimals ?? 2, p.quality_requirement ?? null, p.note || null, p.created_by || 'admin', null)
  return { ...p, id }
}

export function updateAnalyte(p: Analyte): Analyte {
  const db = getDb()
  db.prepare(`UPDATE analytes SET code=?, name=?, unit=?, decimals=?, quality_requirement=?, note=?, updated_by=? WHERE id=?`)
    .run(p.code, p.name, p.unit || null, p.decimals ?? 2, p.quality_requirement ?? null, p.note || null, p.updated_by || 'admin', p.id)
  return p
}

export function deleteAnalyte(id: string) {
  const db = getDb()
  // Xóa tất cả bản ghi liên quan trước khi xóa analyte
  db.prepare(`DELETE FROM qc_limits WHERE analyte_id=?`).run(id)
  db.prepare(`DELETE FROM qc_entries WHERE analyte_id=?`).run(id)
  db.prepare(`DELETE FROM analytes WHERE id=?`).run(id)
}










