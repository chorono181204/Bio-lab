import { getDb } from './connection'

export type EntryIn = {
  analyte_id: string
  lot_id: string
  qc_level_id: string
  machine_id: string
  entry_date?: string
  value: number
  note?: string
  created_by?: string
}

export function listEntriesByContext(lot_id: string, qc_level_id: string, machine_id: string, start_date?: string, end_date?: string) {
  const db = getDb()
  if (!lot_id || !qc_level_id || !machine_id) return []
  
  console.log('Backend - listEntriesByContext called with:', {
    lot_id,
    qc_level_id, 
    machine_id,
    start_date,
    end_date
  })
  
  let whereClause = 'WHERE e.lot_id = ? AND e.qc_level_id = ? AND e.machine_id = ?'
  const params = [lot_id, qc_level_id, machine_id]
  
  if (start_date) {
    whereClause += ' AND e.entry_date >= ?'
    params.push(start_date)
  }
  if (end_date) {
    whereClause += ' AND e.entry_date <= ?'
    params.push(end_date)
  }
  
  console.log('Backend - SQL query:', whereClause)
  console.log('Backend - params:', params)
  
  const rows = db.prepare(`
    SELECT e.id, e.analyte_id, a.code as analyte_code, a.name as analyte_name,
           e.lot_id, e.qc_level_id, e.machine_id, e.entry_date, e.value, e.created_at
    FROM qc_entries e
    JOIN analytes a ON a.id = e.analyte_id
    ${whereClause}
    ORDER BY e.created_at ASC, e.id ASC
  `).all(...params)
  return rows
}

export function batchCreateEntries(entries: EntryIn[]) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO qc_entries(id, analyte_id, lot_id, qc_level_id, machine_id, entry_date, value, note, created_by)
    VALUES(?,?,?,?,?,?,?,?,?)
  `)
  const now = new Date()
  const insert = db.transaction((items: EntryIn[]) => {
    for (const it of items) {
      const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,6)
      // Normalize analyte_id (accept analyte code or id)
      const analyteRow = db.prepare(`SELECT id FROM analytes WHERE id = ? OR code = ?`).get(it.analyte_id, it.analyte_id) as any
      const analyteId = analyteRow?.id || it.analyte_id
      // Normalize qc_level_id (accept name or id)
      const qcRow = db.prepare(`SELECT id FROM qc_levels WHERE id = ? OR name = ?`).get(it.qc_level_id, it.qc_level_id) as any
      const qcLevelId = qcRow?.id || it.qc_level_id
      stmt.run(
        id,
        analyteId,
        it.lot_id,
        qcLevelId,
        it.machine_id,
        it.entry_date || now.toISOString().slice(0,10),
        it.value,
        it.note || null,
        it.created_by || 'admin'
      )
    }
  })
  insert(entries)
  return true
}

export function updateEntry(id: string, value: number, note?: string) {
  const db = getDb()
  db.prepare(`UPDATE qc_entries SET value=?, note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(value, note || null, id)
  return { id }
}

export function deleteEntry(id: string) {
  const db = getDb()
  db.prepare(`DELETE FROM qc_entries WHERE id=?`).run(id)
  return true
}


