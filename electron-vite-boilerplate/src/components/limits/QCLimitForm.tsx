import React from 'react'
import { DatePicker, Form, Input, InputNumber, Space, Select } from 'antd'
import { BiasMethodManager } from '../bias/BiasMethodManager'
import { lotService, machineService } from '../../services'

export type QCLimitFormValues = {
  analyteId: string
  qcLevel: string
  lot: string
  unit: string
  decimals: number
  mean: number
  sd: number
  cv?: number
  tea?: number
  cvRef?: number
  peerGroup?: number
  biasEqa?: number
  qcName?: string
  exp?: any
  method?: string
  note?: string
  biasMethod?: string
}

type Option = { value: string; label: string; id?: string }

type Props = {
  form: any
  analyteOptions: Option[]
  lotOptions: Option[]
  machineOptions?: Option[]
  qcLevelOptions?: Option[]
}

const QCLimitForm: React.FC<Props> = ({ form, analyteOptions, lotOptions, machineOptions = [], qcLevelOptions = [] }) => {
  const decimals = Form.useWatch('decimals', form) ?? 2
  const mean = Form.useWatch('mean', form) ?? 0
  const sd = Form.useWatch('sd', form) ?? 0
  const cv = Form.useWatch('cv', form)
  const selectedLot = Form.useWatch('lot', form)
  const neg2sd = Number((mean - 2 * sd).toFixed(decimals))
  const pos2sd = Number((mean + 2 * sd).toFixed(decimals))
  
  // Filter machines based on selected lot
  const [filteredMachineOptions, setFilteredMachineOptions] = React.useState(machineOptions)
  
  React.useEffect(() => {
    const loadMachinesForLot = async () => {
      console.log('=== QCLimitForm loadMachinesForLot ===')
      console.log('selectedLot:', selectedLot)
      console.log('lotOptions:', lotOptions)
      console.log('machineOptions:', machineOptions)
      
      if (selectedLot) {
        try {
          // Find lot ID from lot code
          const lotOption = lotOptions.find(lot => lot.value === selectedLot)
          console.log('Found lotOption:', lotOption)
          
          if (lotOption?.id) {
            // Load machines for this specific lot using machineService
            console.log('Loading machines for lot ID:', lotOption.id)
            const response = await machineService.list({ lotId: lotOption.id, page: 1, pageSize: 1000 })
            console.log('Machine response:', response)
            
            if (response.success && response.data) {
              const machines = 'items' in response.data ? response.data.items : response.data
              console.log('Machines loaded:', machines)
              
              const machineOptions = machines.map((machine: any) => ({
                value: machine.id,
                label: `${machine.deviceCode} - ${machine.name}`
              }))
              console.log('Machine options created:', machineOptions)
              setFilteredMachineOptions(machineOptions)
            } else {
              console.log('Failed to load machines, using fallback')
              setFilteredMachineOptions(machineOptions)
            }
          } else {
            // Fallback to all machines if lot not found
            console.log('Lot not found, using fallback machines')
            setFilteredMachineOptions(machineOptions)
          }
          
          // Only clear machine selection if we're not in edit mode
          // Check if form has machineId value (indicating edit mode)
          const currentMachine = form.getFieldValue('machineId')
          const isEditMode = !!currentMachine
          console.log('Is edit mode:', isEditMode)
          console.log('Current machine:', currentMachine)
          
          if (!isEditMode) {
            console.log('Add mode - not clearing machine selection')
          } else {
            console.log('Edit mode - keeping machine selection')
          }
        } catch (error) {
          console.error('Error loading machines for lot:', error)
          // Fallback to all machines on error
          setFilteredMachineOptions(machineOptions)
        }
      } else {
        // When no lot selected, show all machines
        console.log('No lot selected, showing all machines')
        setFilteredMachineOptions(machineOptions)
      }
    }

    loadMachinesForLot()
  }, [selectedLot, lotOptions, machineOptions, form])
  
  // Calculate CV% automatically
  const calculatedCV = mean && sd > 0 ? Number(((sd / mean) * 100).toFixed(2)) : null

  const round = (v: number) => Number(v.toFixed(decimals))
  
  // Auto-update CV% when Mean or SD changes (only if CV% is empty)
  React.useEffect(() => {
    if (calculatedCV && (!cv || cv === 0)) {
      form.setFieldValue('cv', calculatedCV)
    }
  }, [mean, sd, calculatedCV, cv, form])

  return (
    <Form form={form} layout="vertical">
      {/* Thông tin cơ bản */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Thông tin cơ bản</h4>
        <Space size={12} style={{ display: 'flex' }} wrap>
          <Form.Item name="analyteId" label="Bộ XN" rules={[{ required: true, message: 'Vui lòng chọn bộ xét nghiệm' }]} style={{ width: 200 }}>
            <Select placeholder="Chọn bộ xét nghiệm" options={analyteOptions} />
          </Form.Item>
          <Form.Item name="lot" label="Lô" rules={[{ required: true, message: 'Vui lòng chọn lô' }]} style={{ width: 200 }}>
            <Select placeholder="Chọn lô" options={lotOptions} />
          </Form.Item>
          <Form.Item name="machineId" label="Máy" style={{ width: 200 }}>
            <Select 
              placeholder="Chọn máy" 
              options={filteredMachineOptions} 
              allowClear
              onDropdownVisibleChange={(open) => {
                console.log('=== MACHINE DROPDOWN DEBUG ===')
                console.log('Dropdown open:', open)
                console.log('filteredMachineOptions:', filteredMachineOptions)
                console.log('Form machineId value:', form.getFieldValue('machineId'))
                console.log('================================')
              }}
            />
          </Form.Item>
          <Form.Item name="qcLevel" label="Mức QC" rules={[{ required: true, message: 'Vui lòng chọn mức QC' }]} style={{ width: 200 }}>
            <Select placeholder="Chọn mức QC" options={qcLevelOptions} />
          </Form.Item>
        </Space>
      </div>

      {/* Giá trị thống kê */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Giá trị thống kê</h4>
        <Space size={12} style={{ display: 'flex' }} wrap>
          <Form.Item label="-2SD" style={{ width: 160 }}>
            <InputNumber style={{ width: '100%' }} value={neg2sd} onChange={(v) => {
              const val = Number(v)
              if (!isNaN(val)) {
                const pos = pos2sd
                const newMean = (pos + val) / 2
                const newSd = (pos - val) / 4
                form.setFieldsValue({ mean: round(newMean), sd: round(newSd) })
              }
            }} />
          </Form.Item>
          <Form.Item label="+2SD" style={{ width: 160 }}>
            <InputNumber style={{ width: '100%' }} value={pos2sd} onChange={(v) => {
              const val = Number(v)
              if (!isNaN(val)) {
                const neg = neg2sd
                const newMean = (val + neg) / 2
                const newSd = (val - neg) / 4
                form.setFieldsValue({ mean: round(newMean), sd: round(newSd) })
              }
            }} />
          </Form.Item>
          <Form.Item name="mean" label="Mean" rules={[{ required: true }]} style={{ width: 160 }}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sd" label="SD" rules={[{ required: true }]} style={{ width: 160 }}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cv" label="CV%" style={{ width: 160 }}>
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder={calculatedCV ? `Tự tính: ${calculatedCV}%` : 'Nhập CV%'}
              addonAfter="%"
            />
          </Form.Item>
        </Space>
      </div>

      {/* Thông số kỹ thuật */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Thông số kỹ thuật</h4>
        <Space size={12} style={{ display: 'flex' }} wrap>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]} style={{ width: 160 }}>
            <Input />
          </Form.Item>
          <Form.Item name="decimals" label="Số thập phân" rules={[{ required: true }]} style={{ width: 160 }}>
            <InputNumber min={0} max={6} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tea" label="TEA%" style={{ width: 160 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cvRef" label="CV% REF" style={{ width: 160 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="peerGroup" label="Peer group (n)" style={{ width: 200 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="biasEqa" label="Bias% EQA" style={{ width: 160 }}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Space>
      </div>

      {/* Thông tin bổ sung */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1677ff' }}>Thông tin bổ sung</h4>
        <Space size={12} style={{ display: 'flex' }} wrap>
          <Form.Item name="biasMethod" label="Cách tính BIAS" style={{ width: 220 }}>
            <BiasMethodManager 
              value={form.getFieldValue('biasMethod')}
              onChange={(value) => form.setFieldValue('biasMethod', value)}
              placeholder="Chọn phương pháp BIAS"
            />
          </Form.Item>
          <Form.Item name="exp" label="EXP" style={{ width: 220 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Space>
        <Form.Item name="method" label="Phương pháp">
          <Input />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </div>
    </Form>
  )
}

export default QCLimitForm

