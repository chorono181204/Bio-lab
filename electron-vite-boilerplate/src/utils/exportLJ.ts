// Export LJ charts into an Excel file with embedded images (PNG) and metadata
// Uses xlsx-populate (browser build) dynamically to avoid heavy bundle if unused

export type LjChartImage = {
  title: string
  pngDataUrl: string // data:image/png;base64,...
}

export async function exportLJToExcelWithCharts(opts: {
  filename?: string
  lotCode: string
  machineLabel: string
  analyteName: string
  rangeText?: string
  note?: string
  charts: LjChartImage[]
  parameters?: Array<{ qc: string; mean: number; sd: number; cv?: number; cvRef?: number; unit?: string; exp?: string; method?: string }>
  exportedBy?: string
}) {
  try {
    const XlsxPopulate = (await import('xlsx-populate/browser/xlsx-populate')).default
    const wb = await XlsxPopulate.fromBlankAsync()
    const ws = wb.sheet(0)
    ws.name('Biểu đồ LJ')

  // Header meta
  let row = 1
    ws.row(row++).cell(1).value(`Tên xét nghiệm: ${opts.analyteName}`)
  ws.row(row++).cell(1).value(`Lô: ${opts.lotCode}`)
  ws.row(row++).cell(1).value(`Máy: ${opts.machineLabel}`)
  if (opts.rangeText) ws.row(row++).cell(1).value(`Khoảng thời gian: ${opts.rangeText}`)
    if (opts.exportedBy) ws.row(row++).cell(1).value(`Người xuất: ${opts.exportedBy}`)
  row++
  ws.row(row++).cell(1).value('Nhận xét:')
  ws.row(row++).cell(1).value(opts.note || '')
  row += 1

  // Place charts stacked vertically
    let topLeftRow = row
    for (const chart of opts.charts) {
      ws.row(topLeftRow).cell(1).value(chart.title)
      // xlsx-populate addImage may not be available in some builds; throw to fallback
      if (!(wb as any).addImage) throw new Error('addImage not supported')
      const imgId = (wb as any).addImage({ base64: chart.pngDataUrl })
      ws.addImage({ image: imgId, tl: { col: 1, row: topLeftRow + 0.5 }, ext: { width: 980, height: 240 } })
      topLeftRow += 18
    }

  // Thêm sheet thông số
  if (opts.parameters && opts.parameters.length) {
    const wsInfo = wb.addSheet('Thông số')
    wsInfo.cell('A1').value('Mức QC')
    wsInfo.cell('B1').value('Mean')
    wsInfo.cell('C1').value('SD')
    wsInfo.cell('D1').value('CV%')
    wsInfo.cell('E1').value('CV% REF')
    wsInfo.cell('F1').value('Unit')
    wsInfo.cell('G1').value('EXP')
    wsInfo.cell('H1').value('PP')
    let r = 2
    opts.parameters.forEach(p => {
      wsInfo.row(r).cell(1).value(p.qc)
      wsInfo.row(r).cell(2).value(Number(p.mean || 0))
      wsInfo.row(r).cell(3).value(Number(p.sd || 0))
      if (p.cv !== undefined) wsInfo.row(r).cell(4).value(Number(p.cv))
      if (p.cvRef !== undefined) wsInfo.row(r).cell(5).value(Number(p.cvRef))
      if (p.unit) wsInfo.row(r).cell(6).value(p.unit)
      if (p.exp) wsInfo.row(r).cell(7).value(p.exp)
      if (p.method) wsInfo.row(r).cell(8).value(p.method)
      r += 1
    })
  }

    ws.column(1).width(140)
    ws.column(2).width(60)

    const fileName = opts.filename || `lj_charts_${Date.now()}.xlsx`
    const blob = await wb.outputAsync('blob')
    const url = URL.createObjectURL(blob as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  } catch (err) {
    // Fallback: use exceljs to embed images
    await exportLJToExcelWithCharts_exceljs(opts)
  }
}

// Helper: convert an SVG element to PNG dataURL via canvas
export async function svgToPngDataUrl(svgEl: SVGSVGElement, width = 980, height = 240): Promise<string> {
  const xml = new XMLSerializer().serializeToString(svgEl)
  const svg64 = btoa(unescape(encodeURIComponent(xml)))
  const image = new Image()
  image.src = `data:image/svg+xml;base64,${svg64}`
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

async function exportLJToExcelWithCharts_exceljs(opts: {
  filename?: string
  lotCode: string
  machineLabel: string
  analyteName: string
  rangeText?: string
  note?: string
  charts: LjChartImage[]
  parameters?: Array<{ qc: string; mean: number; sd: number; cv?: number; cvRef?: number; unit?: string; exp?: string; method?: string }>
  exportedBy?: string
}) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Biểu đồ LJ')

  let row = 1
  ws.getCell(`A${row++}`).value = `Tên xét nghiệm: ${opts.analyteName}`
  ws.getCell(`A${row++}`).value = `Lô: ${opts.lotCode}`
  ws.getCell(`A${row++}`).value = `Máy: ${opts.machineLabel}`
  if (opts.rangeText) ws.getCell(`A${row++}`).value = `Khoảng thời gian: ${opts.rangeText}`
  if (opts.exportedBy) ws.getCell(`A${row++}`).value = `Người xuất: ${opts.exportedBy}`
  row++
  ws.getCell(`A${row++}`).value = 'Nhận xét:'
  ws.getCell(`A${row++}`).value = opts.note || ''
  row += 1

  let currentRow = row
  for (const chart of opts.charts) {
    ws.getCell(`A${currentRow}`).value = chart.title
    const imageId = wb.addImage({ base64: chart.pngDataUrl, extension: 'png' })
    ws.addImage(imageId, {
      tl: { col: 0, row: currentRow },
      ext: { width: 980, height: 240 }
    })
    currentRow += 18
  }

  if (opts.parameters && opts.parameters.length) {
    const info = wb.addWorksheet('Thông số')
    info.addRow(['Mức QC', 'Mean', 'SD', 'CV%', 'CV% REF', 'Unit', 'EXP', 'PP'])
    opts.parameters.forEach(p => {
      info.addRow([p.qc, p.mean || 0, p.sd || 0, p.cv ?? '', p.cvRef ?? '', p.unit ?? '', p.exp ?? '', p.method ?? ''])
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = opts.filename || `lj_charts_${Date.now()}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export via template that contains native Excel charts bound to Data sheets
export async function exportLJToExcelFromTemplate(opts: {
  templateUrl: string
  filename?: string
  meta: { analyte: string; lot: string; machine: string; range?: string; note?: string }
  dataQC1?: Array<{ date: string; value: number; mean: number; sd: number }>
  dataQC2?: Array<{ date: string; value: number; mean: number; sd: number }>
}) {
  const XlsxPopulate = (await import('xlsx-populate/browser/xlsx-populate')).default
  const res = await fetch(opts.templateUrl)
  if (!res.ok) throw new Error('Không tải được template Excel')
  const buf = await res.arrayBuffer()
  const wb = await XlsxPopulate.fromDataAsync(buf)

  const writeSheet = (name: string, rows?: Array<{ date: string; value: number; mean: number; sd: number }>) => {
    if (!rows || rows.length === 0) return
    const ws = wb.sheet(name)
    // Header
    ws.cell('A1').value('Date')
    ws.cell('B1').value('Value')
    ws.cell('C1').value('Mean')
    ws.cell('D1').value('+1SD')
    ws.cell('E1').value('+2SD')
    ws.cell('F1').value('+3SD')
    ws.cell('G1').value('-1SD')
    ws.cell('H1').value('-2SD')
    ws.cell('I1').value('-3SD')
    let r = 2
    rows.forEach(row => {
      const mean = Number(row.mean || 0)
      const sd = Number(row.sd || 0)
      ws.row(r).cell(1).value(row.date)
      ws.row(r).cell(2).value(Number(row.value))
      ws.row(r).cell(3).value(mean)
      ws.row(r).cell(4).value(mean + 1 * sd)
      ws.row(r).cell(5).value(mean + 2 * sd)
      ws.row(r).cell(6).value(mean + 3 * sd)
      ws.row(r).cell(7).value(mean - 1 * sd)
      ws.row(r).cell(8).value(mean - 2 * sd)
      ws.row(r).cell(9).value(mean - 3 * sd)
      r += 1
    })
  }

  // Write data
  writeSheet('DataQC1', opts.dataQC1)
  writeSheet('DataQC2', opts.dataQC2)

  // Meta
  const meta = wb.sheet('Meta')
  meta.cell('A1').value(opts.meta.analyte)
  meta.cell('A2').value(opts.meta.lot)
  meta.cell('A3').value(opts.meta.machine)
  meta.cell('A4').value(opts.meta.range || '')
  meta.cell('A5').value(opts.meta.note || '')

  const fileName = opts.filename || `lj_charts_${Date.now()}.xlsx`
  const blob = await wb.outputAsync('blob')
  const url = URL.createObjectURL(blob as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}



