import React, { useEffect, useMemo, useState }  from 'react'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, message, Table } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { exportEntriesToExcel } from '../utils/export'
import { importEntriesFromXlsx } from '../utils/entriesImportExport'
import dayjs from 'dayjs'
import { evaluateWithRules } from '../utils/westgard-dynamic'
import { violationService } from '../services/violation.service'
import { usePagination } from '../hooks'
import { entryService, Entry } from '../services/entry.service'
import { analyteService } from '../services/analyte.service'
import { lotService } from '../services/lot.service'
import { limitService } from '../services/limit.service'
import { westgardService } from '../services/westgard.service'
import { EntryForm, EntryFormValues } from '../components/entry/EntryForm'
import { apiClient } from '../utils/api'
import { fetchAllPaginated } from '../utils/fetchAll'

const EntryPage: React.FC = () => {
  // Server-side pagination (align with WestgardPage)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)
  
  // State for manual data loading
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  
  const [analyteOptions, setAnalyteOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedAnalyteId, setSelectedAnalyteId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editValue, setEditValue] = useState<number | undefined>(undefined)
  const [editDate, setEditDate] = useState<any>(undefined)
  const [editEntryId, setEditEntryId] = useState<string | undefined>(undefined)
  const [form] = Form.useForm<any>()

  // Removed department filter

  // Filter states
  const [qcSelect, setQcSelect] = useState<string>('QC1')
  const [range, setRange] = useState<[any, any] | null>([dayjs(), dayjs()])
  const [batchDate] = useState(dayjs())
  const [batchValues, setBatchValues] = useState<Record<string, number | undefined>>({})
  const [selectedLot, setSelectedLot] = useState<string>('')
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [selectedMachine, setSelectedMachine] = useState<string>('')
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string; id?: string }[]>([])
  const [machineOptions, setMachineOptions] = useState<{ value: string; label: string }[]>([])
  const [qcLevelOptions, setQcLevelOptions] = useState<{ value: string; label: string }[]>([])
  const [qcLevelId, setQcLevelId] = useState<string>('')
  const [analyteCodeToId, setAnalyteCodeToId] = useState<Record<string, string>>({})
  const [limitMap, setLimitMap] = useState<Record<string, { mean: number; sd: number }>>({})
  const [entryStatus, setEntryStatus] = useState<Record<string, { level: 'pass'|'warning'|'error'|'critical'; violated: string[] }>>({})
  const [westgardRules, setWestgardRules] = useState<Array<{ code: string; severity: 'warning'|'error'|'critical'; params: any }>>([])
  const [lockedMonths, setLockedMonths] = useState<string[]>([])

  // Check if current month is locked
  const isCurrentMonthLocked = useMemo(() => {
    if (!range || !range[0]) return false
    const currentMonth = range[0].format('YYYY-MM')
    const isLocked = lockedMonths.includes(currentMonth)
    console.log('=== MONTH LOCK CHECK ===')
    console.log('Current month:', currentMonth)
    console.log('Locked months:', lockedMonths)
    console.log('Is locked:', isLocked)
    return isLocked
  }, [range, lockedMonths])

  // Load department locked months
  useEffect(() => {
    const loadLockedMonths = async () => {
      try {
        const departmentId = localStorage.getItem('departmentId')
        if (departmentId) {
          const url = `/departments/${departmentId}`
          console.log('LOCKED MONTHS → calling (apiClient):', url)
          const response = await apiClient.get(url)
          console.log('LOCKED MONTHS → success:', (response as any)?.success)
          console.log('LOCKED MONTHS → raw response:', response.data)
          const raw = (response as any)?.data?.data?.lockedEntryMonths ?? (response as any)?.data?.lockedEntryMonths ?? ''
          const months = typeof raw === 'string' && raw.trim().length > 0
            ? raw.split(',').filter(Boolean)
            : []
          setLockedMonths(months)
          console.log('LOCKED MONTHS → parsed months:', months)
        } else {
          console.warn('LOCKED MONTHS → no departmentId in localStorage')
          setLockedMonths([])
        }
      } catch (error) {
        console.error('LOCKED MONTHS → error:', error)
        setLockedMonths([])
      }
    }
    
    loadLockedMonths()
  }, [])

  // Load Westgard rules
  const loadWestgardRules = async () => {
    try {
      console.log('=== LOADING WESTGARD RULES ===')
      const response = await westgardService.list({ page: 1, pageSize: 1000 })
      console.log('Westgard rules response:', response)
      
      if (response.success && response.data && 'items' in response.data) {
        const rules = response.data.items.map((rule: any) => ({
          code: rule.code || rule.name,
          severity: rule.severity,
          params: {
            type: rule.code || rule.name, // Use code as type for dynamic evaluation
            window_size: rule.windowSize,
            threshold_sd: rule.thresholdSd,
            consecutive_points: rule.consecutivePoints,
            same_side: rule.sameSide,
            opposite_sides: rule.oppositeSides,
            sum_abs_z_gt: rule.sumAbsZGt,
            expression: rule.expression // Add expression field for custom rules
          }
        }))
        console.log('Mapped Westgard rules:', rules)
        setWestgardRules(rules)
      } else {
        console.log('No Westgard rules found or error in response')
      }
    } catch (error) {
      console.error('Error loading Westgard rules:', error)
    }
  }

  // Load lots on mount
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [lotsResponse] = await Promise.all([
          lotService.list({ page: 1, pageSize: 1000 }),
          loadWestgardRules()
        ])
        if (!mounted) return
        
        // Load lots
        const lots = (Array.isArray(lotsResponse.data) ? lotsResponse.data : lotsResponse.data?.items || []).map((l: any) => ({ value: l.code, label: l.code, id: l.id }))
        setLotOptions(lots)
        
        // Auto-select first lot if none selected
        if (!selectedLotId && lots.length > 0) {
          setSelectedLot(lots[0].value)
          setSelectedLotId(lots[0].id || '')
        }
      } catch (e) {
        console.error('Load initial data failed:', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Load machines when lot changes
  useEffect(() => {
    if (!selectedLotId) return
    let mounted = true
    const load = async () => {
      try {
        const response = await lotService.getMachines(selectedLotId)
        if (!mounted) return
        console.log('Machines loaded:', response.data)
        const options = (response.data || []).map((m: any) => ({ 
          value: m.id, 
          label: `${m.deviceCode} - ${m.name}`,
          id: m.id 
        }))
        setMachineOptions(options)
        // Auto-select first machine if none selected
        if (!selectedMachine || !options.some((o: any) => o.value === selectedMachine)) {
          setSelectedMachine(options[0]?.value || '')
        }
      } catch (e) {
        console.error('Load machines failed:', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [selectedLotId])

  // Load limits for current context (lot + machine + qcLevel)
  useEffect(() => {
    const loadSpec = async () => {
      try {
        if (!selectedLotId || !selectedMachine || !qcLevelId) { 
          setLimitMap({})
          return 
        }
        
        console.log('Loading limits for:', { selectedLotId, selectedMachine, qcLevelId })
        
        const response = await limitService.list({
          lotId: selectedLotId,
          machineId: selectedMachine,
          qcLevel: qcLevelId,
          page: 1,
          pageSize: 1000
        })
        
        if (response.success && response.data) {
          const limits = 'items' in response.data ? response.data.items : []
          const lm: Record<string, { mean: number; sd: number }> = {}
          
          limits.forEach((r: any) => {
            const key = r.analyteId
            if (key && r.mean != null && r.sd != null) {
              lm[key] = { mean: Number(r.mean), sd: Number(r.sd) }
            }
          })
          
          console.log('Loaded limits:', Object.keys(lm).length, 'analytes')
          setLimitMap(lm)
        } else {
          setLimitMap({})
        }
      } catch (err) {
        console.error('Load limits failed:', err)
        setLimitMap({})
      }
    }
    loadSpec()
  }, [selectedLotId, selectedMachine, qcLevelId])

  // Load QC levels từ bảng limits theo lot và machine
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (!selectedLotId || !selectedMachine) { 
          setQcLevelOptions([])
          setQcLevelId('')
          setQcSelect('')
          return 
        }
        
        // Lấy QC levels từ bảng limits dựa trên lot và machine
        console.log('=== LOAD QC LEVELS ===')
        console.log('Selected lot:', selectedLotId)
        console.log('Selected machine:', selectedMachine)
        
        const response = await limitService.list({
          lotId: selectedLotId,
          machineId: selectedMachine,
          page: 1,
          pageSize: 1000
        })
        
        console.log('Limits response:', response)
        
        if (!mounted) return
        
        if (response.success && response.data) {
          const limits = 'items' in response.data ? response.data.items : []
          console.log('Limits found:', limits.length)
          
          // Lấy unique QC levels từ limits
          const qcLevelMap = new Map()
          limits.forEach((limit: any) => {
            console.log('Processing limit:', limit)
            console.log('QC Level:', limit.qcLevel)
            console.log('QC Level ID:', limit.qcLevelId)
            
            // Sử dụng qcLevelId và qcLevel name từ limit
            if (limit.qcLevelId && limit.qcLevel) {
              qcLevelMap.set(limit.qcLevelId, limit.qcLevel)
            }
          })
          
          const opts: { value: string; label: string }[] = Array.from(qcLevelMap.entries()).map(([id, name]) => ({
            value: id,
            label: typeof name === 'string' ? name : name.name
          }))
          
          console.log('QC Level options:', opts)
          console.log('Current qcLevelId:', qcLevelId)
          console.log('Current qcSelect:', qcSelect)
          
          // Set options trước
          setQcLevelOptions(opts)
          
          // Auto-select first QC level if none selected
          if (opts.length > 0) {
            if (!qcLevelId || !opts.some((o: any) => o.value === qcLevelId)) {
          const first = opts[0]
              console.log('Auto-selecting QC level:', first)
            setQcLevelId(first.value)
            setQcSelect(first.label)
            } else {
              console.log('QC level already selected:', qcLevelId)
            }
          }
        } else {
          console.log('No limits found or error')
          setQcLevelOptions([])
        }
      } catch (err) {
        console.error('Load QC levels from limits failed:', err)
        setQcLevelOptions([])
      }
    }
    load()
    return () => { mounted = false }
  }, [selectedLotId, selectedMachine])

  // Load analytes (all for current scope)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const response = await analyteService.list({ page: 1, pageSize: 1000 })
        if (!mounted) return
        const analytes = Array.isArray(response.data) ? response.data : response.data?.items || []
        const options = analytes.map((a: any) => ({ value: a.id, label: a.name }))
        setAnalyteOptions(options.sort((a: any, b: any) => a.label.localeCompare(b.label)))
        
        const codeToId: Record<string, string> = {}
        analytes.forEach((a: any) => {
          if (a.code && a.id) codeToId[a.code] = a.id
        })
        setAnalyteCodeToId(codeToId)
      } catch (e) {
        console.error('Load analytes failed:', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Load entries function - moved outside useEffect to be accessible
  const loadEntriesData = async () => {
    try {
      console.log('Load entries triggered with:', {
        selectedLotId,
        selectedMachine,
        qcLevelId,
        selectedAnalyteId,
        range: range?.map(r => r?.format('YYYY-MM-DD'))
      })
      
      if (!selectedLotId || !selectedMachine || !qcLevelId) { 
        console.log('Missing required params, clearing data')
        setEntries([])
        return 
      }
      
      setLoading(true)
      const startDate = range?.[0]?.format('YYYY-MM-DD')
      const endDate = range?.[1]?.format('YYYY-MM-DD')
      
      const params: any = {
        lotId: selectedLotId,
        qcLevelId, 
        machineId: selectedMachine,
        dateFrom: startDate,
        dateTo: endDate,
        page: currentPage,
        pageSize: pageSize
      }
      // optional analyte filter
      if (selectedAnalyteId) {
        params.analyteId = selectedAnalyteId
      }
      
      console.log('Debug - calling API with params:', params)
      
      const response = await entryService.list(params)
      if (response.success && response.data) {
        if ('items' in response.data) {
          const { items, total } = response.data
          console.log('Loaded entries:', items.length, 'total:', total)
          setEntries(items)
          setTotal(total as number)
        } else {
          const items = response.data as any[]
          setEntries(items)
          setTotal(items.length)
        }
      } else {
        setEntries([])
      }
    } catch (e) {
      console.error('Load entries failed:', e)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  // Load entries - chỉ load khi có đủ lot + machine + qcLevel
  useEffect(() => {
    loadEntriesData()
  }, [selectedLotId, selectedMachine, qcLevelId, selectedAnalyteId, range, currentPage, pageSize])

  // Compute Westgard status per entry whenever data/spec changes
  useEffect(() => {
    console.log('=== WESTGARD EVALUATION DEBUG ===')
    console.log('entries.length:', entries.length)
    console.log('limitMap keys:', Object.keys(limitMap))
    console.log('westgardRules.length:', westgardRules.length)
    console.log('limitMap content:', limitMap)
    console.log('westgardRules content:', westgardRules)
    console.log('================================')
    
    if (!entries.length || !Object.keys(limitMap).length || !westgardRules.length) { 
      console.log('Missing data for Westgard evaluation, skipping...')
      setEntryStatus({}); 
      return
    }

    const groups: Record<string, Entry[]> = {}
    entries.forEach(e => {
      const k = e.analyteId
      if (!groups[k]) groups[k] = []
      groups[k].push(e)
    })
    
    const st: Record<string, { level: 'pass'|'warning'|'error'|'critical'; violated: string[] }> = {}
    
    Object.values(groups).forEach(list => {
      const spec = limitMap[list[0]?.analyteId]
      if (!spec) return
      
      const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
      const vals: number[] = ordered.map(e => Number(e.value))
      
      // Evaluate each entry using Westgard rules
      for (let i = 0; i < ordered.length; i++) {
        const entry = ordered[i]
        const valuesUpToNow = vals.slice(0, i + 1)
        
        console.log(`Evaluating entry ${entry.id}:`, {
          value: entry.value,
          valuesUpToNow,
          spec: { mean: spec.mean, sd: spec.sd },
          rulesCount: westgardRules.length,
          zScore: (entry.value - spec.mean) / spec.sd
        })
        
        console.log('Westgard rules being used:', westgardRules)
        
        // Use evaluateWithRules from utils
        const result = evaluateWithRules(valuesUpToNow, spec.mean, spec.sd, westgardRules)
        console.log(`Result for entry ${entry.id}:`, result)
        st[entry.id] = result
      }
    })
    
    setEntryStatus(st)
  }, [entries, limitMap, westgardRules])

  // Removed search filter

  // Debug log for entries data
  useEffect(() => {
    if (entries.length > 0) {
      console.log('=== ENTRY DATA DEBUG ===')
      console.log('First entry:', entries[0])
      console.log('analyteName type:', typeof entries[0]?.analyteName)
      console.log('qcLevelName type:', typeof entries[0]?.qcLevelName)
      console.log('lotCode type:', typeof entries[0]?.lotCode)
      console.log('========================')
    }
  }, [entries])

  // Table columns
  const columns = [
    {
      title: 'Bộ XN',
      dataIndex: 'analyteName',
      key: 'analyteName',
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      align: 'center' as const,
        render: (_: any, record: Entry) => {
          const st = entryStatus[record.id]
          let backgroundColor = 'transparent'
          let textColor = '#000'
          let borderColor = 'transparent'
          
          if (st?.level === 'critical') {
            backgroundColor = '#f9f0ff'
            textColor = '#722ed1'
            borderColor = '#d3adf7'
          } else if (st?.level === 'error') {
            backgroundColor = '#fff1f0'
            textColor = '#a8071a'
            borderColor = '#ffccc7'
          } else if (st?.level === 'warning') {
            backgroundColor = '#fff7e6'
            textColor = '#d46b08'
            borderColor = '#ffd591'
          }
          
          return (
            <div style={{ 
              background: backgroundColor,
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: 6, 
              padding: '4px 8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {record.value}
            </div>
          )
        }
    },
    {
      title: 'Cảnh báo',
      key: 'wg',
      align: 'center' as const,
        render: (_: any, record: Entry) => {
          const st = entryStatus[record.id]
          if (!st || st.level === 'pass') return '-'
          
          const text = st.violated.join(', ')
          let color = '#52c41a' // green for pass (shouldn't reach here)
          
          if (st.level === 'warning') {
            color = '#faad14' // orange for warning
          } else if (st.level === 'error') {
            color = '#ff4d4f' // red for error
          } else if (st.level === 'critical') {
            color = '#722ed1' // purple for critical
          }
          
          return (
            <span style={{ 
              color, 
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: st.level === 'warning' ? '#fff7e6' : 
                             st.level === 'error' ? '#fff1f0' : 
                             st.level === 'critical' ? '#f9f0ff' : 'transparent'
            }}>
              {text || st.level}
            </span>
          )
        }
    },
    {
      title: 'Tạo bởi',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: 'Cập nhật bởi',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Entry) => {
        const entryMonth = dayjs(record.date).format('YYYY-MM')
        const isEntryMonthLocked = lockedMonths.includes(entryMonth)
        console.log('Entry month check:', { entryMonth, lockedMonths, isEntryMonthLocked })
        
        const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('fullName')) || ''
        const isOwner = (record.createdBy && currentUser) ? (record.createdBy === currentUser) : true
        return (
          <Space size="small">
            <Button 
              size="small" 
              type="primary"
              ghost
              icon={<EditOutlined />}
              disabled={isEntryMonthLocked || !isOwner}
              title={isEntryMonthLocked ? 'Tháng này đã bị khóa, không thể sửa' : (!isOwner ? 'Chỉ được sửa dữ liệu do bạn tạo' : '')}
              onClick={() => {
                setEditValue(record.value)
                setEditDate(dayjs(record.date))
                setEditEntryId(record.id)
                setEditModalOpen(true)
              }}
            >
              Sửa
            </Button>
            <Button 
              size="small" 
              danger
              ghost
              icon={<DeleteOutlined />}
              disabled={isEntryMonthLocked || !isOwner}
              title={isEntryMonthLocked ? 'Tháng này đã bị khóa, không thể xóa' : (!isOwner ? 'Chỉ được xóa dữ liệu do bạn tạo' : '')}
              onClick={() => {
              Modal.confirm({
                title: 'Xóa dữ liệu QC',
                content: `Bạn có chắc chắn muốn xóa dữ liệu "${record.analyteName}" ngày ${dayjs(record.date).format('DD/MM/YYYY')}?`,
                okText: 'Xóa',
                cancelText: 'Hủy',
                okButtonProps: { danger: true },
                onOk: async () => {
                  try {
                    await entryService.delete(record.id)
                    message.success('Đã xóa dữ liệu')
                    // Reload data
                    console.log('=== RELOADING ENTRIES AFTER DELETE ===')
                    try {
                      await loadEntriesData()
                      console.log('=== RELOAD ENTRIES SUCCESS AFTER DELETE ===')
                    } catch (error) {
                      console.error('=== RELOAD ENTRIES FAILED AFTER DELETE ===', error)
                    }
                  } catch (e) {
                    message.error('Xóa thất bại')
                  }
                }
              })
            }}
          >
            Xóa
          </Button>
        </Space>
        )
      },
    },
  ]

  const onCreate = () => {
    setOpen(true)
    form.resetFields()
    // Pre-fill form with current filters (using IDs)
    form.setFieldsValue({
      lotId: selectedLotId, // This is already the lot ID
      machineId: selectedMachine, // This is already the machine ID
      qcLevelId: qcLevelId, // This is already the QC level ID
      date: dayjs()
    })
  }

  // Removed onBatchSave - now using EntryForm

  const onEditSave = async () => {
    if (!editEntryId || editValue === undefined || !editDate) {
      message.warning('Không có dữ liệu để sửa')
      return
    }
    try {
      await entryService.update(editEntryId, { 
        id: editEntryId, 
        value: Number(editValue),
        date: editDate.format('YYYY-MM-DD')
      })
      // Skip violation evaluation for now - simplified implementation
      message.success('Đã cập nhật dữ liệu')
      setEditModalOpen(false)
      setEditValue(undefined)
      setEditDate(undefined)
      setEditEntryId(undefined)
      // Reload data
      console.log('=== RELOADING ENTRIES AFTER EDIT ===')
      try {
        await loadEntriesData()
        console.log('=== RELOAD ENTRIES SUCCESS AFTER EDIT ===')
      } catch (error) {
        console.error('=== RELOAD ENTRIES FAILED AFTER EDIT ===', error)
      }
    } catch (e) {
      message.error('Cập nhật thất bại')
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      
      {/* Locked Month Warning */}
      {isCurrentMonthLocked && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: '#fff2e8', 
          border: '1px solid #ffb366', 
          borderRadius: 6,
          color: '#d46b08'
        }}>
          <strong>⚠️ Tháng này đã bị khóa:</strong> Không thể thêm, sửa hoặc xóa dữ liệu trong tháng {range?.[0]?.format('MM/YYYY')}. Chỉ có thể xem và xuất dữ liệu.
        </div>
      )}

      {/* Controls */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        
        <Select
          placeholder="Chọn lô"
          value={selectedLot}
          onChange={(value, option: any) => {
            setSelectedLot(value)
            setSelectedLotId(option?.id || '')
            // Reset QC level khi đổi lô
            setQcLevelId('')
            setQcSelect('')
            setQcLevelOptions([])
          }}
          options={lotOptions}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Chọn máy"
          value={selectedMachine}
          onChange={(value, option: any) => {
            console.log('Machine selected:', { value, option })
            setSelectedMachine(value)
            // Reset QC level khi đổi máy
            setQcLevelId('')
            setQcSelect('')
            setQcLevelOptions([])
          }}
          options={machineOptions}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Chọn mức QC"
          value={qcLevelId}
          onChange={(value) => {
            console.log('QC Level selected:', { value, qcLevelOptions })
            setQcLevelId(value)
            // Tìm QC level name từ options
            const qc = qcLevelOptions.find(q => q.value === value)
            console.log('Found QC level:', qc)
            setQcSelect(qc?.label || value) // Set display name
          }}
          options={qcLevelOptions}
          style={{ width: 120 }}
        />
        <DatePicker.RangePicker
          value={range}
          onChange={setRange}
          format="DD/MM/YYYY"
        />
        {/* Analyte dropdown filter (after other filters) */}
        <Select
          placeholder="Chọn xét nghiệm"
          value={selectedAnalyteId}
          onChange={(value) => setSelectedAnalyteId(value)}
          options={analyteOptions}
          style={{ width: 260 }}
          allowClear
        />
        <Button 
          type="primary" 
          onClick={onCreate} 
          disabled={!selectedLot || !selectedMachine || isCurrentMonthLocked}
          title={isCurrentMonthLocked ? 'Tháng này đã bị khóa, không thể thêm dữ liệu' : ''}
        >
          + Thêm dữ liệu
        </Button>
        <Button 
          onClick={() => (document.getElementById('entry-file-input') as HTMLInputElement)?.click()}
          disabled={isCurrentMonthLocked}
          title={isCurrentMonthLocked ? 'Tháng này đã bị khóa, không thể nhập từ file' : ''}
        >
          Nhập từ file
        </Button>
        <Button 
          onClick={async () => {
            try {
              message.loading('Đang xuất file...', 0)
              // Fetch all entries for current filters (ignore pagination)
              const startDate = range?.[0]?.format('YYYY-MM-DD')
              const endDate = range?.[1]?.format('YYYY-MM-DD')
              const params: any = {
            lotId: selectedLotId,
            qcLevelId: qcLevelId,
                machineId: selectedMachine,
                dateFrom: startDate,
                dateTo: endDate
              }
              if (selectedAnalyteId) params.analyteId = selectedAnalyteId
              const allEntries = await fetchAllPaginated(entryService.list as any, params, 1000)

              // Compute warnings for all entries using current limits and rules
              const groups: Record<string, Entry[]> = {}
              allEntries.forEach((e: Entry) => {
                const k = e.analyteId
                if (!groups[k]) groups[k] = []
                groups[k].push(e)
              })
              const allStatus: Record<string, { level: 'pass'|'warning'|'error'|'critical'; violated: string[] }> = {}
              Object.values(groups).forEach(list => {
                const spec = limitMap[list[0]?.analyteId]
                if (!spec) return
                const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
                const vals: number[] = ordered.map(e => Number(e.value))
                for (let i = 0; i < ordered.length; i++) {
                  const entry = ordered[i]
                  const valuesUpToNow = vals.slice(0, i + 1)
                  const result = evaluateWithRules(valuesUpToNow, spec.mean, spec.sd, westgardRules)
                  allStatus[entry.id] = result
                }
              })

              const enriched = allEntries.map((e: any) => ({
                ...e,
                warnings: allStatus[e.id]?.violated || []
              }))
              exportEntriesToExcel(enriched)
              message.destroy()
              message.success('Xuất file thành công')
            } catch (error) {
              console.error('Export error:', error)
              message.error('Lỗi khi xuất file')
            }
          }}
        >
          Xuất ra file
        </Button>
        
      </Space>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
          onChange: (page, size) => {
            setCurrentPage(page)
            setPageSize(size || pageSize)
          },
          onShowSizeChange: (_, size) => {
            setCurrentPage(1)
            setPageSize(size)
          }
        }}
        scroll={{ x: 800 }}
      />

      {/* File input */}
      <input
        id="entry-file-input"
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0]
          if (!file) return
          console.log('[IMPORT_UI] file selected:', file?.name)
          try {
            if (!selectedLotId || !selectedMachine || !qcLevelId) { 
              console.warn('[IMPORT_UI] missing filters:', { selectedLotId, selectedMachine, qcLevelId })
              message.warning('Chọn lô, máy và mức QC')
              return 
            }
            const month = range?.[0]?.format('YYYY-MM') || dayjs().format('YYYY-MM')
            console.log('[IMPORT_UI] calling importEntriesFromXlsx', { lotId: selectedLotId, machineId: selectedMachine, month })
            const res = await importEntriesFromXlsx(file, { 
              lotId: selectedLotId, 
              machineId: selectedMachine, 
              qcLevelId: qcLevelId!,
              month 
            })
            console.log('[IMPORT_UI] import result:', res)
            message.success(`Nhập ${res.created} giá trị QC thành công`)
            if (res.errors.length) console.warn('Entry import errors:', res.errors)
            // Reload data
            try {
              await loadEntriesData()
            } catch (error) {
              console.error('Reload entries failed:', error)
            }
          } catch (e) {
            console.error('[IMPORT_UI] import failed:', e)
            message.error('Import thất bại')
          }
          e.currentTarget.value = ''
        }}
      />

      {/* Create Modal */}
      <Modal
        open={open}
        title="Thêm dữ liệu QC"
        onCancel={() => setOpen(false)}
        footer={null}
        width={800}
      >
        <EntryForm
          form={form}
          onSave={async (values: EntryFormValues) => {
            try {
              const created = await entryService.create({
                lotId: values.lotId,
                machineId: values.machineId,
                qcLevelId: values.qcLevelId,
                analyteId: values.analyteId,
                value: values.value,
                date: values.date.format('YYYY-MM-DD'),
                note: values.note
              })
              message.success('Đã thêm dữ liệu QC')
              // FE-evaluated Westgard -> create violations immediately
              try {
                const limitKey = values.analyteId
                const spec = limitMap[limitKey]
                if (spec && isFinite(spec.sd) && spec.sd !== 0) {
                  const result = evaluateWithRules([Number(values.value)], spec.mean, spec.sd, westgardRules)
                  const violated = result.violated || []
                  for (const code of violated) {
                    const severity = code === '1-3s' ? 'error' : code === '1-2s' ? 'warning' : 'critical'
                    const content = `Ngày ${values.date.format('DD/MM')}, vi phạm nguyên tắc ${code}`
                    await violationService.create({
                      analyteId: values.analyteId,
                      lotId: values.lotId,
                      qcLevelId: values.qcLevelId,
                      machineId: values.machineId,
                      entryDate: values.date.format('YYYY-MM-DD'),
                      value: Number(values.value),
                      ruleCode: code as any,
                      severity: severity as any,
                      content,
                      status: 'pending'
                    })
                  }
                }
              } catch (err) {
                console.error('Create FE-evaluated violations failed:', err)
              }
                  setOpen(false)
              form.resetFields()
              // Reload entries data
              console.log('=== RELOADING ENTRIES AFTER CREATE ===')
              try {
                await loadEntriesData()
                console.log('=== RELOAD ENTRIES SUCCESS ===')
              } catch (error) {
                console.error('=== RELOAD ENTRIES FAILED ===', error)
                // Don't show error message for reload failure
              }
            } catch (error) {
              console.error('Create entry failed:', error)
              message.error('Thêm dữ liệu thất bại')
            }
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        title="Sửa dữ liệu QC"
        onCancel={() => setEditModalOpen(false)}
        onOk={onEditSave}
        okText="Lưu"
        cancelText="Hủy"
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Giá trị mới:</label>
            <InputNumber
              value={editValue}
              onChange={(value) => setEditValue(value || undefined)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
          <div>
            <label>Ngày:</label>
            <DatePicker
              value={editDate}
              onChange={(date) => setEditDate(date)}
              style={{ width: '100%', marginTop: 8 }}
              format="DD/MM/YYYY"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EntryPage
