import * as XLSX from 'xlsx'

export type SheetSpec = {
  name: string
  rows: any[]
  headerOrder?: string[]
  displayHeaders?: string[]
}

export function exportToXlsx(fileName: string, sheets: SheetSpec[]) {
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows, headerOrder, displayHeaders }) => {
    let ws: XLSX.WorkSheet
    if (headerOrder && headerOrder.length) {
      // Pass header explicitly to preserve column order even with numeric-like keys
      ws = XLSX.utils.json_to_sheet(rows, { header: headerOrder as any })
      
      // Nếu có displayHeaders, thay thế header row
      if (displayHeaders && displayHeaders.length) {
        // Tạo header row mới với displayHeaders
        const headerRow: any = {}
        displayHeaders.forEach((header, index) => {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: index })
          headerRow[cellRef] = { v: header, t: 's' }
        })
        
        // Cập nhật worksheet với header mới
        Object.keys(headerRow).forEach(cellRef => {
          if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' }
          ws[cellRef].v = headerRow[cellRef].v
          ws[cellRef].t = headerRow[cellRef].t
        })
      }
    } else {
      ws = XLSX.utils.json_to_sheet(rows)
    }
    XLSX.utils.book_append_sheet(wb, ws, name || 'Sheet1')
  })
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`)
}

export async function importFromXlsx(file: File): Promise<Record<string, any[]>> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const out: Record<string, any[]> = {}
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name]
    // Sử dụng header: 1 để lấy dữ liệu dạng array of arrays, bảo toàn các cột trùng lặp
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
    
    if (rawData.length === 0) {
      out[name] = []
      return
    }
    
    // Chuyển đổi từ array of arrays sang array of objects với key duy nhất cho mỗi cột
    const headers = rawData[0] as string[]
    const rows = rawData.slice(1) as any[][]
    
    const processedRows = rows.map(row => {
      const obj: any = {}
      headers.forEach((header, colIndex) => {
        // Tạo key duy nhất cho mỗi cột (kể cả trùng lặp)
        const uniqueKey = `${header}_${colIndex}`
        obj[uniqueKey] = row[colIndex]
        // Giữ nguyên key gốc cho cột đầu tiên
        if (!obj[header]) {
          obj[header] = row[colIndex]
        }
      })
      return obj
    })
    
    out[name] = processedRows
  })
  return out
}


