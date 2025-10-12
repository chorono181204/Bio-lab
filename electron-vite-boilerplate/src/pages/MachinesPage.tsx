import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Skeleton, message, Switch } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApi, usePagination } from '../hooks'
import { machineService, Machine } from '../services'
import DepartmentSelect from '../components/DepartmentSelect'
import LotMultiSelect from '../components/LotMultiSelect'

const MachinesPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Machine | null>(null)
  const [form] = Form.useForm<Machine>()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // API hooks
  const { data: apiData, loading, execute: loadMachines } = useApi(machineService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  const data = apiData && 'items' in apiData ? apiData.items : (apiData as Machine[] || [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load data on mount and when filters change
  useEffect(() => {
    loadMachines({
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

  const columns = useMemo(() => ([
    { title: 'STT', width: 80, render: (_: any, __: Machine, index: number) => index + 1 },
    { 
      title: 'Mã máy', 
      dataIndex: 'deviceCode', 
      width: 140,
      sorter: (a: Machine, b: Machine) => a.deviceCode.localeCompare(b.deviceCode),
    },
    { 
      title: 'Model', 
      dataIndex: 'model', 
      width: 140,
      sorter: (a: Machine, b: Machine) => (a.model || '').localeCompare(b.model || ''),
    },
    { 
      title: 'Serial', 
      dataIndex: 'serial', 
      width: 160,
      sorter: (a: Machine, b: Machine) => (a.serial || '').localeCompare(b.serial || ''),
    },
    { 
      title: 'Tên máy', 
      dataIndex: 'name',
      sorter: (a: Machine, b: Machine) => a.name.localeCompare(b.name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm kiếm tên máy"
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
      onFilter: (value: string, record: Machine) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      width: 140, 
      render: (v: any) => (v === 1) ? <Tag color="green">Đang sử dụng</Tag> : <Tag>Không sử dụng</Tag>,
      sorter: (a: Machine, b: Machine) => ((a.status === 1) ? 1 : 0) - ((b.status === 1) ? 1 : 0),
    },
    { 
      title: 'Lô xét nghiệm', 
      dataIndex: 'lots',
      width: 200,
      render: (lots: Array<{ id: string; code: string; lotName?: string; expiryDate?: string | Date }>) => {
        if (!lots || lots.length === 0) return '-'
        return (
          <div>
            {lots.map((lot, index) => {
              const today = dayjs()
              const expiryDate = lot.expiryDate ? dayjs(lot.expiryDate) : null
              const isExpired = expiryDate && expiryDate.isBefore(today, 'day')
              const isExpiringSoon = expiryDate && expiryDate.isBefore(today.add(7, 'day'), 'day') && !isExpired
              
              let tagColor = 'green'
              if (isExpired) tagColor = 'red'
              else if (isExpiringSoon) tagColor = 'orange'
              
              return (
                <Tag key={lot.id} color={tagColor} style={{ marginBottom: 2 }}>
                  {lot.code} - {lot.lotName || 'N/A'}
                  {isExpired && ' (QUÁ HẠN)'}
                  {isExpiringSoon && ' (SẮP HẾT HẠN)'}
                </Tag>
              )
            })}
          </div>
        )
      }
    },
    { title: 'Ghi chú', dataIndex: 'note' },
    { 
      title: 'Tạo bởi', 
      dataIndex: 'createdBy', 
      width: 140,
      sorter: (a: Machine, b: Machine) => (a.createdBy || '').localeCompare(b.createdBy || ''),
    },
    { 
      title: 'Cập nhật bởi', 
      dataIndex: 'updatedBy', 
      width: 160,
      sorter: (a: Machine, b: Machine) => (a.updatedBy || '').localeCompare(b.updatedBy || ''),
    },
    {
      title: 'Hành động', width: 160,
      render: (_: any, record: Machine) => {
        const isOwner = record.createdBy === currentUser
        const isAdmin = currentRole === 'admin'
        const canModify = isAdmin || isOwner
        return (
          <Space>
            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)} disabled={!canModify}>Sửa</Button>
            <Popconfirm
              title="Xóa máy?"
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
    form.setFieldsValue({ status: true } as any)
    setOpen(true)
  }

  const onEdit = (rec: Machine) => {
    setEditing(rec)
    form.setFieldsValue({
      deviceCode: rec.deviceCode,
      model: rec.model,
      serial: rec.serial,
      name: rec.name,
      status: rec.status === 1,
      note: rec.note,
      departmentId: rec.departmentId,
      lotIds: rec.lots?.map(lot => lot.id) || [], // Thêm lotIds
    } as any)
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await machineService.delete(id)
      message.success('Xóa thành công')
      loadMachines({
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
        deviceCode: values.deviceCode,
        model: values.model,
        serial: values.serial,
        name: values.name,
        status: values.status ? 1 : 0,
        note: values.note,
        departmentId: values.departmentId,
        lotIds: values.lotIds || [], // Thêm lotIds
      }
      
      if (editing) {
        await machineService.update(editing.id, { ...payload, id: editing.id })
        message.success('Cập nhật thành công')
      } else {
        await machineService.create(payload)
        message.success('Tạo mới thành công')
      }
      
      setOpen(false)
      loadMachines({
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
        <Button type="primary" onClick={onCreate}>Thêm máy</Button>
        <Input
          placeholder="Tìm kiếm máy..."
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
        title={editing ? 'Sửa máy' : 'Thêm máy'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="deviceCode" label="Mã máy" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="model" label="Model" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="serial" label="Serial" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Tên máy" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <DepartmentSelect 
            currentRole={currentRole}
            required={false}
          />
          <Form.Item name="lotIds" label="Lô xét nghiệm">
            <LotMultiSelect placeholder="Chọn lô xét nghiệm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MachinesPage


