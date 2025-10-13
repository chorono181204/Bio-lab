import { exportToXlsx, importFromXlsx } from './xlsx'
import { analyteService } from '../services/analyte.service'

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
  const res = await analyteService.list({ page: 1, pageSize: 10000 })
  const items = Array.isArray(res.data) ? res.data : (res.data as any)?.items || []
  const sheets = buildAnalytesXlsxSheet(items as any)
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
  const existingRes = await analyteService.list({ page: 1, pageSize: 10000 })
  const existingAll = Array.isArray(existingRes.data) ? existingRes.data : (existingRes.data as any)?.items || []
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
        await analyteService.update(existingAnalyte.id, {
          id: existingAnalyte.id,
          code,
          name,
          unit,
          decimals,
          qualityRequirement,
          note
        } as any)
        results.updated++
      } else {
        // Create new
        const created = await analyteService.create({
          code,
          name,
          unit,
          decimals,
          qualityRequirement,
          note
        } as any)
        results.created++
        // Update index to prevent duplicate creates in the same import batch
        codeToAnalyte[code] = { id: (created as any)?.data?.id, code }
      }
    } catch (error) {
      results.skipped++
      results.errors.push(`Dòng ${i + 1}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
    }
  }

  return results
}

