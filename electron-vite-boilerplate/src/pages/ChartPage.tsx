import React, { useMemo, useRef, useState } from 'react'
import { Button, DatePicker, Select, Space, Typography, Card } from 'antd'
import dayjs from 'dayjs'

type Point = { date: string; value: number }

type Limits = {
  mean: number
  sd: number
  unit?: string
}

const analyteOptions = [
  { value: 'WBC', label: 'WBC' },
  { value: 'Glucose', label: 'Glucose' },
  { value: 'AST', label: 'AST' },
]

const mockData: Record<string, { qc1: Point[]; qc2: Point[]; limits1: Limits; limits2: Limits }> = {
  WBC: {
    qc1: [
      { date: '2023-07-08', value: 19.1 },
      { date: '2023-07-10', value: 20.1 },
      { date: '2023-07-12', value: 20.2 },
    ],
    qc2: [
      { date: '2023-07-08', value: 149 },
      { date: '2023-07-10', value: 151 },
      { date: '2023-07-12', value: 148 },
    ],
    limits1: { mean: 20, sd: 5, unit: 'U/L' },
    limits2: { mean: 150, sd: 25, unit: 'U/L' },
  },
  Glucose: {
    qc1: [
      { date: '2023-07-09', value: 4.7 },
      { date: '2023-07-11', value: 5.1 },
      { date: '2023-07-15', value: 4.9 },
    ],
    qc2: [
      { date: '2023-07-09', value: 9.6 },
      { date: '2023-07-11', value: 10.2 },
      { date: '2023-07-15', value: 9.8 },
    ],
    limits1: { mean: 5, sd: 1, unit: 'mmol/L' },
    limits2: { mean: 10, sd: 2, unit: 'mmol/L' },
  },
  AST: {
    qc1: [
      { date: '2023-07-08', value: 19.9 },
      { date: '2023-07-10', value: 20.2 },
      { date: '2023-07-12', value: 19.7 },
    ],
    qc2: [
      { date: '2023-07-08', value: 149 },
      { date: '2023-07-10', value: 151 },
      { date: '2023-07-12', value: 152 },
    ],
    limits1: { mean: 20, sd: 5, unit: 'U/L' },
    limits2: { mean: 150, sd: 25, unit: 'U/L' },
  }
}

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
    const { mean, sd } = limits
    const arr = [mean + 3 * sd, mean - 3 * sd, ...points.map(p => p.value)]
    const min = Math.min(...arr)
    const max = Math.max(...arr)
    return { min, max }
  }, [limits, points])

  const yScale = (v: number) => {
    const { min, max } = allValues
    const t = (v - min) / (max - min || 1)
    return height - padding.bottom - t * plotHeight
  }
  const xScale = (i: number) => padding.left + (i / Math.max(points.length - 1, 1)) * plotWidth

  const lines = [
    { label: '+3SD', value: limits.mean + 3 * limits.sd, color: '#999' },
    { label: '+2SD', value: limits.mean + 2 * limits.sd, color: '#f5222d' },
    { label: '+1SD', value: limits.mean + 1 * limits.sd, color: '#999' },
    { label: 'Mean', value: limits.mean, color: '#1677ff' },
    { label: '-1SD', value: limits.mean - 1 * limits.sd, color: '#999' },
    { label: '-2SD', value: limits.mean - 2 * limits.sd, color: '#f5222d' },
    { label: '-3SD', value: limits.mean - 3 * limits.sd, color: '#999' },
  ]

  return (
    <Card size="small" style={{ marginBottom: 12, position: 'relative' }} title={title}>
      <div style={{ color: '#888', fontSize: 12, margin: '-8px 0 4px 54px' }}>
        N: {points.length} &nbsp; MEAN: {limits.mean} &nbsp; SD: {limits.sd} &nbsp; Unit: {limits.unit || ''}
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

const ChartPage: React.FC = () => {
  const [mode, setMode] = useState<'westgard' | 'lj'>('lj')
  const [range, setRange] = useState<[any, any] | null>([dayjs().startOf('month'), dayjs().endOf('month')])
  const [qc, setQc] = useState<'QC1' | 'QC2'>('QC1')
  const [activeAnalyte, setActiveAnalyte] = useState('WBC')
  const [selectedLot, setSelectedLot] = useState<string>('')
  const [selectedMachine, setSelectedMachine] = useState<string>('')
  const qc1Ref = useRef<SVGSVGElement|null>(null)
  const qc2Ref = useRef<SVGSVGElement|null>(null)

  const data = mockData[activeAnalyte]

  return (
    <div>
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Select
          placeholder="Chọn lô QC"
          value={selectedLot}
          style={{ width: 160 }}
          options={[{ value: '2.6C 980', label: '2.6C 980' }, { value: '+19', label: '+19' }]}
          onChange={setSelectedLot}
        />
        <Select
          placeholder="Chọn máy"
          value={selectedMachine}
          style={{ width: 160 }}
          options={[{ value: 'AU680', label: 'AU680' }, { value: 'DxH900', label: 'DxH 900' }]}
          onChange={setSelectedMachine}
        />
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
        <Select value={qc} style={{ width: 180 }} options={[{ value: 'QC1', label: 'Control serum 1' }, { value: 'QC2', label: 'Control serum 2' }]} onChange={(v)=> setQc(v)} />
        <Button disabled={!selectedLot || !selectedMachine} onClick={()=>window.print()}>In</Button>
        <Button type="primary" disabled={!selectedLot || !selectedMachine} onClick={()=>{
          if(qc1Ref.current) exportSVG(qc1Ref.current, `${activeAnalyte}-QC1.svg`)
          if(qc2Ref.current) exportSVG(qc2Ref.current, `${activeAnalyte}-QC2.svg`)
        }}>Lưu biểu đồ</Button>
      </Space>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 16 }}>
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
        <div>
          <Typography.Title level={5} style={{ marginTop: 0 }}>Xét nghiệm {activeAnalyte}</Typography.Title>
          <LJChart title="Mức QC Control QC1" points={data.qc1} limits={data.limits1} onRef={(el)=> qc1Ref.current = el} />
          <LJChart title="Mức QC Control QC 2" points={data.qc2} limits={data.limits2} onRef={(el)=> qc2Ref.current = el} />
          <Card size="small" style={{ marginTop: 12 }}>
            <div style={{ height: 120, display: 'flex', alignItems: 'center', padding: 8 }}>
              <span style={{ minWidth: 80, color: '#888' }}>Nhận xét</span>
              <textarea style={{ flex: 1, height: 90, border: '1px solid #e5e5e5', borderRadius: 6, padding: 8 }} placeholder="Nhập nhận xét..." />
            </div>
          </Card>
        </div>

        {/* limits info */}
        <Card size="small" title="Giới hạn kiểm soát">
          <div style={{ marginBottom: 12 }}>
            <b>Control QC1</b>
            <div>* Mean: {data.limits1.mean}</div>
            <div>* SD: {data.limits1.sd}</div>
            <div>* Unit: {data.limits1.unit}</div>
            <div>* +2SD: {(data.limits1.mean + 2 * data.limits1.sd).toFixed(2)}</div>
            <div>* -2SD: {(data.limits1.mean - 2 * data.limits1.sd).toFixed(2)}</div>
          </div>
          <div>
            <b>Control QC 2</b>
            <div>* Mean: {data.limits2.mean}</div>
            <div>* SD: {data.limits2.sd}</div>
            <div>* Unit: {data.limits2.unit}</div>
            <div>* +2SD: {(data.limits2.mean + 2 * data.limits2.sd).toFixed(2)}</div>
            <div>* -2SD: {(data.limits2.mean - 2 * data.limits2.sd).toFixed(2)}</div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ChartPage