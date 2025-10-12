import React, { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Input, Select, Space, Table, Tag, Tooltip } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

type Row = {
  id: string
  test: string
  analyteId: string
  qc: string
  qcLevelId: string
  target: number
  mean: number
  sd: number
  bias: number
  tea: number
  entriesCount: number
}

const SigmaPage: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [range, setRange] = useState<[any, any] | null>(null)
  const [lot, setLot] = useState<string>('')
  const [lotId, setLotId] = useState<string>('')
  const [machine, setMachine] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Load lots and machines from backend
  const [lotOptions, setLotOptions] = useState<Array<{ value: string; label: string; id?: string }>>([])
  const [machineOptions, setMachineOptions] = useState<Array<{ value: string; label: string }>>([])

  // Load lots on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const lots = await (window as any).iqc?.lookups?.lots?.()
        if (!mounted) return
        
        const opts = (lots || []).map((l: any) => ({ value: l.code, label: l.code, id: l.id }))
        setLotOptions(opts)
        if (opts[0]) {
          setLot(opts[0].value)
          setLotId(opts[0].id || '')
        }
      } catch (err) {
        console.error('Failed to load lots:', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Load machines by selected lot
  useEffect(() => {
    ;(async () => {
      try {
        if (!lotId) { setMachineOptions([]); setMachine(''); return }
        const machines = await (window as any).iqc?.lookups?.machinesByLotId?.(lotId)
        const opts = (machines || []).map((m: any) => ({ value: m.id, label: `${m.device_code} - ${m.name}` }))
        setMachineOptions(opts)
        if (!machine || !opts.some((o: { value: string }) => o.value === machine)) {
          setMachine(opts[0]?.value || '')
        }
      } catch (err) {
        console.error('Failed to load machines:', err)
        setMachineOptions([])
      }
    })()
  }, [lotId])

  // Load sigma data when filters change
  useEffect(() => {
    if (lotId && machine) {
      loadSigmaData()
    } else {
      setRows([])
    }
  }, [lotId, machine, range])

  const loadSigmaData = async () => {
    try {
      const from = range?.[0]?.format?.('YYYY-MM-DD') || null
      const to = range?.[1]?.format?.('YYYY-MM-DD') || null
      
      console.log('='.repeat(80))
      console.log('[Sigma] 🚀 Loading Sigma data with filters:', { 
        lotId, 
        lotCode: lot,
        machineId: machine, 
        from, 
        to 
      })
      
      // Step 1: Get all qc_limits for this lot and machine (for TEA, Target)
      const limits = await (window as any).iqc?.limits?.listByLotMachine?.(lotId, machine)
      console.log('[Sigma] 📋 Step 1 - Limits (specifications) received:', limits?.length || 0)
      console.log('[Sigma] Limits data:', JSON.stringify(limits, null, 2))
      
      if (!limits || limits.length === 0) {
        console.log('[Sigma] ⚠️ No limits found, stopping')
        setRows([])
        return
      }

      // Step 2: For each limit (analyte + qc_level), get entries and calculate statistics
      const mapped: Row[] = []
      
      for (const limit of limits) {
        const analyteId = limit.analyte_id
        const qcLevelId = limit.qc_level_id
        const analyteName = limit.analyte_name || limit.analyte_code || analyteId
        const qcLevelName = limit.qc_level_name || qcLevelId
        
        console.log(`\n[Sigma] 🔍 Processing: ${analyteName} - ${qcLevelName}`)
        console.log(`[Sigma]   Analyte ID: ${analyteId}, QC Level ID: ${qcLevelId}`)
        
        try {
          // Get entries for this analyte + qc_level + machine in date range
          const entries = await (window as any).iqc?.entries?.listByContext?.(
            lotId,
            qcLevelId,
            machine,
            from,
            to
          )
          
          console.log(`[Sigma]   📊 Step 2 - Entries received: ${entries?.length || 0}`)
          if (entries && entries.length > 0) {
            console.log(`[Sigma]   First 5 entries:`, entries.slice(0, 5).map((e: any) => ({
              date: e.entry_date,
              value: e.value,
              analyte: e.analyte_code || e.analyte_id
            })))
          }
          
          // Filter entries for this specific analyte
          const analyteEntries = (entries || []).filter((e: any) => {
            const entryAnalyteId = e.analyte_id || e.analyte_code
            return entryAnalyteId === analyteId || entryAnalyteId === limit.analyte_code
          })
          
          console.log(`[Sigma]   ✅ Filtered entries for ${analyteName}: ${analyteEntries.length}`)
          
          // Calculate statistics from actual QC data
          let calculatedMean = 0
          let calculatedSD = 0
          let calculatedBias = 0
          const entriesCount = analyteEntries.length
          
          if (analyteEntries.length > 0) {
            const values = analyteEntries.map((e: any) => e.value)
            
            // Calculate Mean
            calculatedMean = values.reduce((sum: number, v: number) => sum + v, 0) / values.length
            
            // Calculate SD
            const variance = values.reduce((sum: number, v: number) => sum + Math.pow(v - calculatedMean, 2), 0) / values.length
            calculatedSD = Math.sqrt(variance)
            
            // Calculate Bias% = |(Mean - Target) / Target| × 100
            const target = limit.mean || 0  // Target from qc_limits
            if (target !== 0) {
              calculatedBias = Math.abs((calculatedMean - target) / target) * 100
            }
            
            console.log(`[Sigma]   📈 Calculated statistics:`)
            console.log(`[Sigma]      Target (from limits): ${target.toFixed(2)}`)
            console.log(`[Sigma]      Mean (from entries): ${calculatedMean.toFixed(2)}`)
            console.log(`[Sigma]      SD (from entries): ${calculatedSD.toFixed(3)}`)
            console.log(`[Sigma]      CV%: ${((calculatedSD / calculatedMean) * 100).toFixed(2)}%`)
            console.log(`[Sigma]      Bias%: ${calculatedBias.toFixed(2)}%`)
            console.log(`[Sigma]      TEA% (from limits): ${limit.tea || 0}%`)
            
            const cv = (calculatedSD / calculatedMean) * 100
            const sigma = cv > 0 ? (limit.tea - calculatedBias) / cv : 0
            console.log(`[Sigma]      Sigma: ${sigma.toFixed(2)}`)
          } else {
            console.log(`[Sigma]   ⚠️ No entries found, using limit values`)
            calculatedMean = limit.mean || 0
            calculatedSD = limit.sd || 0
            calculatedBias = limit.bias_eqa || 0
          }
          
          mapped.push({
            id: limit.id,
            test: analyteName,
            analyteId: analyteId,
            qc: qcLevelName,
            qcLevelId: qcLevelId,
            target: limit.mean || 0,  // Target from limits
            mean: calculatedMean,     // Mean from entries
            sd: calculatedSD,         // SD from entries
            bias: calculatedBias,     // Bias calculated
            tea: limit.tea || 0,      // TEA from limits
            entriesCount: entriesCount
          })
        } catch (error) {
          console.error(`[Sigma]   ❌ Error processing ${analyteName}:`, error)
        }
      }

      console.log('\n[Sigma] 📊 Final mapped rows:', mapped.length)
      console.log('[Sigma] Summary:', mapped.map(r => ({
        test: r.test,
        qc: r.qc,
        entriesCount: r.entriesCount,
        mean: r.mean.toFixed(2),
        sd: r.sd.toFixed(3),
        bias: r.bias.toFixed(2),
        tea: r.tea
      })))
      console.log('='.repeat(80))
      
      setRows(mapped)
    } catch (err) {
      console.error('[Sigma] ❌ Failed to load data:', err)
      setRows([])
    }
  }

  // Filter by search text FIRST
  const filteredRows = useMemo(() => {
    if (!searchText) return rows
    const searchLower = searchText.toLowerCase()
    return rows.filter(item => 
      item.test.toLowerCase().includes(searchLower)
    )
  }, [rows, searchText])

  // Prepare rowSpan for grouped display by test
  const withSpan = useMemo(() => {
    const out: (Row & { __span?: number; __stt?: number })[] = []
    const groups = new Map<string, Row[]>()
    filteredRows.forEach(r => {
      const arr = groups.get(r.test) || []
      arr.push(r)
      groups.set(r.test, arr)
    })
    let stt = 1
    groups.forEach(arr => {
      arr.forEach((r, idx) => {
        out.push({ ...r, __span: idx === 0 ? arr.length : 0, __stt: idx === 0 ? stt : undefined })
      })
      stt += 1
    })
    return out
  }, [filteredRows])

  const columns = useMemo(() => ([
    { 
      title: 'STT', 
      width: 60, 
      fixed: 'left' as const, 
      render: (_: any, r: any) => {
        return {
          children: r.__stt,
          props: { rowSpan: r.__span ?? 0 }
        }
      } 
    },
    { 
      title: 'Test', 
      dataIndex: 'test', 
      width: 150,
      fixed: 'left' as const, 
      render: (v: any, r: any) => ({ 
        children: v, 
        props: { rowSpan: r.__span ?? 0 } 
      }) 
    },
    { title: 'QC', dataIndex: 'qc', width: 120 },
    { 
      title: 'N', 
      dataIndex: 'entriesCount', 
      width: 60,
      render: (v: number) => v || 0
    },
    { 
      title: 'Target', 
      dataIndex: 'target', 
      width: 100, 
      render: (v: number) => {
        if (v === 0 || !isFinite(v)) return 'NaN'
        return v.toFixed(1)
      }
    },
    { 
      title: 'Mean', 
      dataIndex: 'mean', 
      width: 100, 
      render: (v: number) => {
        if (v === 0) return 'NaN'
        return v.toFixed(1)
      }
    },
    { 
      title: 'SD', 
      dataIndex: 'sd', 
      width: 90, 
      render: (v: number) => {
        if (v === 0) return '0'
        return v.toFixed(1)
      }
    },
    { 
      title: 'CV%', 
      width: 90, 
      render: (_: any, r: Row) => {
        if (r.mean === 0 || r.sd === 0) return 'NaN'
        const cv = (r.sd / r.mean) * 100
        return (
          <Tooltip title={`CV% = (SD / Mean) × 100\nSD = ${r.sd.toFixed(1)}, Mean = ${r.mean.toFixed(1)}\n→ CV% = ${cv.toFixed(2)}%`}>
            <span>{cv.toFixed(1)}</span>
          </Tooltip>
        )
      }
    },
    { 
      title: 'Bias%', 
      dataIndex: 'bias', 
      width: 90, 
      render: (v: number) => {
        if (v === 0) return 'NaN'
        return (
          <Tooltip title={`Bias% = |(Mean - Target) / Target| × 100\n→ Bias% = ${v.toFixed(2)}%`}>
            <span>{v.toFixed(1)}</span>
          </Tooltip>
        )
      }
    },
    { 
      title: 'TE', 
      width: 90, 
      render: (_: any, r: Row) => {
        if (r.target === 0 || r.mean === 0) return 'NaN'
        const te = ((r.mean - r.target) / r.target) * 100
        return (
          <Tooltip title={`TE = ((Mean - Target) / Target) × 100\nMean = ${r.mean.toFixed(1)}, Target = ${r.target.toFixed(1)}\n→ TE = ${te.toFixed(2)}%\nTEA% = ${r.tea || 0}%`}>
            <span>{te.toFixed(1)}</span>
          </Tooltip>
        )
      }
    },
    { 
      title: 'TEA%', 
      dataIndex: 'tea', 
      width: 90, 
      render: (v: number) => {
        if (v === 0) return ''
        return v.toFixed(0)
      }
    },
    { 
      title: 'Sigma', 
      width: 120, 
      render: (_: any, r: Row) => {
        const cv = (r.sd / (r.mean || 1)) * 100
        if (cv === 0 || r.tea === 0) return <Tag color="volcano">NaN</Tag>
        const sigma = (r.tea - Math.abs(r.bias)) / cv
        const color = sigma >= 6 ? 'green' : sigma >= 4 ? 'blue' : sigma >= 3 ? 'orange' : 'red'
        return (
          <Tooltip title={`Sigma = (TEA% - |Bias%|) / CV%\nTEA% = ${r.tea || 0}%, Bias% = ${Math.abs(r.bias).toFixed(2)}%, CV% = ${cv.toFixed(2)}%\n→ Sigma = ${sigma.toFixed(2)}`}>
            <Tag color={color}>{sigma.toFixed(1)}</Tag>
          </Tooltip>
        )
      }
    },
    { 
      title: 'Westgard đơn quy tắc', 
      width: 200,
      render: (_: any, r: Row) => {
        const cv = (r.sd / (r.mean || 1)) * 100
        if (cv === 0 || r.tea === 0) return ''
        const sigma = (r.tea - Math.abs(r.bias)) / cv
        
        // Tính số sample tối đa cho Westgard đơn quy tắc
        if (sigma >= 6) {
          return '1-3s (2 samples)'
        } else if (sigma >= 5) {
          return '1-3s (2 samples)'
        } else if (sigma >= 4) {
          return '1-3s (2 samples)'
        } else if (sigma >= 3) {
          return '1-3s (4 samples)'
        } else {
          return '1-3s (6+ samples)'
        }
      }
    },
    { 
      title: 'Westgard đa quy tắc', 
      width: 200,
      render: (_: any, r: Row) => {
        const cv = (r.sd / (r.mean || 1)) * 100
        if (cv === 0 || r.tea === 0) return ''
        const sigma = (r.tea - Math.abs(r.bias)) / cv
        
        // Tính số sample tối đa cho Westgard đa quy tắc
        if (sigma >= 6) {
          return '1-3s (2 samples)'
        } else if (sigma >= 5) {
          return '1-3s/2-2s/R-4s (2 samples)'
        } else if (sigma >= 4) {
          return '1-3s/2-2s/R-4s/4-1s (4 samples)'
        } else if (sigma >= 3) {
          return '1-3s/2-2s/R-4s/4-1s/10x (6+ samples)'
        } else {
          return 'Tất cả quy tắc (8+ samples)'
        }
      }
    },
  ]), [])

  // Paginated data (after grouping with rowSpan)
  const paginatedData = useMemo(() => {
    // Group data by test name to keep rowSpan groups together
    const groups: (Row & { __span?: number; __stt?: number })[][] = []
    let currentGroup: (Row & { __span?: number; __stt?: number })[] = []
    
    withSpan.forEach((row, idx) => {
      if (row.__span !== undefined && row.__span > 0 && currentGroup.length > 0) {
        // New group starts, save previous group
        groups.push(currentGroup)
        currentGroup = [row]
      } else {
        currentGroup.push(row)
      }
    })
    if (currentGroup.length > 0) groups.push(currentGroup)
    
    // Calculate which groups to show
    const startGroup = (currentPage - 1) * pageSize
    const endGroup = startGroup + pageSize
    const selectedGroups = groups.slice(startGroup, endGroup)
    
    // Flatten selected groups
    return selectedGroups.flat()
  }, [withSpan, currentPage, pageSize])

  return (
    <div>
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Select
          placeholder="Chọn lô QC"
          value={lot}
          style={{ width: 200 }}
          options={lotOptions}
          onChange={(v) => {
            setLot(v)
            const selected = lotOptions.find(o => o.value === v)
            setLotId(selected?.id || '')
          }}
        />
        <Select
          placeholder="Chọn máy"
          value={machine}
          style={{ width: 200 }}
          options={machineOptions}
          onChange={setMachine}
          disabled={!lot}
        />
        <DatePicker.RangePicker value={range as any} onChange={(v)=> setRange(v as any)} />
        <Button disabled={!lot || !machine}>Xuất ra excel</Button>
        <Input.Search
          placeholder="Tìm kiếm xét nghiệm..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>
      <div className="component-scroll" style={{ maxHeight: '60vh' }}>
        <Table 
          rowKey={(r: any) => r.id} 
          dataSource={paginatedData as any} 
          columns={columns as any} 
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: Math.ceil(withSpan.length / pageSize) * pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => {
              // Count number of groups (unique tests)
              const groups = new Set(withSpan.map(r => r.test))
              return `${groups.size} xét nghiệm`
            },
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 10)
            },
            onShowSizeChange: (_, size) => {
              setCurrentPage(1)
              setPageSize(size)
            }
          }}
          scroll={{ x: 1600 }} 
        />
      </div>
    </div>
  )
}

export default SigmaPage


