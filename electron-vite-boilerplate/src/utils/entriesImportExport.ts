import { importFromXlsx, exportToXlsx, type SheetSpec } from './xlsx'
import { limitService } from '../services/limit.service'
import { lotService } from '../services/lot.service'
import { machineService } from '../services/machine.service'
import { violationService } from '../services/violation.service'
import dayjs from 'dayjs'
import { westgardService } from '../services/westgard.service'
import { entryService } from '../services/entry.service'
import { analyteService } from '../services/analyte.service'
import { qcLevelService } from '../services/qcLevel.service'
import { evaluateWithRules } from './westgard-dynamic'

type ImportResult = {
  created: number
  skipped: number
  errors: string[]
}

// Expect 3 sheets (QC1, QC2, QC3). Columns:
// - 'TT' ignored
// - 'TEST' analyte name
// - Dynamic columns based on actual data (e.g., '01-10', '01-10', '02-10', ...)
// Header context: use selected lotId, machineId, and month from UI
export async function importEntriesFromXlsx(
  file: File,
  opts: {
    lotId: string
    machineId: string
    qcLevelId: string
    qcLevelIdsBySheet?: Record<string, string> // default: QC1/QC2/QC3
    month: string // YYYY-MM
  }
): Promise<ImportResult> {
  const { lotId, machineId, qcLevelId, qcLevelIdsBySheet, month } = opts
  console.log('[IMPORT] start', { file: file?.name, lotId, machineId, qcLevelId, month, qcLevelIdsBySheet })
  if (!lotId || !machineId || !month) throw new Error('Missing lot/machine/month')
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'

  const wb = await importFromXlsx(file)
  // Load active Westgard rules once for FE evaluation
  let westgardRules: any[] = []
  try {
    const wgRes = await westgardService.list()
    westgardRules = ('data' in wgRes ? (wgRes as any).data.items : wgRes.data) || []
    console.log('[IMPORT] westgard rules loaded:', westgardRules?.length || 0)
  } catch (e) {
    console.warn('Failed to load Westgard rules for import, proceed without:', e)
  }

  // Load analytes mapping name -> id and code (API)
  let analytes: any[] = []
  try {
    const aRes = await analyteService.list({ page: 1, pageSize: 1000 })
    analytes = 'items' in aRes.data ? aRes.data.items : aRes.data
  } catch (e) { console.warn('Load analytes failed for import:', e) }
  console.log('[IMPORT] analytes loaded:', analytes?.length || 0)
  const normalize = (s: string) => s
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '') // strip accents
    .replace(/[^\w]+/g, '') // remove non-word
    .toLowerCase()
  const nameToId: Record<string, string> = {}
  const nameToCode: Record<string, string> = {}
  ;(analytes || []).forEach((a: any) => {
    const n = (a?.name || '') as string
    const key = normalize(n)
    if (key && a?.id) nameToId[key] = a.id
    if (key && a?.code) nameToCode[key] = a.code
  })

  // Load QC levels mapping name -> id (API)
  let qcLevels: any[] = []
  try {
    const qRes = await qcLevelService.list({ page: 1, pageSize: 1000 })
    qcLevels = 'items' in qRes.data ? qRes.data.items : qRes.data
  } catch (e) { console.warn('Load QC levels failed for import:', e) }
  console.log('[IMPORT] qc levels loaded:', qcLevels?.length || 0)
  const qcLevelNameToId: Record<string, string> = {}
  ;(qcLevels || []).forEach((qc: any) => {
    const name = (qc?.name || '') as string
    if (name && qc?.id) {
      qcLevelNameToId[name.toUpperCase()] = qc.id
    }
  })
  // Load lots and machines to support file using names instead of IDs
  const lotCodeToId: Record<string, string> = {}
  try {
    const lotsRes = await lotService.list({ page: 1, pageSize: 1000 })
    const lots = 'items' in lotsRes.data ? lotsRes.data.items : lotsRes.data
    ;(lots || []).forEach((l: any) => {
      if (l.code && l.id) lotCodeToId[String(l.code).toUpperCase()] = l.id
      if (l.lotName && l.id) lotCodeToId[String(l.lotName).toUpperCase()] = l.id
      if (l.name && l.id) lotCodeToId[String(l.name).toUpperCase()] = l.id
    })
    console.log('[IMPORT] lots loaded:', Object.keys(lotCodeToId).length)
  } catch {}

  const machineNameToId: Record<string, string> = {}
  try {
    const machinesRes = await machineService.list({ page: 1, pageSize: 1000 })
    const machines = 'items' in machinesRes.data ? machinesRes.data.items : machinesRes.data
    ;(machines || []).forEach((m: any) => {
      const key1 = String(m.name || '').toUpperCase()
      const key2 = String(m.deviceCode || '').toUpperCase()
      if (key1 && m.id) machineNameToId[key1] = m.id
      if (key2 && m.id) machineNameToId[key2] = m.id
    })
    console.log('[IMPORT] machines loaded:', Object.keys(machineNameToId).length)
  } catch {}

  
  // Debug: Log QC level mapping
  console.log('🔍 QC Level mapping:', qcLevelNameToId)

  const result: ImportResult = { created: 0, skipped: 0, errors: [] }

  // Iterate sheets (QC levels)
  for (const rawName of Object.keys(wb)) {
    const sheetName = String(rawName || '').trim()
    // Always use QC from header (ignore sheet/file values)
    const qcId = qcLevelId
    
    const rows = (wb[rawName] || []).filter((r: any) => Object.keys(r || {}).length > 0)
    console.log('[IMPORT] sheet detected:', sheetName, 'rows:', rows.length)

    // New format: each entry is a row with columns 'Bộ XN' | 'Ngày nhập' | 'Giá trị'
    const isRowPerEntry = rows.some((r: any) => 'Bộ XN' in r || 'Ngày nhập' in r || 'Giá trị' in r)
    if (isRowPerEntry) {
      for (let i = 0; i < rows.length; i++) {
        const r: any = rows[i]
        const testName = String((r['Bộ XN'] ?? r['TEST'] ?? '') as string).trim()
        const dateStr = String((r['Ngày nhập'] ?? '') as string).trim()
        const valueRaw = r['Giá trị']
        if (!testName || !dateStr || valueRaw === undefined || valueRaw === null || valueRaw === '') { result.skipped++; continue }
        const analyteId = nameToId[normalize(testName)]
        if (!analyteId) { result.skipped++; result.errors.push(`Sheet ${sheetName} row ${i+1}: Not found TEST ${testName}`); continue }
        const value = Number(String(valueRaw).replace(',', '.'))
        if (!isFinite(value)) { result.skipped++; continue }
        const m = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (!m) { result.skipped++; result.errors.push(`Sheet ${sheetName} row ${i+1}: Invalid date ${dateStr}`); continue }
        const day = m[1].padStart(2, '0')
        const monthNum = m[2].padStart(2, '0')
        const year = m[3]
        const entryDate = `${year}-${monthNum}-${day}`

        // Resolve QC level / lot / machine by names if provided per row
        // Always take context from header
        const qcIdResolved = qcId
        const lotResolved = lotId
        const machineResolved = machineId

        try {
          const createdEntry = await entryService.create({
            analyteId,
            lotId: lotResolved,
            qcLevelId: qcIdResolved,
            machineId: machineResolved,
            value,
            date: entryDate,
            note: undefined
          })
          result.created += 1
          console.log('[IMPORT] created entry:', createdEntry?.id || '(ok)', { analyteId, lotResolved, qcIdResolved, machineResolved, entryDate, value })

          // FE evaluate rule and create violation
          try {
            // Load limit (mean, sd) for this context lazily
            const limitsRes = await limitService.list({ lotId: lotResolved, machineId: machineResolved, qcLevel: qcIdResolved, page: 1, pageSize: 1000 })
            const limits = 'items' in limitsRes.data ? limitsRes.data.items : limitsRes.data
            const lim = (limits || []).find((l: any) => l.analyteId === analyteId)
            if (lim && isFinite(lim.sd) && lim.sd !== 0) {
              const res = evaluateWithRules([Number(value)], { mean: Number(lim.mean), sd: Number(lim.sd) }, westgardRules)
              const violated = res.violated || []
              for (const code of violated) {
                const content = `Ngày ${dayjs(entryDate).format('DD/MM')}, xét nghiệm ${lim.analyte?.name || ''}: ${lim.qcLevel?.name || ''} vi phạm nguyên tắc ${code}`
                await violationService.create({
                  analyteId,
                  lotId: lotResolved,
                  qcLevelId: qcIdResolved,
                  machineId: machineResolved,
                  entryDate,
                  value: Number(value),
                  ruleCode: code,
                  severity: (code === '1-3s' ? 'error' : code === '1-2s' ? 'warning' : 'critical') as any,
                  content,
                  status: 'pending'
                })
              }
            }
          } catch (err) {
            console.warn(`Create violations failed for row ${i + 1}:`, err)
          }
        } catch (e) {
          result.errors.push(`Sheet ${sheetName} row ${i+1}: ${e instanceof Error ? e.message : 'Create failed'}`)
        }
      }
      continue
    }

    // Backward-compatible format: each analyte in one row with dynamic date columns
    for (let i = 0; i < rows.length; i++) {
      const r: any = rows[i]
      const testName = String((r['Bộ XN'] ?? r['TEST'] ?? '') || '').trim()
      if (!testName) { result.skipped++; continue }
      const analyteId = nameToId[normalize(testName)]
      if (!analyteId) { result.skipped++; result.errors.push(`Sheet ${sheetName} row ${i+1}: Not found TEST ${testName}`); continue }

      const creates: any[] = []
      const dateColumns = Object.keys(r).filter(key => /^\d{2}-\d{2}(?:_\d+)?$/.test(key))
      dateColumns.sort()
      for (const columnKey of dateColumns) {
        if (r[columnKey] === undefined || r[columnKey] === null || r[columnKey] === '') continue
        const raw = String(r[columnKey]).toString().replace(',', '.')
        const value = Number(raw)
        if (!isFinite(value)) continue
        const baseKey = columnKey.split('_')[0]
        const [day] = baseKey.split('-')
        const entryDate = `${month}-${day.padStart(2, '0')}`
        creates.push({
          analyte_id: analyteId,
          lot_id: lotId,
          qc_level_id: qcId,
          machine_id: machineId,
          entry_date: entryDate,
          value,
          created_by: currentUser
        })
      }
      if (creates.length) {
        try {
          for (const c of creates) {
            const createdEntry = await entryService.create({
              analyteId: c.analyte_id,
              lotId,
              qcLevelId: qcId,
              machineId,
              value: c.value,
              date: c.entry_date,
              note: undefined
            })
            console.log('[IMPORT] created entry:', createdEntry?.id || '(ok)', { analyteId: c.analyte_id, lotId, qcId, machineId, date: c.entry_date, value: c.value })
          }
          result.created += creates.length

          // Evaluate for each created entry
          try {
            const limitsRes = await limitService.list({ lotId, machineId, qcLevel: qcId, page: 1, pageSize: 1000 })
            const limits = 'items' in limitsRes.data ? limitsRes.data.items : limitsRes.data
            for (const c of creates) {
              const lim = (limits || []).find((l: any) => l.analyteId === c.analyte_id)
              if (!lim || !isFinite(lim.sd) || lim.sd === 0) continue
              const res = evaluateWithRules([Number(c.value)], { mean: Number(lim.mean), sd: Number(lim.sd) }, westgardRules)
              const violated = res.violated || []
              for (const code of violated) {
                const content = `Ngày ${dayjs(c.entry_date).format('DD/MM')}, xét nghiệm ${lim.analyte?.name || ''}: ${lim.qcLevel?.name || ''} vi phạm nguyên tắc ${code}`
                await violationService.create({
                  analyteId: c.analyte_id,
                  lotId,
                  qcLevelId: qcId,
                  machineId,
                  entryDate: c.entry_date,
                  value: Number(c.value),
                  ruleCode: code,
                  severity: (code === '1-3s' ? 'error' : code === '1-2s' ? 'warning' : 'critical') as any,
                  content,
                  status: 'pending'
                })
              }
            }
          } catch (err) {
            console.warn('Create violations for batch failed:', err)
          }
        } catch (e) {
          result.errors.push(`Sheet ${sheetName} row ${i+1}: ${e instanceof Error ? e.message : 'Create failed'}`)
        }
      }
    }
  }

  return result
}

