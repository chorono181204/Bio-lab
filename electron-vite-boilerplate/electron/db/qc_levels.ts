import { getDb } from './connection'

type QcLevelIn = {
  id?: string
  name: string
  created_by?: string
  updated_by?: string
}

export function listQcLevels(): any[] {
  const db = getDb()
  return db.prepare(`SELECT id, name FROM qc_levels ORDER BY name`).all() as any[]
}

export function createQcLevel(p: QcLevelIn): any {
  const db = getDb()
  const id = p.id || String(Date.now())
  db.prepare(`INSERT INTO qc_levels(id, name) VALUES(?,?)`)
    .run(id, p.name)
  return { id }
}

export function updateQcLevel(p: QcLevelIn & { id: string }): any {
  const db = getDb()
  db.prepare(`UPDATE qc_levels SET name=? WHERE id=?`)
    .run(p.name, p.id)
  return { id: p.id }
}

export function deleteQcLevel(id: string) {
  const db = getDb()
  
  // Check if qc_level is being used in qc_limits
  const hasLimits = db.prepare(`SELECT 1 FROM qc_limits WHERE qc_level_id = ? LIMIT 1`).get(id)
  if (hasLimits) {
    throw new Error('Không thể xóa mức QC đang được sử dụng trong thiết lập QC')
  }
  
  // Check if qc_level is being used in lot_qc_levels
  const hasLotQcLevels = db.prepare(`SELECT 1 FROM lot_qc_levels WHERE qc_level_id = ? LIMIT 1`).get(id)
  if (hasLotQcLevels) {
    throw new Error('Không thể xóa mức QC đang được sử dụng trong lô QC')
  }
  
  db.prepare(`DELETE FROM qc_levels WHERE id=?`).run(id)
}

// Lookup QC levels linked to a specific lot via existing qc_limits
export function listQcLevelsByLotId(lotId: string): any[] {
  const db = getDb()
  if (!lotId) return []
  // Use the explicit lot ↔ qc_levels mapping so levels are available even before limits exist
  return db.prepare(`
    SELECT ql.id, ql.name
    FROM lot_qc_levels lq
    JOIN qc_levels ql ON ql.id = lq.qc_level_id
    WHERE lq.lot_id = ?
    ORDER BY ql.name
  `).all(lotId) as any[]
}
