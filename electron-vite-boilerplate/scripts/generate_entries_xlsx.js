// Generate sample Entry data to XLSX with 3 QC sheets (QC1, QC2, QC3)
// Run: node scripts/generate_entries_xlsx.js

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildSheet(qcLabel, month = '10', year = '2025') {
  const header = ['Bộ XN', 'Ngày nhập', 'Giá trị']

  const names = [
    'ALT','AST','Albumin','Albumin Urine','Alcol','Amylase','Bil tt','Bil TP','CK','CK MB','CRP','Canxi','Cholesterol','Clo','Creatinin','Creatinin Urine','GGT','Glucose','HDL','HbA1c','K','LDL','Lipase','Na','PCT','Protein','Protein Urin','RF','Sắt','Triglicerid','Ure','Uric'
  ]

  const rows = []
  for (let i = 0; i < names.length; i++) {
    const testName = names[i]
    const points = randomInt(2, 3)
    const used = new Set()
    for (let k = 0; k < points; k++) {
      let day
      do { day = randomInt(1, 30) } while (used.has(day))
      used.add(day)
      const dateStr = `${String(day)}/10/${year}`.replace(/^(\d{1})\//, '0$1/') // ensure dd/mm/yyyy display
      rows.push({
        'Bộ XN': testName,
        'Ngày nhập': dateStr,
        'Giá trị': Number((Math.random() * 200 + 1).toFixed(2))
      })
    }
  }

  // Sort by date then by test for nicer view
  rows.sort((a, b) => {
    const [da, ma, ya] = a['Ngày nhập'].split('/')
    const [db, mb, yb] = b['Ngày nhập'].split('/')
    const ta = `${ya}-${ma.padStart(2,'0')}-${da.padStart(2,'0')}`
    const tb = `${yb}-${mb.padStart(2,'0')}-${db.padStart(2,'0')}`
    return ta.localeCompare(tb) || a['Bộ XN'].localeCompare(b['Bộ XN'])
  })

  const ws = XLSX.utils.json_to_sheet(rows, { header })
  XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' })
  return ws
}

function main() {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildSheet('QC1'), 'QC1')
  XLSX.utils.book_append_sheet(wb, buildSheet('QC2'), 'QC2')
  XLSX.utils.book_append_sheet(wb, buildSheet('QC3'), 'QC3')

  const ts = new Date()
    .toISOString()
    .replace(/[:T]/g, '-')
    .slice(0, 19)
  const out = path.resolve(process.cwd(), `seed_entries_2025-10_${ts}.xlsx`)
  XLSX.writeFile(wb, out)
  console.log('Generated:', out)
}

main()


