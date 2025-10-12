import { getDb } from '../electron/db/connection'

// Seed 32 analytes x 2 QC levels with random dates (01-30/10)
// Params are hardcoded per user request

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  const lotId = '1759313241387'
  const machineId = '1759221207884-3s2j'
  const qc1 = 'QC1'
  const qc2 = 'QC2'

  const db = getDb()
  const analytes = db.prepare(`SELECT id, code, name FROM analytes ORDER BY name ASC LIMIT 32`).all() as any[]
  if (!analytes.length) { console.error('No analytes found'); process.exit(1) }

  const qcIds = [qc1, qc2]
  const now = Date.now()
  const insert = db.prepare(`
    INSERT INTO qc_entries(id, analyte_id, lot_id, qc_level_id, machine_id, entry_date, value, note, created_by)
    VALUES(?,?,?,?,?,?,?,?,?)
  `)

  const tx = db.transaction(() => {
    for (const a of analytes) {
      for (const q of qcIds) {
        const runs = randomInt(2, 3) // số lượng điểm mỗi xét nghiệm
        for (let i = 0; i < runs; i++) {
          const day = String(randomInt(1, 30)).padStart(2, '0')
          const date = `2025-10-${day}`
          const id = String(now + i) + '-' + Math.random().toString(36).slice(2,6)
          const value = Number((Math.random() * 200 + 1).toFixed(2))
          insert.run(id, a.id, lotId, q, machineId, date, value, null, 'seed')
        }
      }
    }
  })

  tx()
  console.log(`Seeded entries for ${analytes.length} analytes x 3 QC levels`)
}

main().catch(err => { console.error(err); process.exit(1) })


