import { exportToXlsx, importFromXlsx } from './xlsx'

type AnyRow = Record<string, any>

export function buildXlsxSheetsByQc(rows: AnyRow[], selectedLot?: string) {
  const byQc: Record<string, AnyRow[]> = {}
  rows.forEach((r: any) => {
    const qc = r.qc_level_name || r.qcLevel
    byQc[qc] = byQc[qc] || []
    byQc[qc].push(r)
  })
  const sheetOrder = ['TT','TEST','-2SD','+2SD','SD','Mean','LOT','EXP','Unit','TEA%','TEA-unit','%Mean','Tên QC','Phương pháp']
  const sheets = Object.keys(byQc).map(qc => ({
    name: qc,
    rows: byQc[qc].map((r: any, idx: number) => ({
      'TT': idx + 1,
      'TEST': r.analyte_name || r.analyteName || r.analyte_id,
      '-2SD': ((Number(r.mean)||0) - 2 * (Number(r.sd)||0)).toFixed(Number(r.decimals)||2),
      '+2SD': ((Number(r.mean)||0) + 2 * (Number(r.sd)||0)).toFixed(Number(r.decimals)||2),
      'SD': r.sd ?? '',
      'Mean': r.mean ?? '',
      'LOT': selectedLot || r.lot || '',
      'EXP': r.exp || '',
      'Unit': r.unit || '',
      'TEA%': r.tea ?? '',
      'TEA-unit': '%',
      '%Mean': 0,
      'Tên QC': r.qc_name || r.qcName || '',
      'Phương pháp': r.method || ''
    })),
    headerOrder: sheetOrder
  }))
  return sheets
}

export async function exportLimitsByLotMachine(selectedLotId: string, selectedMachineId: string, selectedLot?: string) {
  const rows = await (window as any).iqc?.limits?.listByLotMachine?.(selectedLotId, selectedMachineId)
  const sheets = buildXlsxSheetsByQc(rows || [], selectedLot)
  exportToXlsx(`qc_limits_${selectedLot || ''}.xlsx`, sheets)
}

// export by machine across all lots is removed per request

export async function importLimitsFromXlsx(
  file: File,
  opts: {
    selectedLotId?: string
    selectedLot?: string
    selectedQc?: string
    selectedMachineId?: string
    currentUser: string
  }
) {
  const { selectedLotId, selectedLot, selectedQc, selectedMachineId, currentUser } = opts
  if (!selectedMachineId) throw new Error('Machine is required for import')
  if (!selectedLotId) throw new Error('Lot is required for import')

  
  const analytes = await (window as any).iqc?.analytes?.list?.()
  const normalize = (s: string) => String(s || '')
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    .trim().toLowerCase().replace(/\s+/g, '')
  const analyteNameToCode: Record<string, string> = {}
  const analyteNameToId: Record<string, string> = {}
  ;(analytes || []).forEach((a: any) => { 
    const key = normalize(a?.name)
    if (key && a?.code) analyteNameToCode[key] = a.code
    if (key && a?.id) analyteNameToId[key] = a.id
  })

  const wb = await importFromXlsx(file)
  const inferDecimals = (val: any): number => {
    const s = String(val ?? '')
    const m = s.match(/\.(\d+)/)
    return m ? Math.min(6, m[1].length) : 2
  }

  // Process each sheet (QC1, QC2, QC3)
  for (const rawName of Object.keys(wb)) {
    const qcLevel = String(rawName || '').trim().toUpperCase() // QC1/QC2/QC3
    const rows = wb[rawName] || []
    for (let i = 0; i < rows.length; i++) {
      const r: any = rows[i]
      
      // Map columns as shown in the image
      const testName = (r['TEST'] || '').toString()
      const num = (v: any) => Number(String(v ?? '').replace(',', '.'))
      const minus2SD = num(r['-2SD'])
      const plus2SD = num(r['+2SD'])
      const meanFromCol = num(r['Mean'])
      const sdFromCol = num(r['SD'])
      const unit = r['Unit'] || ''
      const tea = r['TEA%'] !== null && r['TEA%'] !== undefined && r['TEA%'] !== '' ? num(r['TEA%']) : undefined
      const exp = r['EXP'] ? String(r['EXP']) : undefined
      const qcName = r['Tên QC'] ? String(r['Tên QC']) : undefined
      const method = r['Phương pháp'] ? String(r['Phương pháp']) : undefined
      
      if (!testName) continue

      // Calculate mean and SD if not provided
      let mean = meanFromCol
      let sd = sdFromCol
      
      // If Mean is empty or 0, calculate from -2SD and +2SD
      if (!meanFromCol && minus2SD && plus2SD) {
        mean = (minus2SD + plus2SD) / 2
      }
      
      // If SD is empty or 0, calculate from -2SD and +2SD
      if (!sdFromCol && minus2SD && plus2SD) {
        sd = (plus2SD - minus2SD) / 4 // SD = (upper - lower) / 4 for ±2SD range
      }

      // Find analyte by name (not code)
      const key = normalize(testName)
      const analyteCode = analyteNameToCode[key]
      const analyteId = analyteNameToId[key]
      if (!analyteCode || !analyteId) {
        console.warn(`Analyte not found for name: ${testName}`)
        continue
      }

      // Use selected lot and machine (don't read from LOT column)
      const lotId = selectedLotId
      const lotCode = selectedLot || ''

      // Check if limit already exists
      const existing = await (window as any).iqc?.limits?.listByContextAnalyte?.(
        lotId, 
        qcLevel, 
        selectedMachineId, 
        analyteCode
      )

      const decimals = Math.max(inferDecimals(r['Mean']), inferDecimals(r['SD']))

      if (existing && existing[0]?.id) {
        // Update existing limit
        await (window as any).iqc?.limits?.update?.({
          id: existing[0].id,
          analyte_code: analyteCode,
          lot_code: lotCode,
          qc_level_name: qcLevel,
          apply_to_machine: true,
          machine_id: selectedMachineId,
          unit,
          decimals,
          mean,
          sd,
          tea,
          exp,
          qc_name: qcName,
          method,
          updated_by: currentUser
        })
      } else {
        // Create new limit
        await (window as any).iqc?.limits?.create?.({
          // Pass IDs as backend requires
          analyte_id: analyteId,
          lot_id: lotId,
          qc_level_id: qcLevel, // QC IDs equal names (e.g., 'QC1')
          apply_to_machine: true,
          machine_id: selectedMachineId,
          unit,
          decimals,
          mean,
          sd,
          tea,
          exp,
          qc_name: qcName,
          method,
          created_by: currentUser
        })
      }
    }
  }

  // Return filtered data for current context
  if (selectedLotId && selectedQc && selectedMachineId) {
    const limits = await (window as any).iqc?.limits?.listByContext?.(selectedLotId, selectedQc, selectedMachineId)
    return limits || []
  }
  return []
}