export function exportEntriesToXlsx(params: {
  lotCode?: string
  qcLabel: string
  month: string // YYYY-MM
  analyteOptions: Array<{ value: string; label: string }>
  entries: Array<{ analyteId: string; date: string; value: number }>
}) {
  const { lotCode, qcLabel, month, analyteOptions, entries } = params
  // Build day columns 1..31
  // Header template kept for compatibility (not used directly here)
  // const header = ['TT','TEST', ...Array.from({ length: 31 }, (_, i) => String(i + 1))]
  const rows = analyteOptions.map((a, idx) => {
    const base: Record<string, any> = { TT: idx + 1, TEST: a.label }
    const arr = entries.filter(e => e.analyteId === a.value && e.date.startsWith(month + '-'))
    arr.forEach(e => {
      const d = Number(e.date.slice(-2))
      if (d >= 1 && d <= 31) base[String(d)] = e.value
    })
    return base
  })
  const header = ['TT','TEST', ...Array.from({ length: 31 }, (_, i) => String(i + 1))]
  exportToXlsx(`iqc_entries_${lotCode || ''}_${qcLabel}_${month}.xlsx`, [{ name: qcLabel, rows, headerOrder: header }])
}

export async function exportAllQcEntriesToXlsx(params: {
  lotId: string
  lotCode?: string
  machineId: string
  qcLevels: Array<{ value: string; label: string }>
  month: string // YYYY-MM
}) {
  const { lotId, lotCode, machineId, qcLevels, month } = params
  const sheets: SheetSpec[] = []

  for (const q of qcLevels) {
    // Load limits and entries for this level
    const [limits, entries] = await Promise.all([
      (window as any).iqc?.limits?.listByContext?.(lotId, q.value, machineId),
      (window as any).iqc?.entries?.listByContext?.(lotId, q.value, machineId)
    ])
    
    // Lấy tất cả analytes từ limits trước
    const analyteOptions: Array<{ value: string; label: string }> = []
    const seen = new Set<string>()
    ;(limits || []).forEach((l: any) => {
      const code = l.analyteId
      if (!code || seen.has(code)) return
      seen.add(code)
      analyteOptions.push({ value: code, label: l.analyteName || code })
    })
    
    // Bổ sung thêm analytes từ entries nếu chưa có trong limits
    if (Array.isArray(entries)) {
      entries.forEach((e: any) => {
        const code = e.analyte_code || e.analyte_id
        if (code && !seen.has(code)) {
          seen.add(code)
          analyteOptions.push({ value: code, label: e.analyte_name || code })
        }
      })
    }
    
    // Nếu vẫn chưa có analytes nào, lấy tất cả analytes từ hệ thống
    if (analyteOptions.length === 0) {
      try {
        const allAnalytes = await (window as any).iqc?.analytes?.list?.()
        if (Array.isArray(allAnalytes)) {
          allAnalytes.forEach((a: any) => {
            if (a.code && !seen.has(a.code)) {
              seen.add(a.code)
              analyteOptions.push({ value: a.code, label: a.name || a.code })
            }
          })
        }
      } catch (e) {
        console.warn('Failed to load all analytes:', e)
      }
    }

    // Sắp xếp entries theo ngày nhập, nếu ngày giống nhau thì theo thứ tự nhập vào
    const sortedEntries = [...(entries || [])].sort((a, b) => {
      const dateCompare = a.entry_date.localeCompare(b.entry_date)
      if (dateCompare !== 0) return dateCompare
      return a.id.localeCompare(b.id)
    })

    // Tạo cấu trúc giống EntryGrid: group entries theo analyte và sắp xếp theo ngày
    const grouped = new Map<string, any[]>()
    const groupedIds = new Map<string, string[]>()
    const groupedDates = new Map<string, string[]>()
    
    sortedEntries.forEach(e => {
      const arr = grouped.get(e.analyte_code || e.analyte_id) || []
      arr.push(e.value)
      grouped.set(e.analyte_code || e.analyte_id, arr)
      
      const ids = groupedIds.get(e.analyte_code || e.analyte_id) || []
      ids.push(e.id)
      groupedIds.set(e.analyte_code || e.analyte_id, ids)
      
      const dates = groupedDates.get(e.analyte_code || e.analyte_id) || []
      dates.push(e.entry_date)
      groupedDates.set(e.analyte_code || e.analyte_id, dates)
    })
    
    // Tìm số cột tối đa (giống EntryGrid)
    const lengths = Array.from(grouped.values()).map(a => a.length)
    const maxLen = lengths.length ? Math.max(...lengths) : 0
    
    // Tạo header dựa trên analyte đầu tiên (giống EntryGrid)
    const firstAnalyteDates = groupedDates.get(analyteOptions[0]?.value) || []
    const dateHeaders = Array.from({ length: maxLen }, (_, i) => {
      const date = firstAnalyteDates[i] || ''
      if (date) {
        const day = date.slice(-2)
        return `${day}-${month.slice(-2)}` // Format: DD-MM
      }
      return `${i + 1}` // Fallback to column number
    })
    // Tạo headerOrder với key duy nhất cho mỗi cột
    const dynamicHeader = ['TT', 'TEST', ...Array.from({ length: maxLen }, (_, i) => `col_${i}`)]
    const displayHeaders = ['TT', 'TEST', ...dateHeaders]

    const rows = analyteOptions.map((a, idx) => {
      const base: Record<string, any> = { TT: idx + 1, TEST: a.label }
      const values = grouped.get(a.value) || []
      
      // Điền dữ liệu theo thứ tự cột với key duy nhất
      values.forEach((value, colIndex) => {
        // Sử dụng key duy nhất cho mỗi cột (colIndex) thay vì headerKey có thể trùng
        base[`col_${colIndex}`] = value
      })
      
      return base
    })
    sheets.push({ name: q.label || q.value, rows, headerOrder: dynamicHeader, displayHeaders: displayHeaders })
  }

  exportToXlsx(`iqc_entries_${lotCode || ''}_${month}.xlsx`, sheets)
}


