import { getDb } from './connection'

type LimitIn = {
  analyte_id: string
  lot_id: string
  qc_level_id: string
  apply_to_machine?: boolean
  machine_id?: string
  machine_ids?: string[]
  unit?: string
  decimals?: number
  mean?: number
  sd?: number
  cv?: number
  tea?: number
  cv_ref?: number
  peer_group?: number
  bias_eqa?: number
  qc_name?: string
  exp?: string
  method?: string
  note?: string
  bias_method?: string
  created_by?: string
  updated_by?: string
}

function getAnalyteIdByCode(code: string): string | undefined {
  const db = getDb()
  const row = db.prepare(`SELECT id FROM analytes WHERE code=?`).get(code) as any
  return row?.id
}
function getLotIdByCode(code: string): string | undefined {
  const db = getDb()
  const row = db.prepare(`SELECT id FROM lots WHERE code=?`).get(code) as any
  return row?.id
}
function getLotExpById(id: string): string | undefined {
  const db = getDb()
  const row = db.prepare(`SELECT expiry_date FROM lots WHERE id=?`).get(id) as any
  return row?.expiry_date
}
function getLotExpByCode(code: string): string | undefined {
  const db = getDb()
  const row = db.prepare(`SELECT expiry_date FROM lots WHERE code=?`).get(code) as any
  return row?.expiry_date
}
function getQcLevelIdByName(name: string): string | undefined {
  const db = getDb()
  const row = db.prepare(`SELECT id FROM qc_levels WHERE name=?`).get(name) as any
  return row?.id
}

function calculateCV(mean: number, sd: number): number | null {
  if (!mean || mean === 0 || !sd || sd < 0) return null
  return Number(((sd / mean) * 100).toFixed(2))
}

export function listLimits(): any[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT 
      l.*,
      a.name AS analyte_name,
      a.code AS analyte_code,
      lot.code AS lot_code,
      qc.name AS qc_level_name,
      m.name AS machine_name,
      m.device_code AS machine_code
    FROM qc_limits l
    LEFT JOIN analytes a ON l.analyte_id = a.id
    LEFT JOIN lots lot ON l.lot_id = lot.id
    LEFT JOIN qc_levels qc ON l.qc_level_id = qc.id
    LEFT JOIN machines m ON l.machine_id = m.id
  `).all()
  return rows.map((r: any) => ({
    id: r.id,
    analyteId: r.analyte_code,
    analyteName: r.analyte_name,
    lot: r.lot_code,
    qcLevel: r.qc_level_name,
    applyToMachine: !!r.apply_to_machine,
    machineId: r.machine_id,
    machineName: r.machine_name,
    machineCode: r.machine_code,
    unit: r.unit,
    decimals: r.decimals ?? 2,
    mean: r.mean ?? 0,
    sd: r.sd ?? 0,
    cv: r.cv,
    tea: r.tea,
    cvRef: r.cv_ref,
    peerGroup: r.peer_group,
    biasEqa: r.bias_eqa,
    qcName: r.qc_name,
    exp: r.exp,
    method: r.method,
    note: r.note,
    biasMethod: r.bias_method,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
  }))
}

export function listLimitsByContext(lotId: string, qcLevelIdOrName: string, machineId: string): any[] {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT 
      l.id,
      l.analyte_id,
      a.code AS analyte_code,
      a.name AS analyte_name,
      l.lot_id,
      lot.code AS lot_code,
      l.qc_level_id,
      qc.name AS qc_level_name,
      l.machine_id,
      m.name AS machine_name,
      m.device_code AS machine_code,
      l.unit, l.decimals, l.mean, l.sd, l.cv,
      l.tea, l.cv_ref, l.peer_group, l.bias_eqa, l.bias_method, l.qc_name,
      l.exp, l.method, l.note,
      l.created_by, l.updated_by
    FROM qc_limits l
    LEFT JOIN analytes a ON l.analyte_id = a.id
    LEFT JOIN lots lot ON l.lot_id = lot.id
    LEFT JOIN qc_levels qc ON l.qc_level_id = qc.id
    LEFT JOIN machines m ON l.machine_id = m.id
    WHERE l.lot_id = ? AND (l.qc_level_id = ? OR qc.name = ?) AND (l.machine_id = ? OR l.machine_id IS NULL)
  `)
  const rows = stmt.all(lotId, qcLevelIdOrName, qcLevelIdOrName, machineId) as any[]
  return rows.map(r => ({
    id: r.id,
    analyteId: r.analyte_code,
    analyteName: r.analyte_name,
    lot: r.lot_code,
    qcLevel: r.qc_level_name,
    machineId: r.machine_id,
    machineName: r.machine_name,
    machineCode: r.machine_code,
    unit: r.unit,
    decimals: r.decimals ?? 2,
    mean: r.mean ?? 0,
    sd: r.sd ?? 0,
    cv: r.cv,
    tea: r.tea,
    cvRef: r.cv_ref,
    peerGroup: r.peer_group,
    biasEqa: r.bias_eqa,
    biasMethod: r.bias_method,
    qcName: r.qc_name,
    exp: r.exp,
    method: r.method,
    note: r.note,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
  }))
}

