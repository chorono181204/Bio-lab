import { getDb } from './connection'

export type ViolationIn = {
  lot_id: string
  machine_id: string
  qc_level_id: string
  analyte_id: string
  entry_date: string
  rule_id: string
  content: string
}

export function listViolationsByContext(lot_id: string, machine_id: string, from?: string | null, to?: string | null) {
  const db = getDb()
  let sql = `SELECT v.id, v.lot_id, v.machine_id, v.qc_level_id, v.analyte_id, v.entry_date, v.rule_id, v.content,
                    v.action, v.staff, v.status, a.name AS analyte_name, a.code AS analyte_code,
                    wr.code AS rule_code, wr.name AS rule_name
               FROM westgard_violations v
               LEFT JOIN analytes a ON a.id = v.analyte_id
               LEFT JOIN westgard_rules wr ON wr.id = v.rule_id
              WHERE v.lot_id = ? AND v.machine_id = ?`
  const args: any[] = [lot_id, machine_id]
  if (from) { sql += ' AND v.entry_date >= ?'; args.push(from) }
  if (to) { sql += ' AND v.entry_date <= ?'; args.push(to) }
  sql += ' ORDER BY v.entry_date ASC, v.created_at ASC'
  return db.prepare(sql).all(...args)
}

export function createViolation(p: ViolationIn) {
  const db = getDb()
  const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,6)
  db.prepare(`INSERT OR IGNORE INTO westgard_violations(id, lot_id, machine_id, qc_level_id, analyte_id, entry_date, rule_id, content)
              VALUES(?,?,?,?,?,?,?,?)`).run(id, p.lot_id, p.machine_id, p.qc_level_id, p.analyte_id, p.entry_date, p.rule_id, p.content)
  return { id }
}

export function updateViolationAction(id: string, action?: string | null, staff?: string | null, status?: string | null) {
  const db = getDb()
  db.prepare(`UPDATE westgard_violations SET action=?, staff=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(action || null, staff || null, status || null, id)
  return { id }
}


