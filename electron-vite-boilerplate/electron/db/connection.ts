// Load better-sqlite3 at runtime to avoid bundler issues with native .node
function loadBetterSqlite3(): any {
  // eslint-disable-next-line no-eval
  const req = eval('require') as NodeRequire
  return req('better-sqlite3')
}
import { join } from 'path'
import { app } from 'electron'

let db: any = null

export function getDb(): any {
  if (!db) throw new Error('DB not initialized')
  return db
}

export function initDb(): any {
  if (db) return db
  const userData = app.getPath('userData')
  const file = join(userData, 'iqc.sqlite')
  const BetterSqlite3 = loadBetterSqlite3()
  db = new BetterSqlite3(file)
  db.pragma('journal_mode = WAL')

  const exec = (sql: string) => db!.exec(sql)

  // Core dictionaries
  exec(`CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`)

  exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','manager','user')),
    position TEXT,
    department_id TEXT,
    dob TEXT,
    note TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`)

  exec(`CREATE TABLE IF NOT EXISTS analytes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    unit TEXT,
    decimals INTEGER DEFAULT 2,
    quality_requirement REAL,
    note TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  exec(`CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    device_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    serial TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    note TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  exec(`CREATE TABLE IF NOT EXISTS lots (
    id TEXT PRIMARY KEY,
    lot_name TEXT NOT NULL,
    code TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    received_date TEXT,
    expiry_date TEXT,
    note TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  // Deprecated alias kept for backward compat: we will use machine_lots everywhere
  exec(`CREATE TABLE IF NOT EXISTS lot_machines (
    lot_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lot_id, machine_id)
  )`)

  exec(`CREATE TABLE IF NOT EXISTS qc_levels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`)

  exec(`CREATE TABLE IF NOT EXISTS machine_lots (
    machine_id TEXT NOT NULL,
    lot_id TEXT NOT NULL,
    PRIMARY KEY (machine_id, lot_id)
  )`)

  exec(`CREATE TABLE IF NOT EXISTS lot_qc_levels (
    lot_id TEXT NOT NULL,
    qc_level_id TEXT NOT NULL,
    PRIMARY KEY (lot_id, qc_level_id)
  )`)

  exec(`CREATE TABLE IF NOT EXISTS qc_limits (
    id TEXT PRIMARY KEY,
    analyte_id TEXT NOT NULL,
    lot_id TEXT NOT NULL,
    qc_level_id TEXT NOT NULL,
    apply_to_machine INTEGER NOT NULL DEFAULT 0,
    machine_id TEXT,
    unit TEXT,
    decimals INTEGER DEFAULT 2,
    mean REAL NOT NULL DEFAULT 0,
    sd REAL NOT NULL DEFAULT 0,
    tea REAL,
    cv_ref REAL,
    peer_group REAL,
    bias_eqa REAL,
    bias_method TEXT,
    exp TEXT,
    method TEXT,
    note TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME,
    UNIQUE (analyte_id, lot_id, qc_level_id, machine_id),
    FOREIGN KEY (machine_id) REFERENCES machines(id)
  )`)

  // Add new columns if they don't exist (migration)
  try {
    exec(`ALTER TABLE qc_limits ADD COLUMN cv REAL`)
  } catch (e) {
    // Column already exists, ignore
  }
  
  try {
    exec(`ALTER TABLE qc_limits ADD COLUMN qc_name TEXT`)
  } catch (e) {
    // Column already exists, ignore
  }

  // Migrate to UNIQUE (analyte_id, lot_id, qc_level_id, machine_id)
  try {
    const sql = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='qc_limits'`).get() as any
    const createSql: string = sql?.sql || ''
    const missingMachineInUnique = /UNIQUE\s*\(\s*analyte_id\s*,\s*lot_id\s*,\s*qc_level_id\s*\)/i.test(createSql) && !/qc_level_id\s*,\s*machine_id\s*\)/i.test(createSql)
    if (missingMachineInUnique) {
      db.transaction(() => {
        exec(`CREATE TABLE IF NOT EXISTS qc_limits_v2 (
          id TEXT PRIMARY KEY,
          analyte_id TEXT NOT NULL,
          lot_id TEXT NOT NULL,
          qc_level_id TEXT NOT NULL,
          apply_to_machine INTEGER NOT NULL DEFAULT 0,
          machine_id TEXT,
          unit TEXT,
          decimals INTEGER DEFAULT 2,
          mean REAL NOT NULL DEFAULT 0,
          sd REAL NOT NULL DEFAULT 0,
          tea REAL,
          cv_ref REAL,
          peer_group REAL,
          bias_eqa REAL,
          bias_method TEXT,
          exp TEXT,
          method TEXT,
          note TEXT,
          created_by TEXT, updated_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME,
          UNIQUE (analyte_id, lot_id, qc_level_id, machine_id),
          FOREIGN KEY (machine_id) REFERENCES machines(id)
        )`)
        // copy data; deduplicate by (analyte_id, lot_id, qc_level_id, machine_id)
        exec(`INSERT OR IGNORE INTO qc_limits_v2(
          id, analyte_id, lot_id, qc_level_id, apply_to_machine, machine_id, unit, decimals, mean, sd, tea, cv_ref, peer_group, bias_eqa, bias_method, exp, method, note, created_by, updated_by, created_at, updated_at
        ) SELECT id, analyte_id, lot_id, qc_level_id, apply_to_machine, machine_id, unit, decimals, mean, sd, tea, cv_ref, peer_group, bias_eqa, bias_method, exp, method, note, created_by, updated_by, created_at, updated_at FROM qc_limits`)
        exec(`DROP TABLE qc_limits`)
        exec(`ALTER TABLE qc_limits_v2 RENAME TO qc_limits`)
      })()
    }
  } catch {}

  exec(`CREATE TABLE IF NOT EXISTS qc_entries (
    id TEXT PRIMARY KEY,
    analyte_id TEXT NOT NULL,
    lot_id TEXT NOT NULL,
    qc_level_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    entry_date TEXT NOT NULL,
    value REAL NOT NULL,
    note TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  // Westgard rules definitions
  exec(`CREATE TABLE IF NOT EXISTS westgard_rules (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('warning','error','critical')),
    is_active INTEGER NOT NULL DEFAULT 1,
    type TEXT NOT NULL,                -- e.g. 1_2s, 1_3s, 2_2s, R_4s, 4_1s, 10x, custom
    window_size INTEGER,               -- how many most recent points to consider
    threshold_sd REAL,                 -- SD threshold (e.g. 3 for 1-3s, 2 for 2-2s, 1 for 4-1s)
    consecutive_points INTEGER,        -- number of consecutive points meeting the condition
    same_side INTEGER,                 -- 1 if points must be on same side of mean
    opposite_sides INTEGER,            -- 1 if two consecutive points must be on opposite sides
    sum_abs_z_gt REAL,                 -- sum of |z| greater than value (e.g. 4 for R-4s)
    expression TEXT,                   -- optional custom expression/DSL
    custom_message TEXT,
    order_index INTEGER DEFAULT 0,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  exec(`CREATE TABLE IF NOT EXISTS westgard_rule_qc_levels (
    rule_id TEXT NOT NULL,
    qc_level_id TEXT NOT NULL,
    PRIMARY KEY (rule_id, qc_level_id)
  )`)

  // Violations store
  exec(`CREATE TABLE IF NOT EXISTS westgard_violations (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    qc_level_id TEXT NOT NULL,
    analyte_id TEXT NOT NULL,
    entry_date TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    content TEXT NOT NULL,
    action TEXT,
    staff TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (rule_id) REFERENCES westgard_rules(id),
    UNIQUE(lot_id, machine_id, qc_level_id, analyte_id, entry_date, rule_id)
  )`)
  
  // Migration: rename rule_code to rule_id for existing tables
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(westgard_violations)`).all() as any[]
    const hasRuleCode = tableInfo.some((col: any) => col.name === 'rule_code')
    const hasRuleId = tableInfo.some((col: any) => col.name === 'rule_id')
    
    if (hasRuleCode && !hasRuleId) {
      console.log('[Migration] Converting westgard_violations.rule_code to rule_id')
      db.transaction(() => {
        // Create new table with correct schema
        exec(`CREATE TABLE westgard_violations_new (
          id TEXT PRIMARY KEY,
          lot_id TEXT NOT NULL,
          machine_id TEXT NOT NULL,
          qc_level_id TEXT NOT NULL,
          analyte_id TEXT NOT NULL,
          entry_date TEXT NOT NULL,
          rule_id TEXT NOT NULL,
          content TEXT NOT NULL,
          action TEXT,
          staff TEXT,
          status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (rule_id) REFERENCES westgard_rules(id),
          UNIQUE(lot_id, machine_id, qc_level_id, analyte_id, entry_date, rule_id)
        )`)
        
        // Copy data, mapping rule_code to rule_id via westgard_rules.code
        // Only copy rows where rule_code can be mapped to a valid rule_id
        exec(`INSERT OR IGNORE INTO westgard_violations_new (
          id, lot_id, machine_id, qc_level_id, analyte_id, entry_date, rule_id, content, action, staff, status, created_at, updated_at
        )
        SELECT 
          v.id, v.lot_id, v.machine_id, v.qc_level_id, v.analyte_id, v.entry_date, 
          wr.id as rule_id,
          v.content, v.action, v.staff, v.status, v.created_at, v.updated_at
        FROM westgard_violations v
        INNER JOIN westgard_rules wr ON wr.code = v.rule_code`)
        
        // Drop old table and rename new one
        exec(`DROP TABLE westgard_violations`)
        exec(`ALTER TABLE westgard_violations_new RENAME TO westgard_violations`)
      })()
      console.log('[Migration] Completed westgard_violations migration')
    }
  } catch (e) {
    console.error('[Migration] Error migrating westgard_violations:', e)
  }

  // Seed default Westgard multirule set if empty
  const hasWg = db.prepare(`SELECT 1 FROM westgard_rules LIMIT 1`).get()
  if (!hasWg) {
    const insertRule = db.prepare(`INSERT INTO westgard_rules(
      id, code, name, description, severity, is_active, type, window_size, threshold_sd, consecutive_points, same_side, opposite_sides, sum_abs_z_gt, expression, custom_message, order_index, created_by
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    const nowBy = 'system'
    insertRule.run('wg_1_2s','1_2s','1-2s','Một điểm nằm ngoài ±2SD','warning',1,'1_2s',1,2,1,null,null,null,null,null,1,nowBy)
    insertRule.run('wg_1_3s','1_3s','1-3s','Một điểm nằm ngoài ±3SD','critical',1,'1_3s',1,3,1,null,null,null,null,null,2,nowBy)
    insertRule.run('wg_2_2s','2_2s','2-2s','Hai điểm liên tiếp cùng phía ±2SD','error',1,'2_2s',2,2,2,1,0,null,null,null,3,nowBy)
    insertRule.run('wg_r_4s','R_4s','R-4s','Hai điểm liên tiếp cách nhau >4SD','critical',1,'R_4s',2,null,2,0,1,4,null,null,4,nowBy)
    insertRule.run('wg_4_1s','4_1s','4-1s','Bốn điểm liên tiếp cùng phía ±1SD','warning',1,'4_1s',4,1,4,1,0,null,null,null,5,nowBy)
    insertRule.run('wg_10x','10x','10x','Mười điểm liên tiếp cùng phía mean','warning',1,'10x',10,null,10,1,0,null,null,null,6,nowBy)

    // apply to QC1 & QC2 by default
    db.prepare(`INSERT INTO westgard_rule_qc_levels(rule_id, qc_level_id) VALUES
      ('wg_1_2s','QC1'),('wg_1_2s','QC2'),
      ('wg_1_3s','QC1'),('wg_1_3s','QC2'),
      ('wg_2_2s','QC1'),('wg_2_2s','QC2'),
      ('wg_r_4s','QC1'),('wg_r_4s','QC2'),
      ('wg_4_1s','QC1'),('wg_4_1s','QC2'),
      ('wg_10x','QC1'),('wg_10x','QC2')
    `).run()
  }

  exec(`CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    issue_round TEXT,
    issue_date TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  exec(`CREATE TABLE IF NOT EXISTS bias_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by TEXT, updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME
  )`)

  // Seed minimal qc levels
  db.prepare(`INSERT OR IGNORE INTO qc_levels(id,name) VALUES('QC1','QC1'),('QC2','QC2')`).run()

  // Seed default bias methods
  db.prepare(`INSERT OR IGNORE INTO bias_methods(id, name, description, created_by) VALUES('bias_iqc', 'Bias | IQC', 'Phương pháp tính BIAS từ dữ liệu IQC', 'system')`).run()
  db.prepare(`INSERT OR IGNORE INTO bias_methods(id, name, description, created_by) VALUES('bias_eqa', 'Bias | EQA', 'Phương pháp tính BIAS từ dữ liệu EQA', 'system')`).run()

  // Seed default admin user (username: admin / password: admin)
  exec(`INSERT OR IGNORE INTO departments(id, name) VALUES('hoa_sinh','Hóa sinh')`)
  const hasAdmin = db.prepare(`SELECT 1 FROM users WHERE username = 'admin'`).get()
  if (!hasAdmin) {
    db.prepare(`INSERT INTO users(
      id, username, password_hash, full_name, role, position, department_id, created_by, updated_by
    ) VALUES(
      'admin', 'admin', 'admin', 'Quản trị viên', 'admin', 'IT', 'hoa_sinh', 'system', 'system'
    )`).run()
  }

  // Add apply_to_machine column if it doesn't exist (for existing databases)
  try {
    db.prepare(`ALTER TABLE qc_limits ADD COLUMN apply_to_machine INTEGER NOT NULL DEFAULT 0`).run()
  } catch (e) {}

  // Seed sample machines if none exist
  const hasMachines = db.prepare(`SELECT 1 FROM machines LIMIT 1`).get()
  if (!hasMachines) {
    const sampleMachines = [
      { id: 'au680', device_code: 'AU680', name: 'AU680 Chemistry Analyzer', model: 'AU680', serial: 'AU680-001' },
      { id: 'dxh900', device_code: 'DxH900', name: 'DxH 900 Hematology Analyzer', model: 'DxH900', serial: 'DxH900-001' },
      { id: 'hcv213', device_code: 'HCV213', name: 'HCV 213 Immunoassay Analyzer', model: 'HCV213', serial: 'HCV213-001' },
    ]
    const insertMachine = db.prepare(`INSERT INTO machines(id, device_code, name, model, serial, status, created_by, updated_by) VALUES(?,?,?,?,?,?,?,?)`)
    for (const machine of sampleMachines) {
      insertMachine.run(machine.id, machine.device_code, machine.name, machine.model, machine.serial, 1, 'system', null)
    }
  }

  // Seed sample lots and link them to machines
  const hasLots = db.prepare(`SELECT 1 FROM lots LIMIT 1`).get()
  if (!hasLots) {
    const sampleLots = [
      { id: 'lot1', lot_name: 'Lô Glucose QC1', code: 'GLU001' },
      { id: 'lot2', lot_name: 'Lô Cholesterol QC2', code: 'CHO002' },
      { id: 'lot3', lot_name: 'Lô Protein QC1', code: 'PRO003' },
    ]
    const insertLot = db.prepare(`INSERT INTO lots(id, lot_name, code, status, received_date, expiry_date, created_by, updated_by) VALUES(?,?,?,?,?,?,?,?)`)
    for (const lot of sampleLots) {
      insertLot.run(lot.id, lot.lot_name, lot.code, 1, '2024-01-01', '2024-12-31', 'system', null)
    }

    const lots = db.prepare(`SELECT id, code FROM lots ORDER BY id`).all() as any[]
    const machines = db.prepare(`SELECT id, device_code FROM machines ORDER BY id`).all() as any[]
    if (lots.length >= 3 && machines.length >= 3) {
      const linkLotMachine = db.prepare(`INSERT INTO machine_lots(machine_id, lot_id) VALUES(?,?)`)
      linkLotMachine.run(machines[0].id, lots[0].id)
      linkLotMachine.run(machines[1].id, lots[0].id)
      linkLotMachine.run(machines[1].id, lots[1].id)
      linkLotMachine.run(machines[2].id, lots[1].id)
      linkLotMachine.run(machines[0].id, lots[2].id)
      linkLotMachine.run(machines[2].id, lots[2].id)
    }
  } else {
    // Backfill links for lots without machine links
    const lotsWithoutMachines = db.prepare(`
      SELECT l.id, l.code 
      FROM lots l 
      LEFT JOIN machine_lots ml ON l.id = ml.lot_id 
      WHERE ml.lot_id IS NULL
    `).all() as any[]
    if (lotsWithoutMachines.length > 0) {
      const machines = db.prepare(`SELECT id, device_code FROM machines ORDER BY id`).all() as any[]
      if (machines.length > 0) {
        const linkLotMachine = db.prepare(`INSERT INTO machine_lots(machine_id, lot_id) VALUES(?,?)`)
        for (const lot of lotsWithoutMachines) {
          linkLotMachine.run(machines[0].id, lot.id)
        }
      }
    }
  }

  return db
}

// Shared helpers
export function getLotIdByCode(code: string): string | null {
  const row = getDb().prepare(`SELECT id FROM lots WHERE code=?`).get(code) as any
  return row?.id || null
}

export function getQcLevelIdByName(name: string): string | null {
  const row = getDb().prepare(`SELECT id FROM qc_levels WHERE name=?`).get(name) as any
  return row?.id || null
}

export function getAnalyteIdByCode(code: string): string | null {
  const row = getDb().prepare(`SELECT id FROM analytes WHERE code=?`).get(code) as any
  return row?.id || null
}

export function getMachineIdByCode(code: string): string | null {
  const row = getDb().prepare(`SELECT id FROM machines WHERE device_code=?`).get(code) as any
  return row?.id || null
}

export function ensureDepartmentByName(name?: string): string | null {
  if (!name) return null
  const row = getDb().prepare(`SELECT id FROM departments WHERE name=?`).get(name) as any
  if (row?.id) return row.id
  const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,6)
  getDb().prepare(`INSERT INTO departments(id,name) VALUES(?,?)`).run(id, name)
  return id
}





