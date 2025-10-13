import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Skeleton, message } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { exportAnalytesToExcel } from '../utils/export'
import { fetchAllPaginated } from '../utils/fetchAll'
import { importAnalytesFromXlsx } from '../utils/analytesImportExport'
import { useApi, usePagination } from '../hooks'
import { analyteService, Analyte } from '../services'
import DepartmentSelect from '../components/DepartmentSelect'

const AnalytesPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Analyte | null>(null)
  const [form] = Form.useForm<Analyte>()
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // API hooks
  const { data: apiData, loading, execute: loadAnalytes } = useApi(analyteService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  
  // Get current user from auth context
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // Debounced search
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load analytes on component mount and when pagination changes
  useEffect(() => {
    loadAnalytes({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined
    })
  }, [pagination.page, pagination.pageSize, debouncedSearchText])

  // Update pagination when API data changes
  useEffect(() => {
    if (apiData && 'total' in apiData) {
      pagination.setTotal(apiData.total)
    }
  }, [apiData])

  // Get data from API response
  const data = apiData && 'items' in apiData ? apiData.items : (apiData as Analyte[] || [])
  
  const filteredData = useMemo(() => {
    let result = data
    
    // Sort by field and order (search is handled by API)
    if (sortField && sortOrder) {
      result = [...result].sort((a, b) => {
        const aValue = (a as any)[sortField] || ''
        const bValue = (b as any)[sortField] || ''
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'vi', { numeric: true })
          return sortOrder === 'ascend' ? comparison : -comparison
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue
          return sortOrder === 'ascend' ? comparison : -comparison
        }
        
        return 0
      })
    }
    
    return result
  }, [data, sortField, sortOrder])

  const columns = useMemo(() => ([
    { title: 'STT', width: 80, render: (_: any, __: Analyte, index: number) => index + 1 },
    { 
      title: 'Mã', 
      dataIndex: 'code', 
      width: 100,
      sorter: true,
    },
    { 
      title: 'Tên xét nghiệm', 
      dataIndex: 'name',
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm kiếm tên xét nghiệm"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Tìm
            </Button>
            <Button
              onClick={() => clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: string, record: Analyte) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: 'Đơn vị', 
      dataIndex: 'unit', 
      width: 120,
      sorter: true,
    },
    { 
      title: 'Số thập phân', 
      dataIndex: 'decimals', 
      width: 140,
      sorter: true,
    },
    { 
      title: 'Yêu cầu chất lượng', 
      dataIndex: 'qualityRequirement', 
      width: 180,
      sorter: true,
    },
    { title: 'Ghi chú', dataIndex: 'note', sorter: true },
    { 
      title: 'Tạo bởi', 
      dataIndex: 'createdBy', 
      width: 140,
      sorter: true,
    },
    { 
      title: 'Cập nhật bởi', 
      dataIndex: 'updatedBy', 
      width: 160,
      sorter: true,
    },
    {
      title: 'Hành động', width: 160,
      render: (_: any, record: Analyte) => {
        const canModify = true
        return (
          <Space>
            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)} disabled={!canModify}>Sửa</Button>
            <Popconfirm
              title="Xóa xét nghiệm?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
              disabled={!canModify}
            >
              <Button size="small" danger ghost icon={<DeleteOutlined />} disabled={!canModify}>Xóa</Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]), [])

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const onEdit = (rec: Analyte) => {
    setEditing(rec)
    form.setFieldsValue(rec)
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await analyteService.delete(id)
      message.success('Xóa thành công')
      // Reload data
      loadAnalytes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchText || undefined
      })
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa')
    }
  }

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await analyteService.update(editing.id, {
          ...values,
          qualityRequirement: values.qualityRequirement
        })
        message.success('Cập nhật thành công')
      } else {
        await analyteService.create({
          ...values,
          qualityRequirement: values.qualityRequirement
        })
        message.success('Tạo mới thành công')
      }
      setOpen(false)
      // Reload data
      loadAnalytes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchText || undefined
      })
    } catch (error) {
      message.error('Có lỗi xảy ra')
    }
  }

  const handleExport = async () => {
    try {
      message.loading('Đang xuất file...', 0)
      const all = await fetchAllPaginated(analyteService.list as any, { search: debouncedSearchText || undefined } as any, 1000)
      exportAnalytesToExcel(all)
      message.destroy()
      message.success('Xuất file thành công')
    } catch (error) {
      console.error('Export error:', error)
      message.error('Lỗi khi xuất file')
    }
  }

  const handleImport = async (file: File) => {
    try {
      const results = await importAnalytesFromXlsx(file, currentUser)
      
      // Reload data
      loadAnalytes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchText || undefined
      })

      // Show results
      let resultMessage = `Import hoàn thành: ${results.created} tạo mới, ${results.updated} cập nhật`
      if (results.skipped > 0) {
        resultMessage += `, ${results.skipped} bỏ qua`
      }
      message.success(resultMessage)

      if (results.errors.length > 0) {
        console.warn('Import errors:', results.errors)
        message.warning(`${results.errors.length} dòng có lỗi (xem console)`)
      }
    } catch (error) {
      console.error('Import error:', error)
      message.error('Lỗi khi nhập file')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" onClick={onCreate}>Thêm xét nghiệm</Button>
          <Button onClick={handleExport}>Xuất file</Button>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".xlsx" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.currentTarget.value = ''
            }} 
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Nhập file
          </Button>
        </Space>
        <Input
          placeholder="Tìm kiếm xét nghiệm..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : <Table 
        rowKey="id" 
        columns={columns as any} 
        dataSource={filteredData} 
        loading={loading}
        pagination={{ 
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          onChange: pagination.setPage,
          onShowSizeChange: (_, size) => pagination.setPageSize(size)
        }}
        scroll={{ x: 1000 }}
        onChange={(_, __, sorter: any) => {
          if (sorter && sorter.field) {
            setSortField(sorter.field)
            setSortOrder(sorter.order)
          } else {
            setSortField('')
            setSortOrder(null)
          }
        }}
      />}

      <Modal
        open={open}
        title={editing ? 'Sửa xét nghiệm' : 'Thêm xét nghiệm'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Tên xét nghiệm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="decimals" label="Số thập phân" rules={[{ required: true }]}>
            <InputNumber min={0} max={6} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="qualityRequirement" label="Yêu cầu chất lượng">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <DepartmentSelect 
            currentRole={currentRole}
            required={false}
          />
        </Form>
      </Modal>
    </div>
  )
}

export default AnalytesPage


