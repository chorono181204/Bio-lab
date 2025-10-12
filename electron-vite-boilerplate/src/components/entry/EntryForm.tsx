import React, { useState, useEffect } from 'react'
import { Form, Select, InputNumber, DatePicker, Input, Space, Button } from 'antd'
import { limitService } from '../../services/limit.service'
import { lotService } from '../../services/lot.service'
const { TextArea } = Input

export interface EntryFormValues {
  lotId: string
  machineId: string
  qcLevelId: string
  analyteId: string
  value: number
  date: any
  note?: string
}

interface EntryFormProps {
  form: any
  onSave: (values: EntryFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const EntryForm: React.FC<EntryFormProps> = ({
  form,
  onSave,
  onCancel,
  loading = false
}) => {
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string; id: string }[]>([])
  const [machineOptions, setMachineOptions] = useState<{ value: string; label: string }[]>([])
  const [qcLevelOptions, setQcLevelOptions] = useState<{ value: string; label: string }[]>([])
  const [analyteOptions, setAnalyteOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const selectedLotId = Form.useWatch('lotId', form)
  const selectedMachineId = Form.useWatch('machineId', form)
  const selectedQcLevelId = Form.useWatch('qcLevelId', form)

  // Load lots
  useEffect(() => {
    const loadLots = async () => {
      try {
        const response = await lotService.list({ page: 1, pageSize: 1000 })
        if (response.success && response.data) {
          const lots = 'items' in response.data ? response.data.items : []
          setLotOptions(lots.map((lot: any) => ({ 
            value: lot.id, // Use ID as value for form submission
            label: lot.code, // Display code as label
            id: lot.id 
          })))
        }
      } catch (error) {
        console.error('Load lots failed:', error)
      }
    }
    loadLots()
  }, [])

  // Load machines when lot changes
  useEffect(() => {
    const loadMachines = async () => {
      if (!selectedLotId) {
        setMachineOptions([])
        // Clear dependent fields
        form.setFieldsValue({
          machineId: undefined,
          qcLevelId: undefined,
          analyteId: undefined
        })
        return
      }

      try {
        setLoadingData(true)
        // selectedLotId is now the lot ID directly
        const response = await lotService.getMachines(selectedLotId)
        if (response.success && response.data) {
          const machines = response.data.map((machine: any) => ({
            value: machine.id,
            label: `${machine.deviceCode} - ${machine.name}`
          }))
          setMachineOptions(machines)
          
          // Auto-select first machine if none selected
          if (machines.length > 0) {
            const currentMachine = form.getFieldValue('machineId')
            if (!currentMachine || !machines.some(m => m.value === currentMachine)) {
              form.setFieldsValue({ machineId: machines[0].value })
            }
          }
        }
      } catch (error) {
        console.error('Load machines failed:', error)
      } finally {
        setLoadingData(false)
      }
    }
    loadMachines()
  }, [selectedLotId, lotOptions, form])

  // Load QC levels when lot + machine change
  useEffect(() => {
    const loadQcLevels = async () => {
      if (!selectedLotId || !selectedMachineId) {
        setQcLevelOptions([])
        setAnalyteOptions([])
        // Clear dependent fields
        form.setFieldsValue({
          qcLevelId: undefined,
          analyteId: undefined
        })
        return
      }

      try {
        setLoadingData(true)
        // Load limits to get QC levels
        const response = await limitService.list({
          lotId: selectedLotId,
          machineId: selectedMachineId,
          page: 1,
          pageSize: 1000
        })

        if (response.success && response.data) {
          const limits = 'items' in response.data ? response.data.items : []
          
          // Get unique QC levels only
          const qcLevelMap = new Map()
          
          limits.forEach((limit: any) => {
            if (limit.qcLevelId && limit.qcLevel) {
              qcLevelMap.set(limit.qcLevelId, limit.qcLevel)
            }
          })

          const qcLevelOptions = Array.from(qcLevelMap.entries()).map(([id, name]) => ({
            value: id,
            label: name
          }))

          setQcLevelOptions(qcLevelOptions)
          setAnalyteOptions([]) // Clear analytes initially

          // Auto-select first QC level if none selected
          if (qcLevelOptions.length > 0) {
            const currentQcLevel = form.getFieldValue('qcLevelId')
            if (!currentQcLevel || !qcLevelOptions.some(q => q.value === currentQcLevel)) {
              form.setFieldsValue({ qcLevelId: qcLevelOptions[0].value })
            }
          }

          // Auto-select first analyte if none selected
          if (analyteOptions.length > 0) {
            const currentAnalyte = form.getFieldValue('analyteId')
            if (!currentAnalyte || !analyteOptions.some(a => a.value === currentAnalyte)) {
              form.setFieldsValue({ analyteId: analyteOptions[0].value })
            }
          }
        }
      } catch (error) {
        console.error('Load QC levels failed:', error)
      } finally {
        setLoadingData(false)
      }
    }
    loadQcLevels()
  }, [selectedLotId, selectedMachineId, lotOptions, form])

  // Load analytes when QC level changes
  useEffect(() => {
    const loadAnalytes = async () => {
      if (!selectedLotId || !selectedMachineId || !selectedQcLevelId) {
        setAnalyteOptions([])
        form.setFieldsValue({ analyteId: undefined })
        return
      }

      try {
        setLoadingData(true)
        console.log('=== LOAD ANALYTES FOR QC LEVEL ===')
        console.log('selectedLotId:', selectedLotId)
        console.log('selectedMachineId:', selectedMachineId)
        console.log('selectedQcLevelId:', selectedQcLevelId)
        
        // Load limits to get analytes for specific QC level
        const response = await limitService.list({
          lotId: selectedLotId,
          machineId: selectedMachineId,
          qcLevel: selectedQcLevelId, // Filter by QC level ID (backend expects qcLevel)
          page: 1,
          pageSize: 1000
        })
        
        console.log('Analytes response:', response)

        if (response.success && response.data) {
          const limits = 'items' in response.data ? response.data.items : []
          
          // Get unique analytes for this QC level
          const analyteMap = new Map()
          
          limits.forEach((limit: any) => {
            if (limit.analyteId && limit.analyteName) {
              analyteMap.set(limit.analyteId, {
                name: limit.analyteName,
                code: limit.analyte?.code || ''
              })
            }
          })

          const analyteOptions = Array.from(analyteMap.entries()).map(([id, analyte]) => ({
            value: id,
            label: analyte.code ? `${analyte.code} - ${analyte.name}` : analyte.name
          }))

          setAnalyteOptions(analyteOptions)

          // Auto-select first analyte if none selected
          if (analyteOptions.length > 0) {
            const currentAnalyte = form.getFieldValue('analyteId')
            if (!currentAnalyte || !analyteOptions.some(a => a.value === currentAnalyte)) {
              form.setFieldsValue({ analyteId: analyteOptions[0].value })
            }
          }
        }
      } catch (error) {
        console.error('Error loading analytes:', error)
        setAnalyteOptions([])
      } finally {
        setLoadingData(false)
      }
    }

    loadAnalytes()
  }, [selectedLotId, selectedMachineId, selectedQcLevelId, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      await onSave({
        ...values,
        // values.lotId is already the lot ID
      })
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  return (
    <Form form={form} layout="vertical">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Basic Info */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Thông tin cơ bản</h4>
          <Space size={12} style={{ display: 'flex' }} wrap>
            <Form.Item 
              name="lotId" 
              label="Lô" 
              rules={[{ required: true, message: 'Vui lòng chọn lô' }]}
              style={{ width: 200 }}
            >
              <Select 
                placeholder="Chọn lô" 
                options={lotOptions}
                onChange={() => {
                  // Clear dependent fields when lot changes
                  form.setFieldsValue({
                    machineId: undefined,
                    qcLevelId: undefined,
                    analyteId: undefined
                  })
                }}
              />
            </Form.Item>

            <Form.Item 
              name="machineId" 
              label="Máy" 
              rules={[{ required: true, message: 'Vui lòng chọn máy' }]}
              style={{ width: 200 }}
            >
              <Select 
                placeholder="Chọn máy" 
                options={machineOptions}
                disabled={!selectedLotId || loadingData}
                onChange={() => {
                  // Clear dependent fields when machine changes
                  form.setFieldsValue({
                    qcLevelId: undefined,
                    analyteId: undefined
                  })
                }}
              />
            </Form.Item>

            <Form.Item 
              name="qcLevelId" 
              label="Mức QC" 
              rules={[{ required: true, message: 'Vui lòng chọn mức QC' }]}
              style={{ width: 200 }}
            >
              <Select 
                placeholder="Chọn mức QC" 
                options={qcLevelOptions}
                disabled={!selectedMachineId || loadingData}
                onChange={() => {
                  // Clear dependent fields when QC level changes
                  form.setFieldsValue({
                    analyteId: undefined
                  })
                }}
              />
            </Form.Item>

            <Form.Item 
              name="analyteId" 
              label="Bộ XN" 
              rules={[{ required: true, message: 'Vui lòng chọn bộ xét nghiệm' }]}
              style={{ width: 200 }}
            >
              <Select 
                placeholder="Chọn bộ XN" 
                options={analyteOptions}
                disabled={!selectedMachineId || loadingData}
              />
            </Form.Item>
          </Space>
        </div>

        {/* Entry Data */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Dữ liệu QC</h4>
          <Space size={12} style={{ display: 'flex' }} wrap>
            <Form.Item 
              name="value" 
              label="Giá trị" 
              rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
              style={{ width: 200 }}
            >
              <InputNumber 
                placeholder="Nhập giá trị" 
                style={{ width: '100%' }}
                precision={2}
              />
            </Form.Item>

            <Form.Item 
              name="date" 
              label="Ngày" 
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              style={{ width: 200 }}
            >
              <DatePicker 
                placeholder="Chọn ngày" 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Space>
        </div>

        {/* Additional Info */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Thông tin bổ sung</h4>
          <Form.Item name="note" label="Ghi chú" style={{ width: '100%' }}>
            <TextArea 
              placeholder="Nhập ghi chú (tùy chọn)" 
              rows={3}
            />
          </Form.Item>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={loading}
          >
            Lưu
          </Button>
        </div>
      </Space>
    </Form>
  )
}
