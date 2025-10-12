import { getDb, getLotIdByCode, getQcLevelIdByName, getMachineIdByCode } from './connection'

export type Lot = {
  id: string
  lot_name: string
  code: string
  status?: number
  received_date?: string
  expiry_date?: string
  note?: string
  machines?: string[] // use machines.device_code
  qcLevels?: string[] // use qc_levels.name
  created_by?: string
  updated_by?: string
}

export function listLots(): Lot[] {
  const db = getDb()
  const lots = db.prepare(`SELECT id, lot_name, code, status, received_date, expiry_date, note, created_by as createdBy, updated_by as updatedBy FROM lots ORDER BY created_at DESC`).all() as any[]
  const out: Lot[] = []
  for (const l of lots) {
    const machines = db.prepare(`SELECT m.device_code FROM machine_lots ml JOIN machines m ON m.id = ml.machine_id WHERE ml.lot_id=?`).all(l.id).map((r: any)=> r.device_code)
    const qcLevels = db.prepare(`SELECT q.name FROM lot_qc_levels lq JOIN qc_levels q ON q.id = lq.qc_level_id WHERE lq.lot_id=?`).all(l.id).map((r: any)=> r.name)
    out.push({
      id: l.id, lot_name: l.lot_name, code: l.code, status: l.status, received_date: l.received_date, expiry_date: l.expiry_date, note: l.note, machines, qcLevels,
      created_by: l.createdBy, updated_by: l.updatedBy
    })
  }
  return out
}

export function createLot(p: Lot): Lot {
  const db = getDb()
  const id = p.id || String(Date.now())
  db.prepare(`INSERT INTO lots(id, lot_name, code, status, received_date, expiry_date, note, created_by, updated_by) VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(id, p.lot_name, p.code, p.status ?? 1, p.received_date || null, p.expiry_date || null, p.note || null, p.created_by || 'admin', null)
  if (Array.isArray(p.machines)) {
    for (const code of p.machines) {
      const mid = getMachineIdByCode(code)
      if (mid) db.prepare(`INSERT OR IGNORE INTO machine_lots(machine_id, lot_id) VALUES(?,?)`).run(mid, id)
    }
  }
  if (Array.isArray(p.qcLevels)) {
    for (const name of p.qcLevels) {
      const qid = getQcLevelIdByName(name) || name
      db.prepare(`INSERT OR IGNORE INTO lot_qc_levels(lot_id, qc_level_id) VALUES(?,?)`).run(id, qid)
    }
  }
  return { ...p, id }
}

export function updateLot(p: Lot): Lot {
  const db = getDb()
  db.prepare(`UPDATE lots SET lot_name=?, code=?, status=?, received_date=?, expiry_date=?, note=?, updated_by=? WHERE id=?`)
    .run(p.lot_name, p.code, p.status ?? 1, p.received_date || null, p.expiry_date || null, p.note || null, p.updated_by || 'admin', p.id)
  db.prepare(`DELETE FROM machine_lots WHERE lot_id=?`).run(p.id)
  if (Array.isArray(p.machines)) {
    for (const code of p.machines) {
      const mid = getMachineIdByCode(code)
      if (mid) db.prepare(`INSERT OR IGNORE INTO machine_lots(machine_id, lot_id) VALUES(?,?)`).run(mid, p.id)
    }
  }
  db.prepare(`DELETE FROM lot_qc_levels WHERE lot_id=?`).run(p.id)
  if (Array.isArray(p.qcLevels)) {
    for (const name of p.qcLevels) {
      const qid = getQcLevelIdByName(name) || name
      db.prepare(`INSERT OR IGNORE INTO lot_qc_levels(lot_id, qc_level_id) VALUES(?,?)`).run(p.id, qid)
    }
  }
  return p
}

export function deleteLot(id: string) {
  const db = getDb()
  // Xóa tất cả bản ghi liên quan trước khi xóa lot
  db.prepare(`DELETE FROM qc_limits WHERE lot_id=?`).run(id)
  db.prepare(`DELETE FROM qc_entries WHERE lot_id=?`).run(id)
  db.prepare(`DELETE FROM machine_lots WHERE lot_id=?`).run(id)
  db.prepare(`DELETE FROM lot_machines WHERE lot_id=?`).run(id) // deprecated table
  db.prepare(`DELETE FROM lot_qc_levels WHERE lot_id=?`).run(id)
  db.prepare(`DELETE FROM lots WHERE id=?`).run(id)
}

export function listMachinesByLot(lotCode: string): { id: string; device_code: string; name: string }[] {
  const db = getDb()
  const lotId = getLotIdByCode(lotCode)
  if (!lotId) return []
  const result = db.prepare(`
    SELECT m.id, m.device_code, m.name 
    FROM machines m
    JOIN machine_lots ml ON m.id = ml.machine_id
    WHERE ml.lot_id = ?
    ORDER BY m.device_code
  `).all(lotId) as any
  return result
}

export function listMachinesByLotId(lotId: string): { id: string; device_code: string; name: string }[] {
  const db = getDb()
  if (!lotId) return []
  const result = db.prepare(`
    SELECT m.id, m.device_code, m.name 
    FROM machines m
    JOIN machine_lots ml ON m.id = ml.machine_id
    WHERE ml.lot_id = ?
    ORDER BY m.device_code
  `).all(lotId) as any
  return result
}

export function listQcLevelsSimple(): { id: string; name: string }[] {
  const db = getDb()
  return db.prepare(`SELECT id, name FROM qc_levels ORDER BY name`).all() as any
}

export function listLotsSimple(): { id: string; code: string }[] {
  const db = getDb()
  return db.prepare(`SELECT id, code FROM lots ORDER BY code`).all() as any
}


