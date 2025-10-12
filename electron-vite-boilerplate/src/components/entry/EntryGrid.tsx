import React from 'react'

export type Entry = {
  id: string
  analyteId: string
  analyteName: string
  qcLevel: string
  date: string
  value: number
  unit: string
}

type Option = { value: string; label: string }

type Props = {
  analyteOptions: Option[]
  entries: Entry[]
  runStatuses?: Array<{ index: number; level: 'warning' | 'alert' | 'error'; rules: string[] }>
  cellStatuses?: Record<string, Record<number, 'warning' | 'alert' | 'error'>>
  onCellClick?: (params: { analyteId: string; runIndex: number; currentValue?: number; entryId?: string }) => void
  onRunClick?: (runIndex: number) => void
}

const EntryGrid: React.FC<Props> = ({ analyteOptions, entries, runStatuses, cellStatuses, onCellClick, onRunClick }) => {
  // Sắp xếp entries theo ngày nhập, nếu ngày giống nhau thì theo thứ tự nhập vào
  const sortedEntries = [...(entries || [])].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    // Nếu ngày giống nhau, sắp xếp theo thứ tự nhập vào (có thể dùng id hoặc thứ tự trong mảng gốc)
    return a.id.localeCompare(b.id)
  })

  // Tạo map để group theo analyte và sắp xếp theo ngày
  const grouped = new Map<string, number[]>()
  const groupedIds = new Map<string, string[]>()
  const groupedDates = new Map<string, string[]>()
  
  sortedEntries.forEach(e => {
    const arr = grouped.get(e.analyteId) || []
    arr.push(e.value)
    grouped.set(e.analyteId, arr)
    
    const ids = groupedIds.get(e.analyteId) || []
    ids.push(e.id)
    groupedIds.set(e.analyteId, ids)
    
    const dates = groupedDates.get(e.analyteId) || []
    dates.push(e.date)
    groupedDates.set(e.analyteId, dates)
  })
  
  const analyteColWidth = 240
  const colWidth = 80

  // Tạo danh sách tất cả entries theo thứ tự (không loại bỏ trùng lặp)
  const allEntries = [...sortedEntries]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: analyteColWidth + allEntries.length * colWidth, borderCollapse: 'collapse', tableLayout: 'fixed' as const }}>
        <thead>
          <tr>
            <th style={{ position: 'sticky', left: 0, background: '#fff', textAlign: 'left', border: '1px solid #f0f0f0', padding: '8px', width: analyteColWidth }}>Bộ XN</th>
            {allEntries.map((entry, i) => {
              const displayDate = entry.date ? new Date(entry.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : (i + 1)
              
              return (
                <th
                  key={i}
                  style={{
                    textAlign: 'center',
                    border: '1px solid #f0f0f0',
                    padding: '8px',
                    width: colWidth,
                    cursor: onRunClick ? 'pointer' : 'default'
                  }}
                  onClick={() => onRunClick?.(i)}
                  title={entry.date ? `Ngày: ${entry.date}` : `Cột ${i + 1}`}
                >
                  {displayDate}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {analyteOptions.map(a => {
            return (
              <tr key={a.value}>
                <td style={{ position: 'sticky', left: 0, background: '#fff', border: '1px solid #f0f0f0', padding: '8px', width: analyteColWidth }}>{a.label}</td>
                {allEntries.map((_, i) => {
                  // Tìm entry cho analyte này ở vị trí i
                  const analyteEntries = sortedEntries.filter(e => e.analyteId === a.value)
                  const currentEntry = analyteEntries[i]
                  const value = currentEntry ? currentEntry.value : undefined
                  const entryId = currentEntry ? currentEntry.id : undefined
                  
                  return (
                    <td
                      key={i}
                      style={{
                        textAlign: 'center',
                        border: '1px solid #f0f0f0',
                        padding: '6px 4px',
                        width: colWidth,
                        cursor: onCellClick ? 'pointer' : 'default',
                        background: cellStatuses?.[a.value]?.[i] === 'error' ? '#fff1f0' : cellStatuses?.[a.value]?.[i] === 'alert' ? '#fff7e6' : cellStatuses?.[a.value]?.[i] === 'warning' ? '#ffffe6' : undefined,
                        color: cellStatuses?.[a.value]?.[i] === 'error' ? '#cf1322' : cellStatuses?.[a.value]?.[i] === 'alert' ? '#d46b08' : cellStatuses?.[a.value]?.[i] === 'warning' ? '#8c8c00' : undefined,
                      }}
                      title={(cellStatuses?.[a.value]?.[i] && ((): string => {
                        const entry = runStatuses?.find(r => r.index === i)
                        if (!entry || !entry.rules?.length) return ''
                        const pretty: Record<string, string> = {
                          '1_2s': '1-2s',
                          '1_3s': '1-3s',
                          '2_2s': '2-2s',
                          'R_4s': 'R-4s',
                          '4_1s': '4-1s',
                          '10x': '10x'
                        }
                        const uniq = Array.from(new Set(entry.rules))
                        return `Vi phạm: ${uniq.map(r => pretty[r] || r).join('; ')}`
                      })()) || undefined}
                      onClick={() => onCellClick?.({ analyteId: a.value, runIndex: i, currentValue: value, entryId: entryId })}
                    >
                      {value !== undefined ? value : ''}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default EntryGrid


