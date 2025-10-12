import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import { lotService, Lot } from '../services'

interface LotMultiSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
}

const LotMultiSelect: React.FC<LotMultiSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "Chọn lô",
  disabled = false 
}) => {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadLots = async () => {
      setLoading(true)
      try {
        const response = await lotService.list({ options: true })
        const lotData = Array.isArray(response.data) ? response.data : response.data.items
        setLots(lotData)
      } catch (error) {
        console.error('Failed to load lots:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLots()
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
      options={lots.map(lot => ({
        value: lot.id,
        label: `${lot.code} - ${lot.lotName || 'N/A'}`,
      }))}
    />
  )
}

export default LotMultiSelect


