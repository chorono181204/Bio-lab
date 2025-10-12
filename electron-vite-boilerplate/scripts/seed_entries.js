// Run with Electron runtime (to match better-sqlite3 build):
// npx electron scripts/seed_entries.js
const path = require('path')
const Database = require('better-sqlite3')

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  // Hardcoded params per request
  const lotId = '1759313241387'
  const machineId = '1759221207884-3s2j'
  const qcIds = ['QC1', 'QC2']

  const dbPath = path.resolve(__dirname, '../electron/db/bio_lab.db')
  const db = new Database(dbPath)
  const analytes = db.prepare('SELECT id, code, name FROM analytes ORDER BY name ASC LIMIT 32').all()
  if (!analytes.length) { console.error('No analytes found'); process.exit(1) }

  const insert = db.prepare(`
    INSERT INTO qc_entries(id, analyte_id, lot_id, qc_level_id, machine_id, entry_date, value, note, created_by)
    VALUES(?,?,?,?,?,?,?,?,?)
  `)

  const now = Date.now()
  const tx = db.transaction(() => {
    for (const a of analytes) {
      for (const q of qcIds) {
        const runs = randomInt(2, 3)
        for (let i = 0; i < runs; i++) {
          const day = String(randomInt(1, 30)).padStart(2, '0')
          const date = `2025-10-${day}`
          const id = String(now + i) + '-' + Math.random().toString(36).slice(2, 6)
          const value = Number((Math.random() * 200 + 1).toFixed(2))
          insert.run(id, a.id, lotId, q, machineId, date, value, null, 'seed')
        }
      }
    }
  })

  tx()
  console.log(`Seeded entries for ${analytes.length} analytes x ${qcIds.length} QC levels`)
}

main().catch((e) => { console.error(e); process.exit(1) })


