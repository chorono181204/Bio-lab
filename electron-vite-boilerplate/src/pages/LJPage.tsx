import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, DatePicker, Select, Space, Typography, Card, message } from 'antd'
import LJChartComp, { Point, Limits } from '../components/charts/LJChart'
import dayjs from 'dayjs'
import { lotService, machineService, analyteService, limitService, entryService } from '../services'
import { westgardService } from '../services/westgard.service'
import { evaluateWithRules } from '../utils/westgard-dynamic'
import { exportLJToExcelWithCharts, svgToPngDataUrl, exportLJToExcelFromTemplate } from '../utils/exportLJ'

// types moved to component

type Option = { value: string; label: string }

function exportSVG(svg: SVGSVGElement, filename: string) {
  const data = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const LJChart: React.FC<{ title: string; points: Point[]; limits: Limits; onRef?: (el: SVGSVGElement|null)=>void }> = ({ title, points, limits, onRef }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const width = 980
  const height = 220
  const padding = { left: 50, right: 10, top: 30, bottom: 30 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const allValues = useMemo(() => {
    const mean = Number(limits.mean) || 0
    const sdAbs = Math.abs(Number(limits.sd) || 0)
    // FIX: Always anchor y-range to mean ± 3SD to keep equal spacing, independent of points
    let min: number
    let max: number
    if (sdAbs > 0) {
      min = mean - 3 * sdAbs
      max = mean + 3 * sdAbs
    } else {
      min = mean - 1
      max = mean + 1
    }
    return { min, max }
  }, [limits])

  const yScale = (v: number) => {
    const { min, max } = allValues
    const t = (v - min) / (max - min || 1)
    return height - padding.bottom - t * plotHeight
  }
  const xScale = (i: number) => padding.left + (i / Math.max(points.length - 1, 1)) * plotWidth

  const sdAbs = Math.abs(Number(limits.sd) || 0)
  const lines = sdAbs > 0 ? [
    { label: '+3SD', value: limits.mean + 3 * sdAbs, color: '#999' },
    { label: '+2SD', value: limits.mean + 2 * sdAbs, color: '#f5222d' },
    { label: '+1SD', value: limits.mean + 1 * sdAbs, color: '#999' },
    { label: 'Mean', value: limits.mean, color: '#1677ff' },
    { label: '-1SD', value: limits.mean - 1 * sdAbs, color: '#999' },
    { label: '-2SD', value: limits.mean - 2 * sdAbs, color: '#f5222d' },
    { label: '-3SD', value: limits.mean - 3 * sdAbs, color: '#999' },
  ] : [
    { label: 'Mean', value: limits.mean, color: '#1677ff' }
  ]

  return (
    <Card size="small" style={{ marginBottom: 12, position: 'relative' }} title={title}>
      <div style={{ color: '#888', fontSize: 12, margin: '-8px 0 4px 54px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>N: {points.length}</span>
        <span>MEAN: {limits.mean}</span>
        <span>SD: {limits.sd}</span>
        {typeof limits.cv === 'number' && <span>CV%: {limits.cv}</span>}
        {typeof limits.cvRef === 'number' && <span>CV% REF: {limits.cvRef}</span>}
        {limits.exp && <span>EXP: {dayjs(limits.exp).format('DD/MM/YYYY')}</span>}
        {limits.unit && <span>Unit: {limits.unit}</span>}
        {limits.method && <span>PP: {limits.method}</span>}
      </div>
      <svg ref={(el)=>{ svgRef.current = el; onRef?.(el) }} width={width} height={height}>
        {/* grid */}
        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} fill="#fff" stroke="#e5e5e5" />
        {lines.map((l, idx) => (
          <g key={idx}>
            <line x1={padding.left} x2={padding.left + plotWidth} y1={yScale(l.value)} y2={yScale(l.value)} stroke={l.color} strokeDasharray={l.label.includes('SD') ? '4 4' : '0'} />
            <text x={padding.left - 6} y={yScale(l.value) + 4} fontSize={10} textAnchor="end" fill={l.color}>{l.label}</text>
          </g>
        ))}
        {/* points */}
        {points.map((p, i) => (
          <g key={i}>
            {i > 0 && (
              <line x1={xScale(i - 1)} y1={yScale(points[i - 1].value)} x2={xScale(i)} y2={yScale(p.value)} stroke="#000" />
            )}
            <circle cx={xScale(i)} cy={yScale(p.value)} r={3} fill="#000"
              onMouseEnter={(e)=> setTip({ x: e.clientX, y: e.clientY, text: `${new Date(p.date).getDate()}/${new Date(p.date).getMonth()+1} • ${p.value}` })}
              onMouseLeave={()=> setTip(null)}
            />
            {/* x-axis tick */}
            <text x={xScale(i)} y={height - 10} fontSize={10} textAnchor="middle" fill="#888">{new Date(p.date).getDate()+'/'+(new Date(p.date).getMonth()+1)}</text>
          </g>
        ))}
      </svg>
      {tip && (
        <div style={{ position: 'fixed', left: tip.x + 8, top: tip.y + 8, background: '#fff', border: '1px solid #e5e5e5', boxShadow: '0 2px 6px rgba(0,0,0,.15)', padding: '4px 6px', fontSize: 12 }}>
          {tip.text}
        </div>
      )}
    </Card>
  )
}

const LJPage: React.FC = () => {
  const [mode, setMode] = useState<'westgard' | 'lj'>('lj')
  const [range, setRange] = useState<[any, any] | null>([dayjs().startOf('month'), dayjs().endOf('month')])
  const [qc, setQc] = useState<'QC1' | 'QC2'>('QC1')
  const [activeAnalyte, setActiveAnalyte] = useState<string>('')
  const [selectedLot, setSelectedLot] = useState<string>('')
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [selectedMachine, setSelectedMachine] = useState<string>('')
  const [userPosition, setUserPosition] = useState<string>('')
  const [userFullName, setUserFullName] = useState<string>('')
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string; id?: string }[]>([])
  const [machineOptions, setMachineOptions] = useState<{ value: string; label: string }[]>([])
  const [analyteOptions, setAnalyteOptions] = useState<Option[]>([])
  const [codeToId, setCodeToId] = useState<Record<string, string>>({})
  const [idToCode, setIdToCode] = useState<Record<string, string>>({})
  const [qcLevels, setQcLevels] = useState<Array<{ id: string; name: string }>>([])
  const [limitsByLevel, setLimitsByLevel] = useState<Record<string, Limits | null>>({})
  const [pointsByLevel, setPointsByLevel] = useState<Record<string, Point[]>>({})
  const [contributorsByLevel, setContributorsByLevel] = useState<Record<string, string[]>>({})
  const chartRefs = useRef<Array<SVGSVGElement|null>>([])
  const [activeTab, setActiveTab] = useState(0)
  const [noteText, setNoteText] = useState('')
  const [westgardRules, setWestgardRules] = useState<Array<{ code: string; severity: 'warning'|'error'|'critical'; params: any }>>([])

  // Tạo danh sách charts động từ tất cả QC levels (ID + tên thật)
  const charts = React.useMemo(() => {
    return (qcLevels || []).map(lvl => ({
      qcLevelId: lvl.id,
      qcLevelName: lvl.name,
      points: pointsByLevel[lvl.id] || [],
      limits: limitsByLevel[lvl.id] || { mean: 0, sd: 1 }
    }))
  }, [qcLevels, pointsByLevel, limitsByLevel])

  const data = {
    charts
  }

  const allContributors = React.useMemo(() => {
    const all: string[] = []
    Object.values(contributorsByLevel || {}).forEach(list => {
      (list || []).forEach(name => { if (name && !all.includes(name)) all.push(name) })
    })
    return all
  }, [contributorsByLevel])

  // Initialize from context if coming from EntryPage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lj_ctx')
      if (raw) {
        const ctx = JSON.parse(raw)
        if (ctx?.lotCode) setSelectedLot(ctx.lotCode)
        if (ctx?.lotId) setSelectedLotId(ctx.lotId)
        if (ctx?.machineId) setSelectedMachine(ctx.machineId)
        if (ctx?.range && ctx.range[0] && ctx.range[1]) setRange([dayjs(ctx.range[0]), dayjs(ctx.range[1])] as any)
      }
    } catch {}
  }, [])

  // Load Westgard rules
  useEffect(() => {
    (async () => {
      try {
        const response = await westgardService.list({ page: 1, pageSize: 1000 })
        if (response.success && response.data && 'items' in response.data) {
          const rules = response.data.items.map((rule: any) => ({
            code: rule.code || rule.name,
            severity: rule.severity,
            params: {
              type: rule.code || rule.name,
              window_size: rule.windowSize,
              threshold_sd: rule.thresholdSd,
              consecutive_points: rule.consecutivePoints,
              same_side: rule.sameSide,
              opposite_sides: rule.oppositeSides,
              sum_abs_z_gt: rule.sumAbsZGt,
              expression: rule.expression
            }
          }))
          setWestgardRules(rules)
        } else {
          setWestgardRules([])
        }
      } catch (e) {
        console.error('Load Westgard rules failed:', e)
        setWestgardRules([])
      }
    })()
  }, [])

  // Load current user info from localStorage (được set sau khi đăng nhập)
  useEffect(() => {
    try {
      // Lấy đúng "Chức vụ" (position) thay vì role nội bộ
      const position = localStorage.getItem('position') || localStorage.getItem('roleDisplay') || ''
      const fullName = localStorage.getItem('fullName') || localStorage.getItem('username') || ''
      setUserPosition(position)
      setUserFullName(fullName)
    } catch {}
  }, [])

  // Load lots
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const response = await lotService.list({ page: 1, pageSize: 1000 })
        if (!mounted) return
        if (response.success && response.data) {
          const lots = 'items' in response.data ? response.data.items : response.data
          const opts = lots.map((l: any) => ({ value: l.code, label: l.code, id: l.id }))
          setLotOptions(opts)
          // If context already set lotId, keep it; otherwise default to first
          if (!selectedLotId) {
            setSelectedLot(opts[0]?.value || '')
            setSelectedLotId(lots[0]?.id || '')
          }
        }
      } catch (error) {
        console.error('Error loading lots:', error)
      }
    })()
    return () => { mounted = false }
  }, [selectedLotId])

  // Load machines by lot
  useEffect(() => {
    ;(async () => {
      try {
        if (!selectedLotId) { setMachineOptions([]); setSelectedMachine(''); return }
        const response = await machineService.list({ lotId: selectedLotId, page: 1, pageSize: 1000 })
        if (response.success && response.data) {
          const machines = 'items' in response.data ? response.data.items : response.data
          if (machines?.length) {
            const opts = machines.map((m: any) => ({ value: m.id, label: `${m.deviceCode} - ${m.name}` }))
            setMachineOptions(opts)
            // Respect preselected machineId from context
            if (!selectedMachine || !opts.some((o: any) => o.value === selectedMachine)) {
              setSelectedMachine(opts[0]?.value || '')
            }
          } else {
            setMachineOptions([])
            setSelectedMachine('')
          }
        } else {
          setMachineOptions([])
          setSelectedMachine('')
        }
      } catch (error) {
        console.error('Error loading machines:', error)
        setMachineOptions([])
      }
    })()
  }, [selectedLotId])

  // Load analytes and QC levels for lot + machine
  // Load analytes when lot + machine selected
  useEffect(() => {
    ;(async () => {
      try {
        if (!selectedLotId || !selectedMachine) { 
          setAnalyteOptions([])
          setQcLevels([])
          setLimitsByLevel({})
          setPointsByLevel({})
          return 
        }
        
        // Load all analytes
        const analytesResponse = await analyteService.list({ page: 1, pageSize: 1000 })
        const analytes = analytesResponse.success && analytesResponse.data ? 
          ('items' in analytesResponse.data ? analytesResponse.data.items : analytesResponse.data) : []
        
        const _codeToId: Record<string, string> = {}
        const _idToCode: Record<string, string> = {}
        ;(analytes || []).forEach((a: any) => { if (a?.code && a?.id) { _codeToId[a.code] = a.id; _idToCode[a.id] = a.code } })
        setCodeToId(_codeToId)
        setIdToCode(_idToCode)
        
        // Show all analytes for selection
        const opts = (analytes || []).map((a: any) => ({
          value: a.id,
          label: a.name || a.code || a.id
        })).sort((a, b) => a.label.localeCompare(b.label, 'vi', { numeric: true }))
        
        console.log('[LJ] analyteOptions loaded:', opts)
        setAnalyteOptions(opts)
        
        // Reset other states
        setQcLevels([])
        setLimitsByLevel({})
        setPointsByLevel({})
        
      } catch (error) {
        console.error('Error loading analytes:', error)
        setAnalyteOptions([])
        setQcLevels([])
        setLimitsByLevel({})
        setPointsByLevel({})
      }
    })()
  }, [selectedLotId, selectedMachine])

  // Load limits and QC levels when analyte is selected
  useEffect(() => {
    ;(async () => {
      try {
        if (!selectedLotId || !selectedMachine || !activeAnalyte) { 
          setQcLevels([])
          setLimitsByLevel({})
          setPointsByLevel({})
          return 
        }
        
        // Load limits for this lot + machine + analyte
        const limitsResponse = await limitService.list({ 
          lotId: selectedLotId, 
          machineId: selectedMachine,
          analyteId: activeAnalyte,
          page: 1, 
          pageSize: 1000 
        })
        
        if (limitsResponse.success && limitsResponse.data) {
          const limits = 'items' in limitsResponse.data ? limitsResponse.data.items : limitsResponse.data
          console.log('[LJ] limits loaded for analyte:', activeAnalyte, limits)
          
          // Get unique QC levels from limits
          const qcLevelMap = new Map()
          limits.forEach((limit: any) => {
            if (limit.qcLevel && limit.qcLevelId) {
              qcLevelMap.set(limit.qcLevelId, {
                id: limit.qcLevelId,
                name: typeof limit.qcLevel === 'string' ? limit.qcLevel : limit.qcLevel.name
              })
            }
          })
          
          let levels = Array.from(qcLevelMap.values())
          // Sort QC levels naturally so QC1, QC2, QC3 ... (top-down)
          levels = levels.sort((a: any, b: any) => {
            const na = parseInt(String(a?.name || '').replace(/\D+/g, '')) || 0
            const nb = parseInt(String(b?.name || '').replace(/\D+/g, '')) || 0
            if (na !== nb) return na - nb
            return String(a?.name || '').localeCompare(String(b?.name || ''), 'vi', { numeric: true })
          })
          console.log('[LJ] qcLevels extracted (sorted):', levels)
          setQcLevels(levels)
          
          // Group limits by QC level
          const limitsByLevel: Record<string, any> = {}
          limits.forEach((limit: any) => {
            if (limit.qcLevelId) {
              limitsByLevel[limit.qcLevelId] = {
                ...limit,
                inputDate: (limit as any).inputDate
              }
            }
          })
          setLimitsByLevel(limitsByLevel)
        } else {
          setQcLevels([])
          setLimitsByLevel({})
        }
        
        setPointsByLevel({})
      } catch (error) {
        console.error('Error loading limits and QC levels:', error)
        setQcLevels([])
        setLimitsByLevel({})
        setPointsByLevel({})
      }
    })()
  }, [selectedLotId, selectedMachine, activeAnalyte])


  // Load entries for the active analyte for ALL QC levels
  useEffect(() => {
    ;(async () => {
      try {
        if (!selectedLotId || !selectedMachine || !activeAnalyte) { setPointsByLevel({}); return }
        
        const withinRange = (d: string) => {
          if (!range || !range[0] || !range[1]) return true
          const dt = dayjs(d)
          return (dt.isAfter(range[0], 'day') || dt.isSame(range[0], 'day')) && (dt.isBefore(range[1], 'day') || dt.isSame(range[1], 'day'))
        }
        
        const map = (rows: any[]): Point[] => {
          // Do not aggregate; plot every result as its own point
          return (rows || [])
            .filter(r => r.analyteId === activeAnalyte)
            .map(r => ({ 
              // Prefer domain date field; fall back to possible aliases
              date: (r.entryDate || r.date || r.createdAt), 
              value: Number(r.value),
              createdAt: r.createdAt, // Add createdAt for secondary sort
              createdBy: r.createdBy, // Add createdBy for tooltip
              updatedBy: r.updatedBy  // Add updatedBy for tooltip
            }))
            .filter(p => p.date && withinRange(p.date))
            .sort((a, b) => {
              // First sort by date
              const dateA = new Date(a.date).getTime()
              const dateB = new Date(b.date).getTime()
              if (dateA !== dateB) {
                return dateA - dateB
              }
              // If same date, sort by createdAt
              const createdA = new Date(a.createdAt).getTime()
              const createdB = new Date(b.createdAt).getTime()
              return createdA - createdB
            })
        }
        
        const nextPoints: Record<string, Point[]> = {}
        const nextContributors: Record<string, string[]> = {}
        for (const lvl of (qcLevels || [])) {
          const response = await entryService.list({
            lotId: selectedLotId,
            machineId: selectedMachine,
            qcLevelId: lvl.id,
            analyteId: activeAnalyte,
            page: 1,
            pageSize: 1000
          })
          
          if (response.success && response.data) {
            const entries = 'items' in response.data ? response.data.items : response.data
            console.log('[LJ] entriesByLevel', { level: lvl, entries })
            nextPoints[lvl.id] = map(entries || [])
            // Build unique contributor names from createdBy/updatedBy within range
            const namesSet = new Set<string>()
            ;(entries || []).forEach((e: any) => {
              const d = (e.entryDate || e.date || e.createdAt)
              if (!d || !withinRange(d)) return
              if (e.createdBy && typeof e.createdBy === 'string') namesSet.add(e.createdBy)
              if (e.updatedBy && typeof e.updatedBy === 'string') namesSet.add(e.updatedBy)
            })
            nextContributors[lvl.id] = Array.from(namesSet)
          } else {
            nextPoints[lvl.id] = []
            nextContributors[lvl.id] = []
          }
        }
        console.log('[LJ] pointsByLevel', nextPoints)
        setPointsByLevel(nextPoints)
        setContributorsByLevel(nextContributors)
      } catch (error) {
        console.error('Error loading entries:', error)
        setPointsByLevel({})
        setContributorsByLevel({})
      }
    })()
  }, [selectedLotId, selectedMachine, activeAnalyte, range, qcLevels])

  return (
    <div>
      {/* Header: chức vụ:tên người đang đăng nhập */}
      <div style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#1677ff' }}>
        {userPosition || userFullName ? `Chức vụ: ${userPosition || '-'} • Tên: ${userFullName || '-'}` : ''}
      </div>
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Select
          placeholder="Chọn lô QC"
          value={selectedLot || undefined}
          style={{ width: 200 }}
          options={lotOptions}
          onChange={(v, option: any) => { setSelectedLot(v as string); setSelectedLotId(option?.id) }}
        />
        <Select
          placeholder="Chọn máy"
          value={selectedMachine || undefined}
          style={{ width: 220 }}
          options={machineOptions}
          onChange={(v) => setSelectedMachine(v as string)}
        />
        <Button onClick={() => (window.location.hash = 'limit')}>Thiết lập dải QC mới</Button>
        <Select 
          value={mode} 
          onChange={(v) => setMode(v as any)} 
          style={{ width: 180 }}
          options={[
            { label: 'Westgard', value: 'westgard' }, 
            { label: 'Levey Jenning', value: 'lj' }
          ]} 
        />
        <DatePicker.RangePicker value={range as any} onChange={(v)=> setRange(v as any)} />
        <Button type="primary" disabled={!selectedLot || !selectedMachine} onClick={async () => {
          try {
            message.loading({ content: 'Đang lưu biểu đồ...', key: 'lj-save', duration: 0 })
            const analyteName = analyteOptions.find(a => a.value === activeAnalyte)?.label || activeAnalyte
            const rangeText = range && range[0] && range[1] ? `${range[0].format('DD/MM/YYYY')} - ${range[1].format('DD/MM/YYYY')}` : ''
            const qcNames = (qcLevels || []).map(l => l.name)
            const chartsImgs: { title: string; pngDataUrl: string }[] = []
            // Export all rendered charts dynamically
            for (let i = 0; i < chartRefs.current.length; i++) {
              const el = chartRefs.current[i]
              if (el) {
                chartsImgs.push({ title: qcNames[i] || `QC${i + 1}`, pngDataUrl: await svgToPngDataUrl(el) })
              }
            }
            const params = (qcLevels || []).map(lvl => {
              const lim = limitsByLevel[lvl.id] || { mean: 0, sd: 0, cv: undefined as any, cvRef: undefined as any, unit: undefined as any, inputDate: undefined as any, exp: undefined as any, method: undefined as any }
              return { 
                qc: lvl.name, 
                mean: lim.mean, 
                sd: lim.sd, 
                cv: lim.cv, 
                cvRef: lim.cvRef, 
                unit: lim.unit, 
                inputDate: lim.inputDate ? dayjs(lim.inputDate).format('DD/MM/YYYY') : undefined,
                exp: lim.exp ? dayjs(lim.exp).format('DD/MM/YYYY') : undefined, 
                method: lim.method 
              }
            })
            // Build contributors by entry (per QC level)
            const contributorsEntries: Array<{ qc: string; date: string; value: number; createdBy?: string; updatedBy?: string }> = []
            for (const lvl of (qcLevels || [])) {
              const entriesResp = await entryService.list({
                lotId: selectedLotId,
                machineId: selectedMachine,
                qcLevelId: lvl.id,
                analyteId: activeAnalyte,
                page: 1,
                pageSize: 1000
              })
              const entries = entriesResp.success && entriesResp.data ? ('items' in entriesResp.data ? entriesResp.data.items : entriesResp.data) : []
              ;(entries || []).forEach((e: any) => {
                const d = (e.entryDate || e.date || e.createdAt)
                contributorsEntries.push({ qc: lvl.name, date: dayjs(d).format('DD/MM/YYYY'), value: Number(e.value), createdBy: e.createdBy, updatedBy: e.updatedBy })
              })
            }
            // Build violation rows per QC
            const violationsForExport: Array<{ qc: string; date: string; value: number; rules: string }> = []
            for (const lvl of (qcLevels || [])) {
              const pts = pointsByLevel[lvl.id] || []
              const lim = limitsByLevel[lvl.id]
              const sd = Number(lim?.sd || 0)
              const mean = Number(lim?.mean || 0)
              if (!sd) continue
              const values: number[] = []
              pts.forEach(p => {
                values.push(Number(p.value))
                const z = Math.abs((Number(p.value) - mean) / sd)
                if (z >= 2) {
                  violationsForExport.push({ qc: lvl.name, date: dayjs(p.date).format('DD/MM/YYYY'), value: Number(p.value), rules: z >= 3 ? '>=3SD' : '>=2SD' })
                }
              })
            }
            await exportLJToExcelWithCharts({
              analyteName,
              lotCode: selectedLot,
              machineLabel: machineOptions.find(m => m.value === selectedMachine)?.label || selectedMachine,
              rangeText,
              note: noteText,
              charts: chartsImgs,
              parameters: params,
              exportedBy: `${userFullName || ''}${userPosition ? ` (${userPosition})` : ''}`,
              contributorsEntries,
              violations: violationsForExport,
              filename: `lj_${analyteName}_${Date.now()}.xlsx`
            } as any)
            message.success({ content: 'Đã lưu file Excel kèm biểu đồ', key: 'lj-save' })
          } catch (e) {
            console.error('Export LJ to Excel error:', e)
            message.error({ content: 'Lưu thất bại. Kiểm tra console để xem chi tiết.', key: 'lj-save' })
          }
        }}>Lưu</Button>
      </Space>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 16, maxWidth: '1400px', margin: '0 auto' }}>
        {/* analyte list */}
        <Card size="small" title={<span style={{ fontWeight: 700 }}>Xét nghiệm</span>} bodyStyle={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {analyteOptions.map(item => (
              <div
                key={item.value}
                onClick={() => setActiveAnalyte(item.value)}
                style={{
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderBottom: '1px solid #f0f0f0',
                  background: item.value === activeAnalyte ? '#e6f4ff' : '#fff',
                  color: item.value === activeAnalyte ? '#1677ff' : '#1f1f1f',
                  fontWeight: 500,
                  transition: 'background .2s'
                }}
                onMouseEnter={(e)=> (e.currentTarget.style.background = item.value === activeAnalyte ? '#e6f4ff' : '#fafafa')}
                onMouseLeave={(e)=> (e.currentTarget.style.background = item.value === activeAnalyte ? '#e6f4ff' : '#fff')}
              >
                {item.label}
              </div>
            ))}
          </div>
        </Card>

        {/* charts */}
        <div style={{ maxWidth: '1000px', overflow: 'auto' }}>
          {/* Tab selector for charts */}
          <div style={{ margin: '0 0 8px 0', display: 'flex', gap: 8 }}>
            {[
              { key: 0, label: 'Biểu đồ 1' },
              { key: 1, label: 'Biểu đồ 2' },
              { key: 2, label: 'Biểu đồ 3' }
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid #d9d9d9', cursor: 'pointer',
                background: (activeTab === tab.key) ? '#1677ff' : '#fff', color: (activeTab === tab.key) ? '#fff' : '#1677ff',
                fontWeight: 600
              }}>{tab.label}</button>
            ))}
          </div>
          {data.charts.map((chart, index) => {
            const collapseLastPerDay = (pts: Point[]): Point[] => {
              const order: string[] = []
              const map: Record<string, Point> = {}
              pts.forEach(p => {
                const k = dayjs(p.date).format('YYYY-MM-DD')
                if (!order.includes(k)) order.push(k)
                map[k] = p // keep latest seen for that day
              })
              return order.map(k => map[k])
            }
            const filterViolations = (pts: Point[]): Point[] => {
              const sd = Number(chart.limits.sd) || 0
              if (!sd || !westgardRules.length) return []
              const mean = Number(chart.limits.mean) || 0
              const kept: Point[] = []
              const values: number[] = []
              pts.forEach(p => {
                values.push(Number(p.value))
                const r = (window as any).undefinedEvaluateWithRules
                // We will evaluate inline below to avoid extra imports
              })
              return kept
            }
            const displayPoints = activeTab === 1
              ? collapseLastPerDay(chart.points)
              : activeTab === 2
                ? (() => {
                    const sd = Number(chart.limits.sd) || 0
                    const mean = Number(chart.limits.mean) || 0
                    if (!sd) return chart.points
                    const kept: Point[] = []
                    const values: number[] = []
                    for (const p of chart.points) {
                      values.push(Number(p.value))
                      if (westgardRules && westgardRules.length) {
                        const res = evaluateWithRules(values, mean, sd, westgardRules)
                        // Biểu đồ 3: chỉ giữ các điểm KHÔNG lỗi (pass)
                        if (res.level === 'pass') kept.push(p)
                      } else {
                        const z = Math.abs((Number(p.value) - mean) / sd)
                        // Fallback: pass nếu |z| < 2SD
                        if (z < 2) kept.push(p)
                      }
                    }
                    return kept
                  })()
                : chart.points
            const names = contributorsByLevel[chart.qcLevelId] || []
            return (
              <div key={chart.qcLevelId}>
                <LJChartComp 
                  title={`${chart.qcLevelName}`} 
                  points={displayPoints} 
                  limits={chart.limits} 
                  westgardRules={westgardRules}
                  onRef={(el) => {
                    chartRefs.current[index] = el
                  }} 
                />
                {names.length > 0 && (
                  <div style={{ margin: '-6px 0 10px 54px', color: '#595959', fontSize: 12 }}>
                    <span style={{ color: '#8c8c8c' }}>Thành viên:</span> {names.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
          
          <Card size="small" style={{ marginTop: 12 }}>
            <div style={{ height: 120, display: 'flex', alignItems: 'center', padding: 8 }}>
              <span style={{ minWidth: 80, color: '#888' }}>Nhận xét</span>
              <textarea value={noteText} onChange={(e)=> setNoteText(e.target.value)} style={{ flex: 1, height: 90, border: '1px solid #e5e5e5', borderRadius: 6, padding: 8 }} placeholder="Nhập nhận xét..." />
            </div>
          </Card>
        </div>

        {/* limits info */}
        <Card size="small" title="Giới hạn kiểm soát">
          {data.charts.map((chart, index) => (
            <div key={chart.qcLevelId} style={{ marginBottom: index < data.charts.length - 1 ? 12 : 0 }}>
              <b>Control {chart.qcLevelName}</b>
              <div>* Mean: {chart.limits.mean}</div>
              <div>* SD: {chart.limits.sd}</div>
              <div>* Unit: {chart.limits.unit || '-'}</div>
              <div>* CV%: {chart.limits.cv ? `${chart.limits.cv}%` : '-'}</div>
              <div>* CV% REF: {chart.limits.cvRef ? `${chart.limits.cvRef}%` : '-'}</div>
              {chart.limits.inputDate && <div>* Ngày nhập: {dayjs(chart.limits.inputDate).format('DD/MM/YYYY')}</div>}
              {chart.limits.exp && <div>* Ngày hết hạn: {dayjs(chart.limits.exp).format('DD/MM/YYYY')}</div>}
              {chart.limits.method && <div>* PP: {chart.limits.method}</div>}
              <div>* +2SD: {(chart.limits.mean + 2 * chart.limits.sd).toFixed(2)}</div>
              <div>* -2SD: {(chart.limits.mean - 2 * chart.limits.sd).toFixed(2)}</div>
          </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

export default LJPage