export function listLimitsByContextAnalyte(lotId: string, qcLevelIdOrName: string, machineId: string, analyteIdOrCode: string): any[] {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT 
      l.id,
      l.analyte_id,
      a.code AS analyte_code,
      a.name AS analyte_name,
      l.lot_id,
      lot.code AS lot_code,
      l.qc_level_id,
      qc.name AS qc_level_name,
      l.machine_id,
      m.name AS machine_name,
      m.device_code AS machine_code,
      l.unit, l.decimals, l.mean, l.sd
    FROM qc_limits l
    LEFT JOIN analytes a ON l.analyte_id = a.id
    LEFT JOIN lots lot ON l.lot_id = lot.id
    LEFT JOIN qc_levels qc ON l.qc_level_id = qc.id
    LEFT JOIN machines m ON l.machine_id = m.id
    WHERE l.lot_id = ?
      AND (l.qc_level_id = ? OR qc.name = ?)
      AND (l.machine_id = ? OR l.machine_id IS NULL)
      AND (l.analyte_id = ? OR a.code = ?)
  `)
  const rows = stmt.all(lotId, qcLevelIdOrName, qcLevelIdOrName, machineId, analyteIdOrCode, analyteIdOrCode) as any[]
  return rows.map(r => ({
    id: r.id,
    analyteId: r.analyte_code,
    analyteName: r.analyte_name,
    lot: r.lot_code,
    qcLevel: r.qc_level_name,
    machineId: r.machine_id,
    machineName: r.machine_name,
    machineCode: r.machine_code,
    unit: r.unit,
    decimals: r.decimals ?? 2,
    mean: r.mean ?? 0,
    sd: r.sd ?? 0,
  }))
}

export function listLimitsByLotMachine(lotId: string, machineId: string): any[] {
  const db = getDb()
  
  console.log('='.repeat(80))
  console.log('[Backend] 🔍 listLimitsByLotMachine called with:')
  console.log(`[Backend]   lotId: "${lotId}"`)
  console.log(`[Backend]   machineId: "${machineId}"`)
  
  const stmt = db.prepare(`
    SELECT 
      l.id,
      l.analyte_id,
      a.code AS analyte_code,
      a.name AS analyte_name,
      l.lot_id,
      lot.code AS lot_code,
      l.qc_level_id,
      qc.name AS qc_level_name,
      l.machine_id,
      m.name AS machine_name,
      m.device_code AS machine_code,
      l.unit, l.decimals, l.mean, l.sd, l.cv, l.tea, l.cv_ref, 
      l.peer_group, l.bias_eqa, l.bias_method, l.qc_name,
      l.exp, l.method, l.note
    FROM qc_limits l
    LEFT JOIN analytes a ON l.analyte_id = a.id
    LEFT JOIN lots lot ON l.lot_id = lot.id
    LEFT JOIN qc_levels qc ON l.qc_level_id = qc.id
    LEFT JOIN machines m ON l.machine_id = m.id
    WHERE l.lot_id = ? AND l.machine_id = ? AND qc.name IS NOT NULL
    ORDER BY a.name, qc.name
  `)
  const rows = stmt.all(lotId, machineId) as any[]
  
 
  rows.forEach((row, idx) => {
    console.log(`[Backend]   Row ${idx + 1}:`, {
      id: row.id,
      analyte_id: row.analyte_id,
      analyte_code: row.analyte_code,
      analyte_name: row.analyte_name,
      qc_level_id: row.qc_level_id,
      qc_level_name: row.qc_level_name,
      machine_id: row.machine_id,
      machine_name: row.machine_name,
      machine_code: row.machine_code,
      mean: row.mean,
      sd: row.sd,
      tea: row.tea
    })
  })
  
  // Check for duplicates
  const duplicates = new Map<string, number>()
  rows.forEach(row => {
    const key = `${row.analyte_id}_${row.qc_level_id}_${row.machine_id || 'NULL'}`
    duplicates.set(key, (duplicates.get(key) || 0) + 1)
  })
  
  console.log('[Backend] 🔍 Duplicate analysis:')
  duplicates.forEach((count, key) => {
    if (count > 1) {
      console.log(`[Backend]   ⚠️  DUPLICATE: ${key} appears ${count} times`)
    }
  })
  console.log('='.repeat(80))
  return rows.map(r => ({
    id: r.id,
    analyte_id: r.analyte_id,
    analyte_code: r.analyte_code,
    analyte_name: r.analyte_name,
    lot_id: r.lot_id,
    lot_code: r.lot_code,
    qc_level_id: r.qc_level_id,
    qc_level_name: r.qc_level_name,
    machine_id: r.machine_id,
    machine_name: r.machine_name,
    machine_code: r.machine_code,
    unit: r.unit,
    decimals: r.decimals ?? 2,
    mean: r.mean ?? 0,
    sd: r.sd ?? 0,
    cv: r.cv,
    tea: r.tea ?? 0,
    cv_ref: r.cv_ref,
    peer_group: r.peer_group,
    bias_eqa: r.bias_eqa ?? 0,
    bias_method: r.bias_method,
    qc_name: r.qc_name,
    exp: r.exp,
    method: r.method,
    note: r.note
  }))
}

export function createLimit(p: LimitIn): any {
  const db = getDb()
  if (!p.analyte_id || !p.lot_id || !p.qc_level_id) throw new Error('Invalid analyte_id/lot_id/qc_level_id')
  
  const lotExp = p.exp || getLotExpById(p.lot_id) || null
  const cv = calculateCV(p.mean ?? 0, p.sd ?? 0)
  const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,6)
  
  db.prepare(`INSERT INTO qc_limits(id, analyte_id, lot_id, qc_level_id, apply_to_machine, machine_id, unit, decimals, mean, sd, cv, tea, cv_ref, peer_group, bias_eqa, qc_name, exp, method, note, bias_method, created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, p.analyte_id, p.lot_id, p.qc_level_id, p.apply_to_machine ? 1 : 0, p.machine_id || null, p.unit || null, p.decimals ?? 2, p.mean ?? 0, p.sd ?? 0, cv, p.tea ?? null, p.cv_ref ?? null, p.peer_group ?? null, p.bias_eqa ?? null, p.qc_name || null, lotExp, p.method || null, p.note || null, p.bias_method || null, p.created_by || 'admin'
  )
  return { id }
}

