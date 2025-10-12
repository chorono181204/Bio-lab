import { exportToXlsx, importFromXlsx } from './xlsx'

type Analyte = {
  id: string
  code: string
  name: string
  unit: string
  decimals: number
  qualityRequirement?: number
  note?: string
  createdBy?: string
  updatedBy?: string
}

export function buildAnalytesXlsxSheet(analytes: Analyte[]) {
  const sheetOrder = ['STT', 'Mã', 'Tên xét nghiệm', 'Đơn vị', 'Số thập phân', 'Yêu cầu chất lượng', 'Ghi chú', 'Tạo bởi', 'Cập nhật bởi']
  
  return [{
    name: 'Analytes',
    rows: analytes.map((analyte, idx) => ({
      'STT': idx + 1,
      'Mã': analyte.code,
      'Tên xét nghiệm': analyte.name,
      'Đơn vị': analyte.unit,
      'Số thập phân': analyte.decimals,
      'Yêu cầu chất lượng': analyte.qualityRequirement || '',
      'Ghi chú': analyte.note || '',
      'Tạo bởi': analyte.createdBy || '',
      'Cập nhật bởi': analyte.updatedBy || ''
    })),
    headerOrder: sheetOrder
  }]
}

export async function exportAnalytesToXlsx() {
  const analytes = await (window as any).iqc?.analytes?.list?.()
  const sheets = buildAnalytesXlsxSheet(analytes || [])
  exportToXlsx('danh_sach_xet_nghiem.xlsx', sheets)
}

export async function importAnalytesFromXlsx(file: File, currentUser: string) {
  const wb = await importFromXlsx(file)
  const sheet = wb['Analytes'] || Object.values(wb)[0] || []
  
  if (!Array.isArray(sheet) || sheet.length === 0) {
    throw new Error('Không tìm thấy dữ liệu xét nghiệm trong file')
  }

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  }

  // Preload existing analytes once and maintain an in-memory index by code
  const existingAll = await (window as any).iqc?.analytes?.list?.()
  const codeToAnalyte: Record<string, any> = {}
  ;(existingAll || []).forEach((a: any) => { if (a?.code) codeToAnalyte[a.code] = a })

  // Helpers to read with multiple header variants
  const getStr = (row: any, keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) return String(row[k])
    }
    return ''
  }
  const getNum = (row: any, keys: string[], def?: number) => {
    const v = getStr(row, keys)
    if (v === '') return def as any
    const n = Number(v)
    return isNaN(n) ? def : n
  }

  for (let i = 0; i < sheet.length; i++) {
    const row = sheet[i] as any
    try {
      // Normalize headers: support both your sheet and previous labels
      const code = getStr(row, ['Mã']).trim()
      const name = getStr(row, ['Tên', 'Tên xét nghiệm']).trim()
      const unit = getStr(row, ['Unit', 'Đơn vị']).trim()
      const decimals = getNum(row, ['Số thập phân'], 2) as number
      const qualityRequirement = getNum(row, ['Chất lượng', 'Yêu cầu chất lượng'])
      const note = getStr(row, ['Ghi chú']).trim()

      if (!code || !name || !unit) {
        results.skipped++
        results.errors.push(`Dòng ${i + 1}: Thiếu mã, tên hoặc đơn vị`)
        continue
      }

      // Check if analyte exists by code (from index)
      const existingAnalyte = codeToAnalyte[code]

      if (existingAnalyte) {
        // Update existing
        await (window as any).iqc?.analytes?.update?.({
          id: existingAnalyte.id,
          code,
          name,
          unit,
          decimals,
          quality_requirement: qualityRequirement,
          note,
          updated_by: currentUser
        })
        results.updated++
      } else {
        // Create new
        const newId = `an_${Date.now()}-${Math.random().toString(36).slice(2,6)}`
        const created = await (window as any).iqc?.analytes?.create?.({
          id: newId,
          code,
          name,
          unit,
          decimals,
          quality_requirement: qualityRequirement,
          note,
          created_by: currentUser
        })
        results.created++
        // Update index to prevent duplicate creates in the same import batch
        codeToAnalyte[code] = { id: created?.id || newId, code }
      }
    } catch (error) {
      results.skipped++
      results.errors.push(`Dòng ${i + 1}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
    }
  }

  return results
}

