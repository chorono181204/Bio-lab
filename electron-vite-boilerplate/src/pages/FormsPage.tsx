import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, Modal, Space, Table, Popconfirm, DatePicker, Input as AntInput, Skeleton, message, Select } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { formService, Form as FormType } from '../services'
import { usePagination } from '../hooks'
import DepartmentSelect from '../components/DepartmentSelect'

const FormsPage: React.FC = () => {
  const [data, setData] = useState<FormType[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FormType | null>(null)
  const [form] = Form.useForm<FormType>()
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setPage, setPageSize, setTotal } = usePagination()
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await formService.list({ 
        search: searchText,
        page,
        pageSize
      })
      setData(response.data.items)
      setTotal(response.data.total)
    } catch (error) {
      message.error('Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchText, page, pageSize])

  const filteredData = useMemo(() => {
    return data
  }, [data])

  const columns = useMemo(() => ([
    { 
      title: 'Tên biểu mẫu', 
      dataIndex: 'name',
      sorter: (a: FormType, b: FormType) => a.name.localeCompare(b.name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <AntInput
            placeholder="Tìm kiếm tên biểu mẫu"
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
      onFilter: (value: string, record: FormType) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: 'Mã biểu mẫu', 
      dataIndex: 'code', 
      width: 140,
      sorter: (a: FormType, b: FormType) => a.code.localeCompare(b.code),
    },
    { 
      title: 'Lần ban hành', 
      dataIndex: 'issueRound', 
      width: 140,
      sorter: (a: FormType, b: FormType) => (a.issueRound || '').localeCompare(b.issueRound || ''),
    },
    { 
      title: 'Ngày ban hành', 
      dataIndex: 'issueDate', 
      width: 160,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a: FormType, b: FormType) => (a.issueDate || '').toString().localeCompare((b.issueDate || '').toString()),
    },
    { 
      title: 'Tạo bởi', 
      dataIndex: 'createdBy', 
      width: 140,
      sorter: (a: FormType, b: FormType) => (a.createdBy || '').localeCompare(b.createdBy || ''),
    },
    { 
      title: 'Cập nhật bởi', 
      dataIndex: 'updatedBy', 
      width: 160,
      sorter: (a: FormType, b: FormType) => (a.updatedBy || '').localeCompare(b.updatedBy || ''),
    },
    {
      title: 'Hành động', width: 160,
      render: (_: any, record: FormType) => {
        const isOwner = record.createdBy === currentUser
        const isAdmin = currentRole === 'admin'
        const canModify = isAdmin || isOwner
        return (
          <Space>
            <Button onClick={() => onEdit(record)} size="small" type="primary" ghost icon={<EditOutlined />} disabled={!canModify}>Sửa</Button>
            <Popconfirm
              title="Xóa biểu mẫu?"
              description={`Bạn chắc chắn muốn xóa "${record.name}"?`}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
              disabled={!canModify}
            >
              <Button danger size="small" ghost icon={<DeleteOutlined />} disabled={!canModify}>Xóa</Button>
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

  const onEdit = (rec: FormType) => {
    setEditing(rec)
    form.setFieldsValue({
      ...rec,
      issueDate: rec.issueDate ? dayjs(rec.issueDate) : undefined,
    } as any)
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await formService.delete(id)
      setData(prev => prev.filter(x => x.id !== id))
      message.success('Xóa biểu mẫu thành công')
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa')
    }
  }

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      const formatted = {
        ...values,
        issueDate: values.issueDate ? (values.issueDate as any).format('YYYY-MM-DD') : undefined,
      }
      
      if (editing) {
        const response = await formService.update(editing.id, formatted)
        setData(prev => prev.map(x => x.id === editing.id ? response.data : x))
        message.success('Cập nhật biểu mẫu thành công')
      } else {
        const response = await formService.create(formatted)
        setData(prev => [response.data, ...prev])
        message.success('Tạo biểu mẫu thành công')
      }
      setOpen(false)
    } catch (error) {
      message.error('Có lỗi xảy ra')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Button type="primary" onClick={onCreate}>Thêm biểu mẫu</Button>
        <AntInput
          placeholder="Tìm kiếm biểu mẫu..."
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
        pagination={{ 
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            if (newPageSize) setPageSize(newPageSize)
          }
        }}
        scroll={{ x: 800 }}
      />}

      <Modal
        open={open}
        title={editing ? 'Sửa biểu mẫu' : 'Thêm biểu mẫu'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên biểu mẫu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Mã biểu mẫu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="issueRound" label="Lần ban hành">
            <Input />
          </Form.Item>
          <Form.Item name="issueDate" label="Ngày ban hành">
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder="yyyy-mm-dd" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
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

export default FormsPage


