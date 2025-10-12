import React, { useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
// Westgard sequence checks are disabled for LJ chart coloring per request

export type Point = { date: string; value: number }
export type Limits = { mean: number; sd: number; unit?: string; cv?: number; cvRef?: number; exp?: string; method?: string }

const LJChart: React.FC<{ title: string; points: Point[]; limits: Limits; width?: number; height?: number; onRef?: (el: SVGSVGElement|null)=>void }>
  = ({ title, points, limits, width = 800, height = 220, onRef }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const padding = { left: 70, right: 10, top: 30, bottom: 40 }
  const CELL_WIDTH = 40
  const innerWidth = Math.max(width, padding.left + padding.right + Math.max(points.length, 1) * CELL_WIDTH)
  const plotWidth = innerWidth - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  // Simple per-point layout: each point occupies an equal-spaced cell on the X axis

  // Derived statistics from points for display (not for control lines)
  const derived = useMemo(() => {
    const values = (points || []).map(p => Number(p.value)).filter(v => isFinite(v))
    const n = values.length
    if (n === 0) return { mean: NaN, sd: NaN, cv: NaN }
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / n
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? (n - 1) : 1)
    const sd = Math.sqrt(variance)
    const cv = mean !== 0 ? (sd / mean) * 100 : NaN
    return { mean, sd, cv }
  }, [points])

  const allValues = useMemo(() => {
    const { mean, sd } = limits
    // Clamp Y range to mean ± 3SD to avoid visual collapse when there are outliers
    if (isFinite(sd) && Math.abs(sd) > 0) {
      const min = mean - 3 * sd
      const max = mean + 3 * sd
      return { min, max }
    }
    // Fallback if SD is invalid: derive from points with small padding
    const vals = points.map(p => p.value)
    let min = Math.min(...vals)
    let max = Math.max(...vals)
    if (!isFinite(min) || !isFinite(max) || min === max) {
      const base = isFinite(mean) ? mean : 0
      min = base - 1
      max = base + 1
    }
    return { min, max }
  }, [limits, points])

  const yScale = (v: number) => {
    const { min, max } = allValues
    const clamped = Math.min(Math.max(v, min), max)
    const t = (clamped - min) / (max - min || 1)
    return height - padding.bottom - t * plotHeight
  }
  const xScale = (i: number) => {
    if (points.length <= 1) return padding.left + plotWidth / 2
    return padding.left + i * CELL_WIDTH
  }

  const hasSd = isFinite(limits.sd) && Math.abs(limits.sd) > 0
  const lines = hasSd ? [
    { label: '+3SD', value: limits.mean + 3 * limits.sd, color: '#333' },
    { label: '+2SD', value: limits.mean + 2 * limits.sd, color: '#f5222d' },
    { label: '+1SD', value: limits.mean + 1 * limits.sd, color: '#333' },
    { label: 'Mean', value: limits.mean, color: '#1677ff' },
    { label: '-1SD', value: limits.mean - 1 * limits.sd, color: '#333' },
    { label: '-2SD', value: limits.mean - 2 * limits.sd, color: '#f5222d' },
    { label: '-3SD', value: limits.mean - 3 * limits.sd, color: '#333' },
  ] : [
    { label: 'Mean', value: limits.mean, color: '#1677ff' }
  ]

  // No sequence-based Westgard evaluation here

  return (
    <div className="lj-chart-card" style={{ marginBottom: 12, position: 'relative' }}>
      <div style={{ fontWeight: 600, margin: '0 0 8px 0' }}>{title}</div>
      <div style={{ color: '#888', fontSize: 12, margin: '-8px 0 4px 54px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>N: {points.length}</span>
        <span>MEAN: {isFinite(derived.mean) ? Number(derived.mean.toFixed(2)) : '-'}</span>
        <span>SD: {isFinite(derived.sd) ? Number(derived.sd.toFixed(2)) : '-'}</span>
        {isFinite(derived.cv) && <span>CV%: {Number(derived.cv.toFixed(2))}</span>}
        {limits.exp && <span>EXP: {dayjs(limits.exp).format('DD/MM/YYYY')}</span>}
        {limits.unit && <span>Unit: {limits.unit}</span>}
        {limits.method && <span>PP: {limits.method}</span>}
        {/* Removed +2SD / -2SD inline display per request */}
      </div>
      
      {/* Legend cho màu sắc Westgard */}
      <div style={{ color: '#666', fontSize: 11, margin: '4px 0 8px 54px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
          Trong kiểm soát (±2SD)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#faad14' }}></div>
          Cảnh báo (±2SD)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff4d4f' }}></div>
          Ngoài kiểm soát (±3SD)
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
      <svg ref={(el)=>{ svgRef.current = el; onRef?.(el) }} width={innerWidth} height={height}>
        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} fill="#fff" stroke="#d9d9d9" />
        {lines.map((l, idx) => (
          <g key={idx}>
            <line x1={padding.left} x2={padding.left + plotWidth} y1={yScale(l.value)} y2={yScale(l.value)} stroke={l.color} strokeWidth={1} />
            <text x={padding.left - 12} y={yScale(l.value) + 4} fontSize={12} fontWeight={600} textAnchor="end" fill={l.label === 'Mean' ? '#1677ff' : l.label.includes('2SD') ? '#f5222d' : '#333'}>{l.label}</text>
          </g>
        ))}
        {/* vertical grid per point (each point is a cell) */}
        {Array.from({ length: Math.max(points.length, 2) }).map((_, i) => {
          const x = padding.left + i * CELL_WIDTH
          return (
            <g key={`pt-${i}`}>
              <line x1={x} x2={x} y1={padding.top} y2={padding.top + plotHeight} stroke="#e8e8e8" />
              {i < points.length && (
                <text x={x} y={height - 8} fontSize={12} textAnchor="middle" fill="#888">{dayjs(points[i].date).format('D/M')}</text>
              )}
            </g>
          )
        })}
        {(points || []).map((p, i) => {
          // Simple coloring: based on z-score only
          const getPointColor = (value: number) => {
            const { mean, sd } = limits
            if (!sd || !isFinite(sd)) return '#52c41a'
            const z = Math.abs((value - mean) / sd)
            if (z >= 3) return '#ff4d4f'
            if (z >= 2) return '#faad14'
            return '#52c41a'
          }
          
          // CV% warning
          const getCVWarning = () => {
            if (limits.cv && limits.cvRef && limits.cv > limits.cvRef) {
              return '⚠️ CV% vượt ngưỡng'
            }
            return ''
          }
          
          const pointColor = getPointColor(p.value)
          const cvWarning = getCVWarning()
          
          return (
            <g key={i}>
              {i > 0 && (
                <line 
                  x1={xScale(i - 1)} 
                  y1={yScale(points[i - 1].value)} 
                  x2={xScale(i)} 
                  y2={yScale(p.value)} 
                  stroke="#000" 
                  strokeWidth={1.5} 
                />
              )}
              <circle 
                cx={xScale(i)} 
                cy={yScale(p.value)} 
                r={4} 
                fill={pointColor}
                stroke="#fff"
                strokeWidth={1}
                onMouseEnter={(e)=> setTip({ 
                  x: e.clientX, 
                  y: e.clientY, 
                  text: `${dayjs(p.date).format('DD/MM')} • ${p.value}${cvWarning ? ` • ${cvWarning}` : ''}` 
                })}
                onMouseLeave={()=> setTip(null)}
              />
              {/* label rendered above per point */}
            </g>
          )
        })}
      </svg>
      </div>
      {tip && (
        <div style={{ position: 'fixed', left: tip.x + 8, top: tip.y + 8, background: '#fff', border: '1px solid #e5e5e5', boxShadow: '0 2px 6px rgba(0,0,0,.15)', padding: '4px 6px', fontSize: 12 }}>
          {tip.text}
        </div>
      )}
    </div>
  )
}

export default LJChart


