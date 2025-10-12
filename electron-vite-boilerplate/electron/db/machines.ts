import { getDb, getLotIdByCode } from './connection'

export type Machine = {
  id: string
  device_code: string
  model: string
  serial: string
  name: string
  status?: number
  note?: string
  lots?: string[] // lot codes
  created_by?: string
  updated_by?: string
}

export function listMachines(): Machine[] {
  const db = getDb()
  const rows = db.prepare(`SELECT id, device_code, name, model, serial, status, note, created_by as createdBy, updated_by as updatedBy FROM machines ORDER BY device_code`).all() as any[]
  return rows.map((r: any) => {
    const lots = db.prepare(`SELECT l.code FROM machine_lots ml JOIN lots l ON l.id = ml.lot_id WHERE ml.machine_id=?`).all(r.id).map((x:any)=> x.code)
    return { ...r, lots }
  }) as any
}

export function createMachine(p: Machine): Machine {
  const db = getDb()
  const id = p.id || String(Date.now())
  db.prepare(`INSERT INTO machines(id, device_code, name, model, serial, status, note, created_by, updated_by) VALUES(?,?,?,?,?,?,?, ?, ? )`)
    .run(id, p.device_code, p.name, p.model, p.serial, p.status ?? 1, p.note || null, p.created_by || 'admin', null)
  if (Array.isArray(p.lots)) {
    for (const code of p.lots) {
      const lid = getLotIdByCode(code)
      if (lid) db.prepare(`INSERT OR IGNORE INTO machine_lots(machine_id, lot_id) VALUES(?,?)`).run(id, lid)
    }
  }
  return { ...p, id }
}

export function updateMachine(p: Machine): Machine {
  const db = getDb()
  db.prepare(`UPDATE machines SET device_code=?, name=?, model=?, serial=?, status=?, note=?, updated_by=? WHERE id=?`)
    .run(p.device_code, p.name, p.model, p.serial, p.status ?? 1, p.note || null, p.updated_by || 'admin', p.id)
  db.prepare(`DELETE FROM machine_lots WHERE machine_id=?`).run(p.id)
  if (Array.isArray(p.lots)) {
    for (const code of p.lots) {
      const lid = getLotIdByCode(code)
      if (lid) db.prepare(`INSERT OR IGNORE INTO machine_lots(machine_id, lot_id) VALUES(?,?)`).run(p.id, lid)
    }
  }
  return p
}

export function deleteMachine(id: string) {
  const db = getDb()
  // Xóa tất cả bản ghi liên quan trước khi xóa machine
  db.prepare(`DELETE FROM qc_limits WHERE machine_id=?`).run(id)
  db.prepare(`DELETE FROM qc_entries WHERE machine_id=?`).run(id)
  db.prepare(`DELETE FROM machine_lots WHERE machine_id=?`).run(id)
  db.prepare(`DELETE FROM machines WHERE id=?`).run(id)
}

export function listMachinesSimple(): { id: string; device_code: string; name: string }[] {
  const db = getDb()
  return db.prepare(`SELECT id, device_code, name FROM machines ORDER BY device_code`).all() as any
}