export function updateLimit(p: LimitIn & { id: string }): any {
  const db = getDb()
  
  console.log('[Backend] updateLimit called with:', {
    id: p.id,
    analyte_id: p.analyte_id,
    lot_id: p.lot_id,
    qc_level_id: p.qc_level_id,
    machine_id: p.machine_id
  })
  
  // Check if record exists
  const existing = db.prepare(`SELECT id FROM qc_limits WHERE id = ?`).get(p.id) as any
  
  if (existing) {
    // Calculate CV automatically
    const cv = calculateCV(p.mean ?? 0, p.sd ?? 0)
    
    // Update existing record
    const result = db.prepare(`
      UPDATE qc_limits 
      SET 
        unit = ?,
        decimals = ?,
        mean = ?,
        sd = ?,
        cv = ?,
        tea = ?,
        cv_ref = ?,
        peer_group = ?,
        bias_eqa = ?,
        qc_name = ?,
        exp = ?,
        method = ?,
        note = ?,
        bias_method = ?,
        machine_id = ?,
        updated_by = ?
      WHERE id = ?
    `).run(
      p.unit || null,
      p.decimals ?? 2,
      p.mean ?? 0,
      p.sd ?? 0,
      cv,
      p.tea ?? null,
      p.cv_ref ?? null,
      p.peer_group ?? null,
      p.bias_eqa ?? null,
      p.qc_name || null,
      p.exp || null,
      p.method || null,
      p.note || null,
      p.bias_method || null,
      p.machine_id || null,
      p.updated_by || 'admin',
      p.id
    )
    
    console.log('[Backend] updateLimit result:', result)
  } else {
    // Create new record if doesn't exist
    if (!p.analyte_id || !p.lot_id || !p.qc_level_id) throw new Error('Invalid analyte_id/lot_id/qc_level_id')
    
    const cv = calculateCV(p.mean ?? 0, p.sd ?? 0)
    
    db.prepare(`
      INSERT INTO qc_limits(
        id, analyte_id, lot_id, qc_level_id, apply_to_machine, machine_id,
        unit, decimals, mean, sd, cv, tea, cv_ref, peer_group, bias_eqa, 
        exp, method, note, bias_method, created_by, updated_by
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      p.id,
      p.analyte_id,
      p.lot_id,
      p.qc_level_id,
      p.apply_to_machine ? 1 : 0,
      p.machine_id || null,
      p.unit || null,
      p.decimals ?? 2,
      p.mean ?? 0,
      p.sd ?? 0,
      cv,
      p.tea ?? null,
      p.cv_ref ?? null,
      p.peer_group ?? null,
      p.bias_eqa ?? null,
      p.exp || getLotExpById(p.lot_id) || null,
      p.method || null,
      p.note || null,
      p.bias_method || null,
      p.created_by || 'admin',
      p.updated_by || 'admin'
    )
  }
  
  return { id: p.id }
}

export function deleteLimit(id: string) {
  const db = getDb()
  console.log('Deleting limit with id:', id)
  
  // Chỉ xóa bản ghi có id cụ thể, không xóa tất cả các máy
  const result = db.prepare(`DELETE FROM qc_limits WHERE id=?`).run(id)
  console.log('Delete result:', result)
}

export function batchAddLimits(lot_id: string, qc_level_id: string, analyte_ids: string[], machine_id: string, created_by?: string) {
  const db = getDb()
  if (!lot_id || !qc_level_id || !machine_id) throw new Error('Invalid lot_id/qc_level_id/machine_id')
  const lotExp = getLotExpById(lot_id) || null
  
  const stmt = db.prepare(`INSERT OR IGNORE INTO qc_limits(id, analyte_id, lot_id, qc_level_id, apply_to_machine, machine_id, unit, decimals, mean, sd, exp, created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
  
  for (const analyteId of analyte_ids) {
    // Check if already exists for this specific machine
    const existing = db.prepare(`SELECT id FROM qc_limits WHERE analyte_id=? AND lot_id=? AND qc_level_id=? AND machine_id=?`).get(analyteId, lot_id, qc_level_id, machine_id)
    if (existing) {
      console.log(`Limit already exists for analyte ${analyteId}, lot ${lot_id}, qc ${qc_level_id}, machine ${machine_id}`)
      continue
    }
    
    stmt.run(
      String(Date.now()) + '-' + Math.random().toString(36).slice(2,6), 
      analyteId, 
      lot_id, 
      qc_level_id, 
      1, // apply_to_machine = true
      machine_id, // machine_id cụ thể
      '', 2, 0, 0, 
      lotExp,
      created_by || 'admin'
    )
  }
  return true
}

export function bulkApplyMachines(lot_id: string, qc_level_id: string, machine_ids: string[], analyte_ids?: string[]) {
  const db = getDb()
  if (!lot_id || !qc_level_id) throw new Error('Invalid lot_id/qc_level_id')
  
  // If analyte_ids is empty array, do nothing
  if (analyte_ids && analyte_ids.length === 0) {
    console.log('bulkApplyMachines: Empty analyte_ids, skipping')
    return true
  }

  // Get list of analytes to apply (all or specific ones)
  let analyteIdsToApply: string[] = []
  if (analyte_ids && analyte_ids.length > 0) {
    analyteIdsToApply = analyte_ids
  } else {
    // Apply to all analytes that have seed limits for this lot/qc
    const seedRows = db.prepare(`SELECT DISTINCT analyte_id FROM qc_limits WHERE lot_id=? AND qc_level_id=?`).all(lot_id, qc_level_id) as any[]
    analyteIdsToApply = seedRows.map(r => r.analyte_id)
  }

  if (analyteIdsToApply.length === 0) {
    console.log('bulkApplyMachines: No analytes found to apply')
    return true
  }

  db.transaction(() => {
    const delByAnalyte = db.prepare(`DELETE FROM qc_limits WHERE analyte_id=? AND lot_id=? AND qc_level_id=? AND (machine_id IS NULL OR machine_id IN (${machine_ids.map(() => '?').join(',')}))`)
    const insertStmt = db.prepare(`INSERT INTO qc_limits(id, analyte_id, lot_id, qc_level_id, apply_to_machine, machine_id, unit, decimals, mean, sd, tea, cv_ref, peer_group, bias_eqa, exp, method, note, bias_method, created_by, updated_by)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    
    for (const analyteId of analyteIdsToApply) {
      // Delete generic limits and limits for selected machines only
      delByAnalyte.run(analyteId, lot_id, qc_level_id, ...machine_ids)
      
      // Get seed data
      const sample = db.prepare(`SELECT * FROM qc_limits WHERE analyte_id=? AND lot_id=? AND qc_level_id=? LIMIT 1`).get(analyteId, lot_id, qc_level_id) as any
      if (!sample) continue
      
      // Create per-machine limits
      for (const mid of machine_ids) {
        insertStmt.run(
          String(Date.now()) + '-' + Math.random().toString(36).slice(2,6),
          analyteId, lot_id, qc_level_id, 1, mid,
          sample.unit || null, sample.decimals ?? 2, sample.mean ?? 0, sample.sd ?? 0, sample.tea ?? null, sample.cv_ref ?? null,
          sample.peer_group ?? null, sample.bias_eqa ?? null, sample.exp || null, sample.method || null, sample.note || null, sample.bias_method || null,
          sample.created_by || 'admin', sample.updated_by || null
        )
      }
    }
  })

  return true
}
