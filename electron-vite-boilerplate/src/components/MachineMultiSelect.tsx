import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import { machineService, Machine } from '../services'

interface MachineMultiSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
}

const MachineMultiSelect: React.FC<MachineMultiSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "Chọn máy",
  disabled = false 
}) => {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadMachines = async () => {
      setLoading(true)
      try {
        const response = await machineService.list({ options: true })
        const machineData = Array.isArray(response.data) ? response.data : response.data.items
        setMachines(machineData)
      } catch (error) {
        console.error('Failed to load machines:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMachines()
  }, [])

  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={machines.map(machine => ({
        value: machine.id,
        label: `${machine.deviceCode} - ${machine.name}`,
      }))}
    />
  )
}

export default MachineMultiSelect


