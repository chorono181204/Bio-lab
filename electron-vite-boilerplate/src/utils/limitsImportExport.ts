import dayjs from 'dayjs'
import { importFromXlsx } from './xlsx'
import { exportLimitsToExcel } from '../utils/export'
import { limitService } from '../services/limit.service'
import { analyteService } from '../services/analyte.service'
import { qcLevelService } from '../services/qcLevel.service'

// Export limits using REST API and shared export utility
async function fetchAllLimits(params: { lotId?: string; machineId?: string; search?: string }) {
  const pageSize = 1000
  let page = 1
  const all: any[] = []
  while (true) {
    const res = await limitService.list({ ...params, page, pageSize })
    const data = (res.data as any)
    const items: any[] = data.items || []
    const total: number = data.total ?? items.length
    all.push(...items)
    if (all.length >= total || items.length === 0) break
    page += 1
  }
  return all
}

export async function exportLimitsByLotMachine(lotId: string, machineId: string) {
  const items = await fetchAllLimits({ lotId, machineId })
  exportLimitsToExcel(items)
}

// Import limits from XLSX; Lot/Machine taken from context (header)
export async function importLimitsFromXlsx(file: File, ctx: { lotId: string; machineId: string }) {
  const wb = await importFromXlsx(file)
  const sheet = Object.values(wb)[0] || []
  if (!Array.isArray(sheet) || sheet.length === 0) throw new Error('Không tìm thấy dữ liệu')

  const [anRes, qcRes] = await Promise.all([
    analyteService.list({ page: 1, pageSize: 10000 }),
    qcLevelService.list({ page: 1, pageSize: 10000 })
  ])
  const analytes = (anRes.data as any).items || anRes.data || []
  const qcLevels = (qcRes.data as any).items || qcRes.data || []
  const nameToAnalyteId: Record<string, string> = {}
  analytes.forEach((a: any) => { if (a?.name && a?.id) nameToAnalyteId[a.name.toLowerCase()] = a.id })
  const nameToQcId: Record<string, string> = {}
  qcLevels.forEach((q: any) => { if (q?.name && q?.id) nameToQcId[q.name.toLowerCase()] = q.id })

  const result = { created: 0, skipped: 0, errors: [] as string[] }
  const inferDecimals = (val: any): number => {
    const s = String(val ?? '')
    const m = s.match(/\.(\d+)/)
    return m ? Math.min(6, m[1].length) : 2
  }

  for (let i = 0; i < (sheet as any[]).length; i++) {
    const r = (sheet as any[])[i] as any
    const analyteName = (r['Bộ XN'] || r['Tên xét nghiệm'] || '').toString().trim().toLowerCase()
    const qcName = (r['Mức QC'] || '').toString().trim().toLowerCase()
    const unit = (r['Đơn vị'] || '').toString().trim()
    let decimals = Number(r['Số thập phân'] ?? 2)
    const minus2 = Number(r['-2SD'])
    const plus2 = Number(r['+2SD'])
    let mean = Number(r['Giá trị trung bình'] ?? r['Mean'])
    let sd = Number(r['Độ lệch chuẩn'] ?? r['SD'])
    // Auto-derive Mean/SD from ±2SD when missing
    if (!isFinite(mean) && isFinite(minus2) && isFinite(plus2)) {
      mean = (minus2 + plus2) / 2
    }
    if (!isFinite(sd) && isFinite(minus2) && isFinite(plus2)) {
      sd = (plus2 - minus2) / 4
    }
    // Auto-infer decimals if not provided
    if (!isFinite(decimals)) {
      decimals = Math.max(inferDecimals(r['Giá trị trung bình'] ?? r['Mean']), inferDecimals(r['Độ lệch chuẩn'] ?? r['SD']))
    }
    const tea = r['TEA'] !== undefined ? Number(r['TEA']) : undefined
    const cvRef = r['CV Ref'] !== undefined ? Number(r['CV Ref']) : undefined
    const peerGroup = r['Peer Group'] !== undefined ? Number(r['Peer Group']) : undefined
    const biasEqa = r['Bias EQA'] !== undefined ? Number(r['Bias EQA']) : undefined
    const exp = r['Ngày hết hạn'] ? dayjs(r['Ngày hết hạn'], 'DD/MM/YYYY').format('YYYY-MM-DD') : undefined
    const method = (r['Phương pháp'] || '').toString().trim()
    const note = (r['Ghi chú'] || '').toString().trim()

    const analyteId = nameToAnalyteId[analyteName]
    const qcLevelId = nameToQcId[qcName]
    if (!analyteId || !qcLevelId || !isFinite(mean) || !isFinite(sd)) {
      result.skipped++; result.errors.push(`Dòng ${i + 1}: thiếu dữ liệu bắt buộc`); continue
    }
    try {
      // Upsert: nếu đã tồn tại giới hạn cho (lotId, machineId, qcLevelId, analyteId) thì update, ngược lại create
      const existingResp = await limitService.list({
        lotId: ctx.lotId,
        machineId: ctx.machineId,
        qcLevel: qcLevelId,
        page: 1,
        pageSize: 1000
      })
      const existingItems = (existingResp.data as any).items || []
      const found = existingItems.find((it: any) => it.analyteId === analyteId)

      const payload: any = {
        analyteId,
        lotId: ctx.lotId,
        machineId: ctx.machineId,
        qcLevelId,
        unit,
        decimals: isFinite(decimals) ? decimals : 2,
        mean,
        sd,
        tea,
        cvRef,
        peerGroup,
        biasEqa,
        exp,
        method,
        note
      }

      if (found?.id) {
        await limitService.update(found.id, { id: found.id, ...payload })
      } else {
        await limitService.create(payload)
      }
      result.created++
    } catch (e: any) {
      result.skipped++; result.errors.push(`Dòng ${i + 1}: ${e?.message || 'Lỗi tạo limit'}`)
    }
  }
  return result
}
