import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from 'antd'
import { exportLimitsByLotMachine, importLimitsFromXlsx } from '../utils/limitsImportExport'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApi, usePagination } from '../hooks'
import { limitService, QCLimit, analyteService, lotService, qcLevelService, machineService } from '../services'
import QCLimitForm from '../components/limits/QCLimitForm'

// Types are now imported from services

// No hardcoded QC levels; fetch per lot

// Helper functions
const mapAnalyteOptions = (arr: any[]) => 
  arr.map(a => ({ value: a.id, label: `${a.code} - ${a.name || a.code}` }))

const mapLotOptions = (arr: any[]) => 
  arr.map((l: any) => ({ value: l.code, label: l.code, id: l.id }))

// mapMachineOptions removed - now using inline mapping

const LimitsPage: React.FC = () => {
  // State management
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<QCLimit | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm<QCLimit>()
  
  // Filter states
  const [selectedQc, setSelectedQc] = useState<string>('')
  const [selectedLot, setSelectedLot] = useState<string | undefined>(undefined)
  const [selectedLotId, setSelectedLotId] = useState<string | undefined>(undefined)
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string | undefined>(undefined)
  
  // Search states
  const [searchText, setSearchText] = useState<string>('')
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  
  // Options states
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string; id?: string }[]>([])
  const [analyteOptions, setAnalyteOptions] = useState<{ value: string; label: string }[]>([])
  const [machineOptions, setMachineOptions] = useState<{ value: string; label: string }[]>([])
  const [availableAnalytes, setAvailableAnalytes] = useState<{ value: string; label: string }[]>([])
  const [filtersLoading, setFiltersLoading] = useState(true)
  
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'

  // API hooks
  const { data: apiData, loading, execute: loadLimits } = useApi(limitService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  const data = apiData && 'items' in apiData ? apiData.items : []

  const reloadLimitsNow = React.useCallback(async () => {
    await loadLimits({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined,
      lotId: selectedLotId,
      machineId: selectedMachineFilter,
      qcLevel: selectedQc
    })
  }, [loadLimits, pagination.page, pagination.pageSize, debouncedSearchText, selectedLotId, selectedMachineFilter, selectedQc])
  
  // Debug log for data
  useEffect(() => {
    if (data.length > 0) {
      console.log('=== LIMITS DATA DEBUG ===')
      console.log('First item:', data[0])
      console.log('Analyte object:', data[0]?.analyte)
      console.log('QcLevel object:', data[0]?.qcLevel)
      console.log('Lot object:', data[0]?.lot)
      console.log('Machine object:', data[0]?.machine)
      console.log('========================')
    }
  }, [data])
  
  const [checkedAnalytes, setCheckedAnalytes] = useState<string[]>([])
  const [qcLevelOptions, setQcLevelOptions] = useState<{ value: string; label: string }[]>([])
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load machines when selectedLotId changes (for edit form)
  useEffect(() => {
    ;(async () => {
      try {
        console.log('=== MACHINE LOADING useEffect ===')
        console.log('selectedLotId:', selectedLotId)
        console.log('current machineOptions length:', machineOptions.length)
        
        if (!selectedLotId) { 
          console.log('No selectedLotId, clearing machineOptions')
          setMachineOptions([])
          return 
        }
        
        console.log('Loading machines for lot:', selectedLotId)
        const response = await machineService.list({ lotId: selectedLotId, page: 1, pageSize: 1000 })
        console.log('Machine response:', response)
        
        if (response.success && response.data) {
          const machines = 'items' in response.data ? response.data.items : response.data
          console.log('Machines loaded:', machines)
          
          if (machines?.length) {
            const opts = machines.map((m: any) => ({ value: m.id, label: `${m.deviceCode} - ${m.name}` }))
            console.log('Machine options created:', opts)
            setMachineOptions(opts)
            console.log('Machine options set, new length:', opts.length)
          } else {
            console.log('No machines found, clearing options')
            setMachineOptions([])
          }
        } else {
          console.log('Failed to load machines, clearing options')
          setMachineOptions([])
        }
      } catch (error) {
        console.error('Error loading machines:', error)
        setMachineOptions([])
      }
    })()
  }, [selectedLotId])

  // Load data on mount and when filters change
  useEffect(() => {
    // Only call API when all required filters are loaded
    if (qcLevelOptions.length === 0 || lotOptions.length === 0 || analyteOptions.length === 0) {
      console.log('=== WAITING FOR OPTIONS ===')
      console.log('qcLevelOptions.length:', qcLevelOptions.length)
      console.log('lotOptions.length:', lotOptions.length)
      console.log('analyteOptions.length:', analyteOptions.length)
      console.log('===========================')
      return
    }
    
    console.log('=== CALLING LOAD LIMITS ===')
    console.log('qcLevelOptions.length:', qcLevelOptions.length)
    console.log('lotOptions.length:', lotOptions.length)
    console.log('analyteOptions.length:', analyteOptions.length)
    console.log('selectedLotId:', selectedLotId)
    console.log('selectedMachineFilter:', selectedMachineFilter)
    console.log('selectedQc:', selectedQc)
    console.log('============================')
    
    loadLimits({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined,
      lotId: selectedLotId,
      machineId: selectedMachineFilter,
      qcLevel: selectedQc
    })
  }, [pagination.page, pagination.pageSize, debouncedSearchText, selectedLotId, selectedMachineFilter, selectedQc, qcLevelOptions.length])

  // Sync pagination total
  useEffect(() => {
    if (apiData && 'total' in apiData) {
      pagination.setTotal(apiData.total)
    }
  }, [apiData])
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const machineIdToCodeRef = useRef<Record<string, string>>({})

  // Load initial data
  useEffect(() => {
    let mounted = true
    
    const loadInitialData = async () => {
      try {
        setFiltersLoading(true)
        const [lotsResponse, analytesResponse, qcLevelsResponse] = await Promise.all([
          lotService.list({ options: true }),
          analyteService.list({ options: true }),
          qcLevelService.list({ options: true }),
        ])
        
        if (!mounted) return
        
        // Set lot options
        const lotsData = Array.isArray(lotsResponse.data) ? lotsResponse.data : lotsResponse.data.items
        if (lotsData?.length) {
          const lotOptions = mapLotOptions(lotsData)
          setLotOptions(lotOptions)
          if (!selectedLot) setSelectedLot(lotOptions[0]?.value)
          if (!selectedLotId) setSelectedLotId(lotsData[0]?.id)
        }
        
        // Set analyte options
        const analytesData = Array.isArray(analytesResponse.data) ? analytesResponse.data : analytesResponse.data.items
        if (analytesData?.length) {
          const analyteOptions = mapAnalyteOptions(analytesData)
          setAnalyteOptions(analyteOptions)
          setAvailableAnalytes(analyteOptions)
        }
        
        // Set QC level options
        const qcLevelsData = Array.isArray(qcLevelsResponse.data) ? qcLevelsResponse.data : qcLevelsResponse.data.items
        if (qcLevelsData?.length) {
          const qcOptions = qcLevelsData.map((qc: any) => ({ value: qc.id, label: qc.name }))
          setQcLevelOptions(qcOptions)
          // Auto-select first QC level if none selected
          if (!selectedQc && qcOptions[0]?.value) {
            setSelectedQc(qcOptions[0].value)
          }
        }
        
        setFiltersLoading(false)
      } catch (error) {
        console.error('Error loading initial data:', error)
        setFiltersLoading(false)
      }
    }
    
    loadInitialData()
    return () => { mounted = false }
  }, [])

  // Note: Limits data is now loaded by the main useEffect above

  // Update available analytes based on current limits data (already filtered by backend)
  useEffect(() => {
    if (!data.length) {
      setAvailableAnalytes(analyteOptions)
      return
    }

    // Get existing analytes from already-filtered data (no need to filter again)
    const existingAnalytes = data.map(limit => limit.analyteId)

    // Filter out analytes that already have QC limits
    const available = analyteOptions.filter(analyte => !existingAnalytes.includes(analyte.value))
    setAvailableAnalytes(available)
  }, [data, analyteOptions])

  // Load machines and QC levels for selected lot
  useEffect(() => {
    if (!selectedLotId) {
      setMachineOptions([])
      // Don't clear QC levels when no lot is selected - keep global QC levels
      return
    }

    const loadForLot = async () => {
      try {
        // Load machines for this lot
        const machinesResponse = await lotService.getMachines(selectedLotId)
        const machines = machinesResponse.data || []
        
        // Load QC levels for this lot (optional - if API supports it)
        let levels: any[] = []
        try {
          const qcLevelsResponse = await lotService.getQcLevels(selectedLotId)
          levels = qcLevelsResponse.data || []
        } catch (error) {
          console.log('No QC levels found for this lot, using global QC levels')
          // Keep existing QC levels from loadInitialData
        }
        
        if (machines?.length) {
          const machineOptions = machines.map((machine: any) => ({
            value: machine.id,
            label: `${machine.deviceCode} - ${machine.name}`
          }))
          
          // Build id -> device_code map for reliable payloads
          const machineIdToCode: Record<string, string> = {}
          for (const m of machines) {
            if (m?.id && m?.deviceCode) machineIdToCode[m.id] = m.deviceCode
          }
          machineIdToCodeRef.current = machineIdToCode
          
          setMachineOptions(machineOptions)
          
          // Keep selected machine if still valid; otherwise default to first
          const exists = selectedMachineFilter && machineOptions.some(o => o.value === selectedMachineFilter)
          if (!exists && machineOptions[0]?.value) {
            setSelectedMachineFilter(machineOptions[0].value)
          }
        } else {
          setMachineOptions([])
          // Clear machine filter if no machines found
          if (selectedMachineFilter) setSelectedMachineFilter(undefined)
        }

        // Only update QC levels if we found specific levels for this lot
        if (levels?.length) {
          const options = levels.map((level: any) => ({ value: level.id, label: level.name }))
          setQcLevelOptions(options)
          if (!options.find((o: { value: string; label: string }) => o.value === selectedQc)) {
            setSelectedQc(options[0]?.value)
          }
        }
        // If no specific levels for this lot, keep existing global QC levels
      } catch (error) {
        console.error('Error loading machines for lot:', error)
        setMachineOptions([])
        setQcLevelOptions([])
      }
    }
    
    loadForLot()
  }, [selectedLotId])

  // Table columns configuration
  const columns = useMemo(() => [
    { title: 'STT', width: 70, render: (_: any, __: QCLimit, index: number) => (pagination.page - 1) * pagination.pageSize + index + 1 },
    { 
      title: 'Bộ XN', 
      dataIndex: 'analyte', 
      width: 160, 
      sorter: true,
      render: (analyte: any) => analyte ? `${analyte.code} - ${analyte.name}` : '-'
    },
    { 
      title: 'Mức QC', 
      dataIndex: 'qcLevel', 
      width: 100, 
      sorter: true,
      render: (qcLevel: any) => qcLevel ? qcLevel.name : '-'
    },
    { 
      title: 'Lô', 
      dataIndex: 'lot', 
      width: 120, 
      sorter: true,
      render: (lot: any) => lot ? lot.code : '-'
    },
    { 
      title: '-2SD', 
      render: (_: any, r: QCLimit) => (r.mean - 2 * r.sd).toFixed(r.decimals), 
      width: 100,
      sorter: (a: QCLimit, b: QCLimit) => (a.mean - 2 * a.sd) - (b.mean - 2 * b.sd)
    },
    { 
      title: '+2SD', 
      render: (_: any, r: QCLimit) => (r.mean + 2 * r.sd).toFixed(r.decimals), 
      width: 100,
      sorter: (a: QCLimit, b: QCLimit) => (a.mean + 2 * a.sd) - (b.mean + 2 * b.sd)
    },
    { title: 'SD', dataIndex: 'sd', width: 100, sorter: true },
    { title: 'Mean', dataIndex: 'mean', width: 100, sorter: true },
    { 
      title: 'EXP', 
      dataIndex: 'exp', 
      width: 120, 
      sorter: true,
      render: (exp: string | Date) => {
        if (!exp) return '-'
        return dayjs(exp).format('YYYY-MM-DD')
      }
    },
    { title: 'Unit', dataIndex: 'unit', width: 100, sorter: true },
    { title: 'TEA%', dataIndex: 'tea', width: 100, sorter: true },
    { title: 'CV% REF', dataIndex: 'cvRef', width: 110, sorter: true },
    { title: 'Peer group', dataIndex: 'peerGroup', width: 120, sorter: true },
    { title: 'Bias% EQA', dataIndex: 'biasEqa', width: 120, sorter: true },
    { 
      title: 'Cách tính BIAS', 
      dataIndex: 'biasMethod', 
      width: 160,
      render: (biasMethod: any) => {
        if (!biasMethod) return '-'
        // biasMethod is now an object with id and name
        console.log('=== BIAS METHOD RENDER DEBUG ===')
        console.log('biasMethod object:', biasMethod)
        console.log('biasMethod.name:', biasMethod.name)
        console.log('================================')
        return biasMethod.name || '-'
      }
    },
    { title: 'Phương pháp', dataIndex: 'method', width: 160 },
    { title: 'Tạo bởi', dataIndex: 'createdBy', width: 120 },
    { title: 'Cập nhật bởi', dataIndex: 'updatedBy', width: 140 },
    {
      title: 'Hành động', 
      width: 160,
      render: (_: any, record: QCLimit) => (
        <Space>
          <Button 
            size="small" 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm 
            title="Xóa thiết lập?" 
            okText="Xóa" 
            cancelText="Hủy" 
            okButtonProps={{ danger: true }} 
            onConfirm={() => onDelete(record.id)}
          >
            <Button size="small" danger ghost icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ], [pagination.page, pagination.pageSize])

  // Event handlers
  const onEdit = async (record: QCLimit) => {
    console.log('=== ON EDIT DEBUG ===')
    console.log('record:', record)
    console.log('current machineOptions:', machineOptions)
    console.log('current selectedLotId:', selectedLotId)
    console.log('current lotOptions:', lotOptions)
    
    setEditing(record)
    
    // Find the correct IDs for the form values
    const analyteOption = analyteOptions.find(a => a.value === record.analyte?.id || record.analyteId)
    const lotOption = lotOptions.find(l => (l.value === ((record.lot as any)?.code || record.lot)))
    const qcLevelIdFromRecord = (record.qcLevelId || (record.qcLevel as any)?.id) as string | undefined
    const qcLevelOption = qcLevelOptions.find(q => q.value === qcLevelIdFromRecord)
    const machineOption = machineOptions.find(m => m.value === (record.machine as any)?.id || record.machineId)
    
    console.log('Found options:', {
      analyteOption,
      lotOption,
      qcLevelOption,
      machineOption
    })
    
    // If lotOptions not loaded yet, wait for them
    if (lotOptions.length === 0) {
      console.log('Lot options not loaded yet, waiting...')
      // Wait a bit for lotOptions to load
      await new Promise(resolve => setTimeout(resolve, 100))
      const updatedLotOption = lotOptions.find(l => l.value === (record.lot as any)?.code || record.lot)
      if (updatedLotOption?.id) {
        console.log('Found lot option after wait:', updatedLotOption)
        setSelectedLotId(updatedLotOption.id)
      }
    } else if (lotOption?.id) {
      console.log('Setting selectedLotId to:', lotOption.id)
      setSelectedLotId(lotOption.id)
    }
    
    const formValues = {
      analyteId: analyteOption?.value || record.analyteId,
      lot: lotOption?.value || (record.lot as any)?.code || record.lot,
      qcLevel: qcLevelOption?.value || qcLevelIdFromRecord,
      machineId: machineOption?.value || record.machineId,
      unit: record.unit,
      decimals: record.decimals,
      mean: record.mean,
      sd: record.sd,
      cv: record.cv,
      tea: record.tea,
      cvRef: record.cvRef,
      peerGroup: record.peerGroup,
      biasEqa: record.biasEqa,
      inputDate: (record as any).inputDate ? dayjs((record as any).inputDate) : undefined,
      exp: record.exp ? dayjs(record.exp) : undefined,
      method: record.method,
      note: record.note,
      biasMethod: (record.biasMethod as any)?.id || record.biasMethod,
    }
    
    console.log('Setting form values:', formValues)
    console.log('machineId value:', formValues.machineId)
    console.log('machineOptions at form set:', machineOptions)
    
    form.setFieldsValue(formValues as any)
    
    console.log('Form values set, opening modal...')
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await limitService.delete(id)
      message.success('Xóa thiết lập thành công')
      await reloadLimitsNow()
    } catch (error) {
      console.error('Delete error:', error)
      message.error('Có lỗi xảy ra khi xóa thiết lập')
    }
  }

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      
      // Find IDs for the selected values
      const selectedLot = lotOptions.find(lot => lot.value === values.lot)
      const selectedAnalyte = analyteOptions.find(analyte => analyte.value === values.analyteId)
      
      // Handle multi-select for machines and QC levels
      const selectedMachineIds = Array.isArray(values.machineId) ? values.machineId : [values.machineId]
      const selectedQcLevelIds = Array.isArray(values.qcLevel) ? values.qcLevel : [values.qcLevel]
      
      if (!selectedMachineIds.length || selectedMachineIds.every(id => !id)) {
        message.error('Vui lòng chọn ít nhất một máy xét nghiệm')
        return
      }
      
      if (!selectedQcLevelIds.length || selectedQcLevelIds.every(id => !id)) {
        message.error('Vui lòng chọn ít nhất một mức QC')
        return
      }

      if (editing) {
        // For editing, only update the single record (use first selected values)
        const qcLevelId = selectedQcLevelIds[0]
        const machineId = selectedMachineIds[0]
        
        const payload = {
          analyteId: selectedAnalyte?.value || values.analyteId,
          lotId: selectedLot?.id || values.lot,
          qcLevelId: qcLevelId,
          machineId: machineId,
          unit: values.unit,
          decimals: values.decimals || 2,
          mean: values.mean,
          sd: values.sd,
          cv: values.cv,
          tea: values.tea,
          cvRef: values.cvRef,
          peerGroup: values.peerGroup,
          biasEqa: values.biasEqa,
          inputDate: (values as any).inputDate ? ((values as any).inputDate as any).format('YYYY-MM-DD') : undefined,
          exp: values.exp ? (values.exp as any).format('YYYY-MM-DD') : undefined,
          method: values.method,
          note: values.note,
          biasMethodId: values.biasMethod,
        }
        
        await limitService.update(editing.id, { ...payload, id: editing.id })
        message.success('Cập nhật thiết lập thành công')
      } else {
        // For creating, create multiple records for each machine + QC level combination
        const createPromises = []
        const seenCombinations = new Set<string>()
        
        for (const machineId of selectedMachineIds) {
          if (!machineId) continue
          
          for (const qcLevelId of selectedQcLevelIds) {
            if (!qcLevelId) continue
            
            // Create unique key to avoid duplicates
            const combinationKey = `${machineId}-${qcLevelId}`
            if (seenCombinations.has(combinationKey)) {
              console.log(`Skipping duplicate combination: ${combinationKey}`)
              continue
            }
            seenCombinations.add(combinationKey)
            
            const payload = {
              analyteId: selectedAnalyte?.value || values.analyteId,
              lotId: selectedLot?.id || values.lot,
              qcLevelId: qcLevelId,
              machineId: machineId,
              unit: values.unit,
              decimals: values.decimals || 2,
              mean: values.mean,
              sd: values.sd,
              cv: values.cv,
              tea: values.tea,
              cvRef: values.cvRef,
              peerGroup: values.peerGroup,
              biasEqa: values.biasEqa,
              inputDate: (values as any).inputDate ? ((values as any).inputDate as any).format('YYYY-MM-DD') : undefined,
              exp: values.exp ? (values.exp as any).format('YYYY-MM-DD') : undefined,
              method: values.method,
              note: values.note,
              biasMethodId: values.biasMethod,
            }
            
            createPromises.push(limitService.create(payload))
          }
        }
        
        // Execute all create operations
        const results = await Promise.all(createPromises)
        const successCount = results.filter(r => r.success).length
        const totalCount = createPromises.length
        
        if (successCount === totalCount) {
          message.success(`Tạo/cập nhật thành công ${successCount} thiết lập QC`)
        } else if (successCount > 0) {
          message.warning(`Tạo/cập nhật thành công ${successCount}/${totalCount} thiết lập QC`)
        } else {
          message.error('Không thể tạo thiết lập QC nào')
        }
      }
      
      setOpen(false)
      await reloadLimitsNow()
    } catch (error) {
      console.error('Save error:', error)
      message.error('Có lỗi xảy ra khi lưu thiết lập')
    }
  }


  const exportCsv = async () => {
    try {
      if (!selectedLotId || !selectedMachineFilter) {
        message.warning('Chọn lô và máy trước khi xuất')
        return
      }
      await exportLimitsByLotMachine(selectedLotId, selectedMachineFilter)
    } catch (e) {
      console.error('Export by lot error', e)
      message.error('Xuất theo lô thất bại')
    }
  }
  

  const importCsv = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const lines = text.split(/\r?\n/).filter(l => l.trim().length)
        
        if (lines.length < 2) {
          message.warning('File không có dữ liệu')
          return
        }
        
        const headers = lines[0].split(',').map(h => h.trim())
        const getColumnIndex = (name: string) => headers.indexOf(name)
        
        const importedData: QCLimit[] = []
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',')
          const record: QCLimit = {
            id: String(Date.now()) + '-' + i,
            analyteId: columns[getColumnIndex('analyteId')] || '',
            analyteName: columns[getColumnIndex('analyteName')] || columns[getColumnIndex('analyteId')] || '',
            qcLevel: columns[getColumnIndex('qcLevel')] || '',
            lot: columns[getColumnIndex('lot')] || '',
            applyToMachine: false,
            unit: columns[getColumnIndex('unit')] || '',
            decimals: Number(columns[getColumnIndex('decimals')] || 0),
            mean: Number(columns[getColumnIndex('mean')] || 0),
            sd: Number(columns[getColumnIndex('sd')] || 0),
            tea: columns[getColumnIndex('tea')] ? Number(columns[getColumnIndex('tea')]) : undefined,
            cvRef: columns[getColumnIndex('cvRef')] ? Number(columns[getColumnIndex('cvRef')]) : undefined,
            peerGroup: columns[getColumnIndex('peerGroup')] ? Number(columns[getColumnIndex('peerGroup')]) : undefined,
            biasEqa: columns[getColumnIndex('biasEqa')] ? Number(columns[getColumnIndex('biasEqa')]) : undefined,
            exp: columns[getColumnIndex('exp')] || undefined,
            method: columns[getColumnIndex('method')] || undefined,
            note: columns[getColumnIndex('note')] || undefined,
            createdBy: columns[getColumnIndex('createdBy')] || currentUser,
            updatedBy: columns[getColumnIndex('updatedBy')] || currentUser,
          }
          importedData.push(record)
        }
        
        // Data will be reloaded automatically by useApi hook
        message.success('Đã nhập dữ liệu thành công')
      } catch (error) {
        console.error('Error importing CSV:', error)
        message.error('Không thể đọc file')
      }
    }
    reader.readAsText(file)
  }

  // Import XLSX with the SAME structure as exported files
  const importXlsx = async (file: File) => {
    try {
      if (!selectedLotId) {
        message.warning('Vui lòng chọn lô trước khi nhập từ file')
        return
      }
      if (!selectedMachineFilter) {
        message.warning('Vui lòng chọn máy trước khi nhập từ file')
        return
      }
      await importLimitsFromXlsx(file, { lotId: selectedLotId, machineId: selectedMachineFilter })
      // Data will be reloaded automatically by useApi hook
      message.success('Nhập dữ liệu từ XLSX thành công')
      await reloadLimitsNow()
    } catch (e) {
      console.error('Import XLSX failed', e)
      message.error('Không thể nhập từ file XLSX')
    }
  }

  // Note: Filtering, searching, sorting, and pagination are now handled by backend API

  return (
    <div>
      {/* Header Controls */}
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Select
          style={{ width: 220 }}
          placeholder="Chọn lô QC"
          value={selectedLot}
          options={lotOptions}
          onChange={(value, option: any) => {
            setSelectedLot(value as string)
            setSelectedLotId(option?.id)
          }}
        />
        <Select
          style={{ width: 200 }}
          placeholder="Lọc theo máy"
          value={selectedMachineFilter}
          onChange={(value) => setSelectedMachineFilter(value as string | undefined)}
          allowClear
          options={machineOptions}
        />
        <Select
          value={selectedQc}
          onChange={(value) => setSelectedQc(value as string)}
          style={{ width: 180 }}
          placeholder="Chọn mức QC"
          options={qcLevelOptions}
        />
        <Input.Search
          placeholder="Tìm kiếm theo tên, lô, máy, đơn vị..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Button 
          onClick={() => { 
            setEditing(null)
            form.resetFields()
            // Set default values from current filters
            form.setFieldsValue({
              lot: selectedLot,
              qcLevel: selectedQc,
              machineId: selectedMachineFilter
            })
            setOpen(true)
          }}
          type="primary"
        >
          Thêm giới hạn
        </Button>
        <Button onClick={exportCsv}>Xuất ra file</Button>
        
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".xlsx,.csv" 
          style={{ display: 'none' }} 
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              const name = file.name.toLowerCase()
              if (name.endsWith('.xlsx')) {
                importXlsx(file)
              } else if (name.endsWith('.csv')) {
                importCsv(file)
              } else {
                message.warning('Định dạng không hỗ trợ. Chọn .xlsx hoặc .csv')
              }
            }
            e.currentTarget.value = ''
          }} 
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          Nhập từ file
        </Button>
      </Space>

      {/* Data Table */}
      <div className="component-scroll" style={{ maxHeight: '60vh' }}>
        <Table 
          rowKey="id" 
          columns={columns as any} 
          dataSource={data} 
          loading={loading || filtersLoading}
          pagination={{ 
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true, 
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
            onChange: (newPage, newPageSize) => {
              pagination.setPage(newPage)
              if (newPageSize) pagination.setPageSize(newPageSize)
            }
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      {/* Edit/Add Modal */}
      <Modal
        open={open}
        title={editing ? 'Sửa thiết lập QC' : 'Thêm thiết lập QC'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QCLimitForm
            form={form}
            analyteOptions={analyteOptions}
            lotOptions={lotOptions}
            machineOptions={machineOptions}
            qcLevelOptions={qcLevelOptions}
          />
        </div>
      </Modal>

      {/* Add Analyte Modal */}
      <Modal
        open={addOpen}
        title="Chọn bộ xét nghiệm"
        onCancel={() => setAddOpen(false)}
        onOk={async () => {
          if (!selectedLot) { 
            message.warning('Chọn lô QC trước')
            return 
          }
          if (!checkedAnalytes?.length) { 
            message.warning('Chọn ít nhất 1 bộ xét nghiệm')
            return 
          }
          if (!selectedMachineFilter) {
            message.warning('Vui lòng chọn máy để thêm bộ xét nghiệm')
            return
          }
          
          try {
            console.log('Adding analytes:', {
              selectedLotId,
              checkedAnalytes,
              selectedMachineFilter
            })
            
            // Tạo trực tiếp cho máy cụ thể và TẤT CẢ mức QC của lô
            for (const qcLevel of qcLevelOptions.map(q => q.value)) {
              console.log('Creating limits for QC level:', qcLevel, 'and machine:', selectedMachineFilter)
              await (window as any).iqc?.limits?.batchAdd?.(
                selectedLotId, 
                qcLevel, 
                checkedAnalytes, 
                selectedMachineFilter, // Gửi machine_id trực tiếp
                currentUser
              )
            }
            
            // Data will be reloaded automatically by useApi hook
            message.success('Đã thêm bộ xét nghiệm')
          } catch (error) {
            console.error('Error adding analytes:', error)
            message.error('Không thể thêm bộ xét nghiệm')
          }
          setAddOpen(false)
        }}
        okText="Lưu cài đặt"
        cancelText="Hủy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedMachineFilter && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f0f8ff', 
              border: '1px solid #1890ff', 
              borderRadius: 6 
            }}>
              <span style={{ color: '#1890ff', fontWeight: 500 }}>
                Sẽ áp dụng cho máy: {machineOptions.find(m => m.value === selectedMachineFilter)?.label || selectedMachineFilter}
              </span>
            </div>
          )}
          {!selectedMachineFilter && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#fff7e6', 
              border: '1px solid #ffa940', 
              borderRadius: 6 
            }}>
              <span style={{ color: '#d46b08', fontWeight: 500 }}>
                ⚠️ Vui lòng chọn máy ở bộ lọc phía trên trước khi thêm bộ xét nghiệm
              </span>
            </div>
          )}
          
          <Checkbox.Group
            style={{ width: '100%' }}
            value={checkedAnalytes}
            onChange={(values) => setCheckedAnalytes(values as string[])}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, minmax(0,1fr))', 
              gap: 8 
            }}>
              {availableAnalytes.length > 0 ? (
                availableAnalytes.map(analyte => (
                  <label 
                    key={analyte.value} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '6px 8px', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: 6 
                    }}
                  >
                    <Checkbox value={analyte.value} />
                    <span>{analyte.label}</span>
                  </label>
                ))
              ) : (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#999' 
                }}>
                  Tất cả bộ xét nghiệm đã được thêm cho lô và mức QC này
                </div>
              )}
            </div>
          </Checkbox.Group>
        </div>
      </Modal>
    </div>
  )
}

export default LimitsPage
