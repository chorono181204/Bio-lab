import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Skeleton, message } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useApi, usePagination } from '../hooks'
import { departmentService, Department } from '../services'

const DepartmentPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // API hooks
  const { data: apiData, loading, execute: loadDepartments } = useApi(departmentService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  const data = (apiData && 'items' in apiData ? apiData.items : []) as Department[]

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load data on mount and when filters change
  useEffect(() => {
    loadDepartments({
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

  const columns = useMemo(() => ([
    { 
      title: 'STT', 
      width: 80, 
      render: (_: any, __: Department, index: number) => (pagination.page - 1) * pagination.pageSize + index + 1 
    },
    { 
      title: 'Mã khoa', 
      dataIndex: 'code', 
      width: 120,
      sorter: (a: Department, b: Department) => a.code.localeCompare(b.code),
    },
    { 
      title: 'Tên khoa', 
      dataIndex: 'name', 
      width: 200,
      sorter: (a: Department, b: Department) => a.name.localeCompare(b.name),
    },
    { 
      title: 'Mô tả', 
      dataIndex: 'description', 
      width: 300,
      sorter: (a: Department, b: Department) => (a.description || '').localeCompare(b.description || ''),
    },
    { 
      title: 'Khóa tháng nhập liệu', 
      dataIndex: 'lockedEntryMonths', 
      width: 200,
      render: (months: string) => (
        <Tag color={months ? 'orange' : 'green'}>
          {months ? `Đã khóa: ${months}` : 'Chưa khóa'}
        </Tag>
      ),
      sorter: (a: Department, b: Department) => (a.lockedEntryMonths || '').localeCompare(b.lockedEntryMonths || ''),
    },
    { 
      title: 'Tạo bởi', 
      dataIndex: 'createdBy', 
      width: 140,
      sorter: (a: Department, b: Department) => (a.createdBy || '').localeCompare(b.createdBy || ''),
    },
    { 
      title: 'Cập nhật bởi', 
      dataIndex: 'updatedBy', 
      width: 160,
      sorter: (a: Department, b: Department) => (a.updatedBy || '').localeCompare(b.updatedBy || ''),
    },
    {
      title: 'Hành động', 
      width: 160,
      render: (_: any, record: Department) => {
        const isOwner = record.createdBy === currentUser
        const isAdmin = currentRole === 'admin'
        const canModify = isAdmin || isOwner
        return (
          <Space>
            <Button 
              size="small" 
              type="primary" 
              ghost 
              icon={<EditOutlined />} 
              onClick={() => onEdit(record)} 
              disabled={!canModify}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xóa khoa?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
              disabled={!canModify}
            >
              <Button size="small" danger ghost icon={<DeleteOutlined />} disabled={!canModify}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]), [pagination.page, pagination.pageSize, currentUser, currentRole])

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const onEdit = (rec: Department) => {
    setEditing(rec)
    form.setFieldsValue({ 
      ...rec,
      lockedEntryMonths: rec.lockedEntryMonths || ''
    })
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await departmentService.delete(id)
      message.success('Xóa thành công')
      loadDepartments({
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
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description,
        lockedEntryMonths: values.lockedEntryMonths || undefined,
      }
      
      if (editing) {
        await departmentService.update(editing.id, { ...payload, id: editing.id })
        message.success('Cập nhật thành công')
      } else {
        await departmentService.create(payload)
        message.success('Tạo mới thành công')
      }
      
      setOpen(false)
      loadDepartments({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchText || undefined
      })
    } catch (error) {
      message.error('Có lỗi xảy ra')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Thêm khoa</Button>
        <Input
          placeholder="Tìm kiếm khoa..."
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
              onChange: pagination.setPage,
              onShowSizeChange: (_, size) => pagination.setPageSize(size)
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Sửa khoa' : 'Thêm khoa'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã khoa" rules={[{ required: true }]}>
            <Input placeholder="VD: LAB, HEM, BIO" />
          </Form.Item>
          <Form.Item name="name" label="Tên khoa" rules={[{ required: true }]}>
            <Input placeholder="VD: Phòng xét nghiệm, Khoa huyết học" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả về khoa" />
          </Form.Item>
          <Form.Item name="lockedEntryMonths" label="Khóa tháng nhập liệu">
            <Input placeholder="VD: 2024-01,2024-02 (cách nhau bởi dấu phẩy)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DepartmentPage
