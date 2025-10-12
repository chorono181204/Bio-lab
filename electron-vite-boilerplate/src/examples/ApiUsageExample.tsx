import React, { useEffect, useState } from 'react'
import { Button, Table, message, Space } from 'antd'
import { useApi, usePagination } from '../hooks'
import { analyteService, Analyte } from '../services'

// Example component showing how to use the new API configuration
const ApiUsageExample: React.FC = () => {
  const [analytes, setAnalytes] = useState<Analyte[]>([])
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 })
  
  // Using useApi hook for loading states
  const { data, loading, error, execute } = useApi(analyteService.list)

  // Load analytes on component mount
  useEffect(() => {
    loadAnalytes()
  }, [pagination.page, pagination.pageSize])

  const loadAnalytes = async () => {
    const result = await execute({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    
    if (result) {
      setAnalytes(result.items)
      pagination.setTotal(result.total)
    }
  }

  const handleCreate = async () => {
    try {
      const newAnalyte = await analyteService.create({
        code: 'TEST',
        name: 'Test Analyte',
        unit: 'mg/dL',
        decimals: 2
      })
      
      if (newAnalyte.success) {
        message.success('Tạo thành công')
        loadAnalytes() // Reload data
      }
    } catch (error) {
      message.error('Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await analyteService.delete(id)
      message.success('Xóa thành công')
      loadAnalytes() // Reload data
    } catch (error) {
      message.error('Có lỗi xảy ra')
    }
  }

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Analyte) => (
        <Space size="middle">
          <Button 
            type="link" 
            danger
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ]

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreate}>
          Tạo mới
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={analytes}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: pagination.setPage,
          onShowSizeChange: (_, size) => pagination.setPageSize(size),
        }}
      />
    </div>
  )
}

export default ApiUsageExample







