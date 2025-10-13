import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

// Convert data to Excel format
export const convertToExcel = (data: any[]): ArrayBuffer => {
  if (!data || data.length === 0) {
    // Create empty workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['Không có dữ liệu']])
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  }
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  
  // Return as ArrayBuffer
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}

// Download file
export const downloadFile = (content: string | ArrayBuffer, filename: string, mimeType: string = 'text/csv') => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  window.URL.revokeObjectURL(url)
}

// Export entries to Excel
export const exportEntriesToExcel = (entries: any[], filename?: string) => {
  const excelData = entries.map(entry => ({
    'Bộ XN': entry.analyteName || entry.analyte?.name || '',
    'Ngày nhập': dayjs(entry.date).format('DD/MM/YYYY'),
    'Giá trị': entry.value,
    'Mức QC': entry.qcLevelName || entry.qcLevel?.name || '',
    'Lô': entry.lotCode || entry.lot?.code || '',
    'Máy': entry.machineName || entry.machine?.name || '',
    'Cảnh báo': entry.warnings?.join(', ') || entry.warning || '',
    'Tạo bởi': entry.createdBy || '',
    'Cập nhật bởi': entry.updatedBy || '',
    'Ngày tạo': dayjs(entry.createdAt).format('DD/MM/YYYY HH:mm'),
    'Ngày cập nhật': dayjs(entry.updatedAt).format('DD/MM/YYYY HH:mm')
  }))
  
  const excelBuffer = convertToExcel(excelData)
  const defaultFilename = `entries_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`
  downloadFile(excelBuffer, filename || defaultFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

// Export limits to Excel
export const exportLimitsToExcel = (limits: any[], filename?: string) => {
  const excelData = limits.map(limit => ({
    'Bộ XN': limit.analyteName || limit.analyte?.name || '',
    'Mã Bộ XN': limit.analyte?.code || '',
    'Mức QC': limit.qcName || limit.qcLevel?.name || '',
    'Lô': limit.lotCode || limit.lot?.code || '',
    'Máy': limit.machineName || limit.machine?.name || '',
    'Đơn vị': limit.unit || '',
    'Số thập phân': limit.decimals || 0,
    '-2SD': typeof limit.mean === 'number' && typeof limit.sd === 'number'
      ? Number((limit.mean - 2 * limit.sd).toFixed(limit.decimals || 0))
      : 0,
    '+2SD': typeof limit.mean === 'number' && typeof limit.sd === 'number'
      ? Number((limit.mean + 2 * limit.sd).toFixed(limit.decimals || 0))
      : 0,
    'Giá trị trung bình': limit.mean || 0,
    'Độ lệch chuẩn': limit.sd || 0,
    'CV%': limit.cv || 0,
    'TEA': limit.tea || 0,
    'CV Ref': limit.cvRef || 0,
    'Peer Group': limit.peerGroup || 0,
    'Bias EQA': limit.biasEqa || 0,
    'Ngày hết hạn': dayjs(limit.exp).format('DD/MM/YYYY'),
    'Phương pháp': limit.method || '',
    'Ghi chú': limit.note || '',
    'Cách tính BIAS': limit.biasMethod?.name || '',
    'Tạo bởi': limit.createdBy || '',
    'Cập nhật bởi': limit.updatedBy || ''
  }))
  
  const excelBuffer = convertToExcel(excelData)
  const defaultFilename = `limits_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`
  downloadFile(excelBuffer, filename || defaultFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

// Export violations to Excel
export const exportViolationsToExcel = (violations: any[], filename?: string) => {
  const excelData = violations.map(violation => {
    const status = violation.status || violation.entry?.status || 'pending'

    return {
      'Ngày vi phạm': dayjs(violation.entryDate || violation.date || violation.createdAt).format('DD/MM/YYYY'),
      'Mức vi phạm': (violation.ruleCode || violation?.rule?.code || violation.rules || violation.rule || ''),
      'Nội dung': violation.content || violation.note || '',
      'Trạng thái': ((): string => {
        if (status === 'approved') return 'Đã duyệt'
        if (status === 'rejected') return 'Từ chối'
        return 'Đang chờ'
      })(),
      'Nhân viên': violation.staff || '',
      'Hành động khắc phục': violation.action || '',
      'Tạo bởi': violation.createdBy || '',
      'Cập nhật bởi': violation.updatedBy || ''
    }
  })
  
  const excelBuffer = convertToExcel(excelData)
  const defaultFilename = `violations_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`
  downloadFile(excelBuffer, filename || defaultFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

// Export analytes to Excel
export const exportAnalytesToExcel = (analytes: any[], filename?: string) => {
  const excelData = analytes.map((analyte, index) => ({
    'STT': index + 1,
    'Mã': analyte.code || '',
    'Tên xét nghiệm': analyte.name || '',
    'Đơn vị': analyte.unit || '',
    'Số thập phân': analyte.decimals || 0,
    'Yêu cầu chất lượng': analyte.qualityRequirement || '',
    'Ghi chú': analyte.note || '',
    'Tạo bởi': analyte.createdBy || '',
    'Cập nhật bởi': analyte.updatedBy || '',
    'Ngày tạo': dayjs(analyte.createdAt).format('DD/MM/YYYY HH:mm'),
    'Ngày cập nhật': dayjs(analyte.updatedAt).format('DD/MM/YYYY HH:mm')
  }))
  
  const excelBuffer = convertToExcel(excelData)
  const defaultFilename = `analytes_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`
  downloadFile(excelBuffer, filename || defaultFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

// Export departments to Excel
export const exportDepartmentsToExcel = (departments: any[], filename?: string) => {
  const excelData = departments.map((dept, index) => ({
    'STT': index + 1,
    'Tên khoa': dept.name || '',
    'Mã khoa': dept.code || '',
    'Mô tả': dept.description || '',
    'Khóa tháng nhập liệu': dept.lockedEntryMonths || '',
    'Trạng thái': dept.isActive ? 'Hoạt động' : 'Không hoạt động',
    'Tạo bởi': dept.createdBy || '',
    'Cập nhật bởi': dept.updatedBy || '',
    'Ngày tạo': dayjs(dept.createdAt).format('DD/MM/YYYY HH:mm'),
    'Ngày cập nhật': dayjs(dept.updatedAt).format('DD/MM/YYYY HH:mm')
  }))
  
  const excelBuffer = convertToExcel(excelData)
  const defaultFilename = `departments_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`
  downloadFile(excelBuffer, filename || defaultFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}
