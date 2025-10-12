import { getDb } from './connection'

export type WestgardRule = {
  id: string
  code: string
  name: string
  description?: string
  severity: 'warning' | 'error' | 'critical'
  is_active: number
  type: string
  window_size?: number | null
  threshold_sd?: number | null
  consecutive_points?: number | null
  same_side?: number | null
  opposite_sides?: number | null
  sum_abs_z_gt?: number | null
  expression?: string | null
  custom_message?: string | null
  order_index?: number | null
  qc_levels?: string[]
}

export function listWestgardRules(): WestgardRule[] {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM westgard_rules ORDER BY order_index, code`).all() as any[]
  const mapLevels = db.prepare(`SELECT rule_id, qc_level_id FROM westgard_rule_qc_levels`).all() as any[]
  const ruleIdToLevels = new Map<string, string[]>()
  for (const r of mapLevels) {
    const list = ruleIdToLevels.get(r.rule_id) || []
    list.push(r.qc_level_id)
    ruleIdToLevels.set(r.rule_id, list)
  }
  return rows.map(r => ({ ...r, qc_levels: ruleIdToLevels.get(r.id) || [] }))
}

export function upsertWestgardRule(p: Partial<WestgardRule> & { id: string }): { id: string } {
  const db = getDb()
  const exists = db.prepare(`SELECT 1 FROM westgard_rules WHERE id=?`).get(p.id)
  const cols = [
    'id','code','name','description','severity','is_active','type','window_size','threshold_sd','consecutive_points','same_side','opposite_sides','sum_abs_z_gt','expression','custom_message','order_index','updated_by'
  ]
  if (exists) {
    db.prepare(`UPDATE westgard_rules SET 
      code=?, name=?, description=?, severity=?, is_active=?, type=?, window_size=?, threshold_sd=?, consecutive_points=?, same_side=?, opposite_sides=?, sum_abs_z_gt=?, expression=?, custom_message=?, order_index=?, updated_by=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      p.code, p.name, p.description || null, p.severity, p.is_active ?? 1, p.type, p.window_size ?? null, p.threshold_sd ?? null, p.consecutive_points ?? null, p.same_side ?? null, p.opposite_sides ?? null, p.sum_abs_z_gt ?? null, p.expression ?? null, p.custom_message ?? null, p.order_index ?? 0, 'admin', p.id
    )
  } else {
    db.prepare(`INSERT INTO westgard_rules(
      ${cols.join(',')}, created_by
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      p.id, p.code, p.name, p.description || null, p.severity, p.is_active ?? 1, p.type, p.window_size ?? null, p.threshold_sd ?? null, p.consecutive_points ?? null, p.same_side ?? null, p.opposite_sides ?? null, p.sum_abs_z_gt ?? null, p.expression ?? null, p.custom_message ?? null, p.order_index ?? 0, 'admin', 'admin'
    )
  }
  return { id: p.id }
}

export function setWestgardRuleQcLevels(ruleId: string, qcLevelIds: string[]) {
  const db = getDb()
  db.transaction(() => {
    db.prepare(`DELETE FROM westgard_rule_qc_levels WHERE rule_id=?`).run(ruleId)
    const stmt = db.prepare(`INSERT INTO westgard_rule_qc_levels(rule_id, qc_level_id) VALUES(?,?)`)
    for (const q of qcLevelIds) stmt.run(ruleId, q)
  })()
}

export function deleteWestgardRule(ruleId: string) {
  const db = getDb()
  db.transaction(() => {
    db.prepare(`DELETE FROM westgard_rule_qc_levels WHERE rule_id=?`).run(ruleId)
    db.prepare(`DELETE FROM westgard_rules WHERE id=?`).run(ruleId)
  })()
}


