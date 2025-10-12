import React, { useEffect, useState } from 'react'
import { Form, Select } from 'antd'
import { departmentService } from '../services'

interface DepartmentSelectProps {
  name?: string
  label?: string
  placeholder?: string
  required?: boolean
  currentRole?: string
}

const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  name = 'departmentId',
  label = 'Khoa phòng',
  placeholder = 'Chọn khoa phòng',
  required = false,
  currentRole
}) => {
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadDepartments = async () => {
      if (currentRole === 'admin') {
        setLoading(true)
        try {
          const response = await departmentService.list({ options: true })
          setDepartments(Array.isArray(response.data) ? response.data : response.data.items)
        } catch (error) {
          console.error('Failed to load departments:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    loadDepartments()
  }, [currentRole])

  // Chỉ hiển thị cho admin
  if (currentRole !== 'admin') {
    return null
  }

  return (
    <Form.Item 
      name={name} 
      label={label}
      rules={required ? [{ required: true, message: `Vui lòng chọn ${label.toLowerCase()}` }] : []}
    >
      <Select
        placeholder={placeholder}
        allowClear
        loading={loading}
        options={departments.map(d => ({ value: d.id, label: d.name }))}
      />
    </Form.Item>
  )
}

export default DepartmentSelect


