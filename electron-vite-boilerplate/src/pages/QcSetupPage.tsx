import React, { useMemo, useState, useEffect } from 'react'
import { Button, Table, Modal, Form, Input, Space, Popconfirm, message, Skeleton } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useApi, usePagination } from '../hooks'
import { qcLevelService, QcLevel } from '../services'
import DepartmentSelect from '../components/DepartmentSelect'

const QcSetupPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<QcLevel | null>(null)
  const [form] = Form.useForm<QcLevel>()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // API hooks
  const { data: apiData, loading, execute: loadQcLevels } = useApi(qcLevelService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  const data = apiData && 'items' in apiData ? apiData.items : []

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load data on mount and when filters change
  useEffect(() => {
    loadQcLevels({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined
    })
  }, [pagination.page, pagination.pageSize, debouncedSearchText])

  // Sync pagination total
  useEffect(() => {
    if (apiData && 'total' in apiData) {
      pagination.setTotal(apiData.total)
    }
  }, [apiData])

  // Note: Search is now handled by backend, no need for frontend filtering

  const columns = useMemo(() => {
    const baseColumns = [
      { 
        title: 'STT', 
        width: 80, 
        render: (_: any, __: QcLevel, index: number) => (pagination.page - 1) * pagination.pageSize + index + 1 
      },
      { 
        title: 'Tên mức QC', 
        dataIndex: 'name', 
        width: 200, 
        sorter: (a: QcLevel, b: QcLevel) => (a.name || '').localeCompare(b.name || ''),
      },
    ]

    // Chỉ hiển thị cột "Khoa phòng" với admin
    if (currentRole === 'admin') {
      baseColumns.push({
        title: 'Khoa phòng', 
        dataIndex: 'department', 
        width: 150,
        render: (department: any) => department?.name || '-',
        sorter: (a: QcLevel, b: QcLevel) => (a.department?.name || '').localeCompare(b.department?.name || ''),
      })
    }

    return baseColumns.concat([
      { 
        title: 'Tạo bởi', 
        dataIndex: 'createdBy', 
        width: 140,
        sorter: (a: QcLevel, b: QcLevel) => (a.createdBy || '').localeCompare(b.createdBy || ''),
      },
      { 
        title: 'Cập nhật bởi', 
        dataIndex: 'updatedBy', 
        width: 160,
        sorter: (a: QcLevel, b: QcLevel) => (a.updatedBy || '').localeCompare(b.updatedBy || ''),
      },
      {
        title: 'Hành động', 
        width: 160,
        render: (_: any, record: QcLevel) => {
          const isOwner = record.createdBy === currentUser
          const isAdmin = currentRole === 'admin'
          const isManager = currentRole === 'manager'
          // Cho phép admin, manager hoặc người tạo sửa
          // Nếu không có createdBy (seed data), cho phép manager trở lên
          const canModify = isAdmin || isManager || (isOwner && record.createdBy)
          return (
            <Space>
              <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)} disabled={!canModify}>Sửa</Button>
              <Popconfirm
                title="Xóa mức QC?"
                description="Bạn có chắc chắn muốn xóa mức QC này?"
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
    ])
  }, [pagination.page, pagination.pageSize, currentUser, currentRole])

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const onEdit = (rec: QcLevel) => {
    setEditing(rec)
    form.setFieldsValue({
      name: rec.name,
      departmentId: rec.departmentId,
    } as any)
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await qcLevelService.delete(id)
      message.success('Xóa mức QC thành công')
      loadQcLevels({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchText || undefined
      })
    } catch (error) {
      console.error('Delete error:', error)
      message.error('Có lỗi xảy ra khi xóa mức QC')
    }
  }

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name,
        departmentId: values.departmentId,
      }
      
      if (editing) {
        await qcLevelService.update(editing.id, { ...payload, id: editing.id })
        message.success('Cập nhật mức QC thành công')
      } else {
        await qcLevelService.create(payload)
        message.success('Tạo mức QC thành công')
      }
      
      setOpen(false)
      loadQcLevels({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchText || undefined
      })
    } catch (error) {
      console.error('Save error:', error)
      message.error('Có lỗi xảy ra khi lưu mức QC')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Button type="primary" onClick={onCreate}>Thêm mức QC</Button>
        <Input
          placeholder="Tìm kiếm mức QC..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : (
        <div className="component-scroll" style={{ maxHeight: '60vh' }}>
          <Table 
            rowKey="id" 
            columns={columns as any} 
            dataSource={data} 
            loading={loading}
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
      )}

      <Modal
        open={open}
        title={editing ? 'Sửa mức QC' : 'Thêm mức QC mới'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="Tên mức QC" 
            rules={[
              { required: true, message: 'Vui lòng nhập tên mức QC' },
              { min: 2, message: 'Tên mức QC phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="VD: QC1, QC2, QC3" />
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

export default QcSetupPage





