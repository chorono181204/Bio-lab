import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, DatePicker, Skeleton, message, Alert } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApi, usePagination } from '../hooks'
import { lotService, Lot } from '../services'
import DepartmentSelect from '../components/DepartmentSelect'
import MachineMultiSelect from '../components/MachineMultiSelect'

const LotsPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lot | null>(null)
  const [form] = Form.useForm<Lot>()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // CSS styles for row highlighting
  const rowStyles = `
    .expired-row {
      background-color: #fff2f0 !important;
      border-left: 4px solid #ff4d4f !important;
    }
    .expired-row:hover {
      background-color: #ffe7e6 !important;
    }
    .expiring-soon-row {
      background-color: #fffbe6 !important;
      border-left: 4px solid #faad14 !important;
    }
    .expiring-soon-row:hover {
      background-color: #fff7e6 !important;
    }
  `

  // API hooks
  const { data: apiData, loading, execute: loadLots } = useApi(lotService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  const data = apiData && 'items' in apiData ? apiData.items : (apiData as Lot[] || [])

  // Calculate expired and expiring soon lots
  const { expiredCount, expiringSoonCount } = useMemo(() => {
    const today = dayjs()
    let expired = 0
    let expiringSoon = 0
    
    data.forEach(lot => {
      if (!lot.expiryDate) return
      const expiryDate = dayjs(lot.expiryDate)
      if (expiryDate.isBefore(today, 'day')) {
        expired++
      } else if (expiryDate.isBefore(today.add(7, 'day'), 'day')) {
        expiringSoon++
      }
    })
    
    return { expiredCount: expired, expiringSoonCount: expiringSoon }
  }, [data])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load data on mount and when filters change
  useEffect(() => {
    loadLots({
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
    { title: 'STT', width: 80, render: (_: any, __: Lot, index: number) => index + 1 },
    { 
      title: 'Mã', 
      dataIndex: 'code', 
      width: 120,
      sorter: (a: Lot, b: Lot) => a.code.localeCompare(b.code),
    },
    { 
      title: 'Lô XN', 
      dataIndex: 'lotName',
      sorter: (a: Lot, b: Lot) => (a.lotName || '').localeCompare(b.lotName || ''),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm kiếm lô XN"
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
      onFilter: (value: string, record: Lot) =>
        (record.lotName || '').toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      width: 140, 
      render: (v: any) => (v === 1) ? <Tag color="green">Đang sử dụng</Tag> : <Tag>Không sử dụng</Tag>,
      sorter: (a: Lot, b: Lot) => ((a.status === 1) ? 1 : 0) - ((b.status === 1) ? 1 : 0),
    },
    { 
      title: 'Ngày nhập lô', 
      dataIndex: 'receivedDate', 
      width: 150,
      render: (v: any) => v ? dayjs(v).format('YYYY-MM-DD') : '',
      sorter: (a: Lot, b: Lot) => {
        const dateA = a.receivedDate ? dayjs(a.receivedDate).valueOf() : 0
        const dateB = b.receivedDate ? dayjs(b.receivedDate).valueOf() : 0
        return dateA - dateB
      },
    },
    { 
      title: 'Hạn sử dụng', 
      dataIndex: 'expiryDate', 
      width: 150,
      render: (v: any, record: Lot) => {
        if (!v) return ''
        const expiryDate = dayjs(v)
        const today = dayjs()
        const isExpired = expiryDate.isBefore(today, 'day')
        const isExpiringSoon = expiryDate.isBefore(today.add(7, 'day'), 'day') && !isExpired
        
        return (
          <span style={{
            color: isExpired ? '#ff4d4f' : isExpiringSoon ? '#faad14' : '#000',
            fontWeight: isExpired || isExpiringSoon ? 'bold' : 'normal',
            backgroundColor: isExpired ? '#fff2f0' : isExpiringSoon ? '#fffbe6' : 'transparent',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            {expiryDate.format('YYYY-MM-DD')}
            {isExpired && ' (QUÁ HẠN)'}
            {isExpiringSoon && ' (SẮP HẾT HẠN)'}
          </span>
        )
      },
      sorter: (a: Lot, b: Lot) => {
        const dateA = a.expiryDate ? dayjs(a.expiryDate).valueOf() : 0
        const dateB = b.expiryDate ? dayjs(b.expiryDate).valueOf() : 0
        return dateA - dateB
      },
    },
    { 
      title: 'Máy xét nghiệm', 
      dataIndex: 'machines',
      width: 200,
      render: (machines: Array<{ id: string; deviceCode: string; name: string }>) => {
        if (!machines || machines.length === 0) return '-'
        return (
          <div>
            {machines.map((machine, index) => (
              <Tag key={machine.id} color="blue" style={{ marginBottom: 2 }}>
                {machine.deviceCode} - {machine.name}
              </Tag>
            ))}
          </div>
        )
      }
    },
    { title: 'Ghi chú', dataIndex: 'note' },
    { 
      title: 'Tạo bởi', 
      dataIndex: 'createdBy', 
      width: 140,
      sorter: (a: Lot, b: Lot) => (a.createdBy || '').localeCompare(b.createdBy || ''),
    },
    { 
      title: 'Cập nhật bởi', 
      dataIndex: 'updatedBy', 
      width: 160,
      sorter: (a: Lot, b: Lot) => (a.updatedBy || '').localeCompare(b.updatedBy || ''),
    },
    {
      title: 'Hành động', width: 160,
      render: (_: any, record: Lot) => {
        const canModify = true
        return (
          <Space>
            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)} disabled={!canModify}>Sửa</Button>
            <Popconfirm
              title="Xóa lô?"
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

  const onEdit = (rec: Lot) => {
    setEditing(rec)
    form.setFieldsValue({
      lotName: rec.lotName,
      code: rec.code,
      status: rec.status === 1,
      receivedDate: rec.receivedDate ? dayjs(rec.receivedDate) : undefined,
      expiryDate: rec.expiryDate ? dayjs(rec.expiryDate) : undefined,
      note: rec.note,
      departmentId: rec.departmentId,
      machineIds: rec.machines?.map(machine => machine.id) || [], // Thêm machineIds
    } as any)
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await lotService.delete(id)
      message.success('Xóa thành công')
      loadLots({
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
      const values = await form.validateFields() as any
      const payload = {
        lotName: values.lotName,
        code: values.code,
        status: values.status ? 1 : 0,
        receivedDate: values.receivedDate ? values.receivedDate.toDate() : undefined,
        expiryDate: values.expiryDate ? values.expiryDate.toDate() : undefined,
        note: values.note,
        departmentId: values.departmentId,
        machineIds: values.machineIds || [], // Thêm machineIds
      }
      
      if (editing) {
        await lotService.update(editing.id, { ...payload, id: editing.id })
        message.success('Cập nhật thành công')
      } else {
        await lotService.create(payload)
        message.success('Tạo mới thành công')
      }
      
      setOpen(false)
      loadLots({
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
      <style>{rowStyles}</style>
      
      {/* Warning alerts */}
      {expiredCount > 0 && (
        <Alert
          message={`Cảnh báo: Có ${expiredCount} lô đã quá hạn sử dụng!`}
          type="error"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {expiringSoonCount > 0 && (
        <Alert
          message={`Cảnh báo: Có ${expiringSoonCount} lô sắp hết hạn sử dụng (trong 7 ngày tới)!`}
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Button type="primary" onClick={onCreate}>Thêm lô</Button>
        <Input
          placeholder="Tìm kiếm lô QC..."
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
            rowClassName={(record: Lot) => {
              if (!record.expiryDate) return ''
              const expiryDate = dayjs(record.expiryDate)
              const today = dayjs()
              const isExpired = expiryDate.isBefore(today, 'day')
              const isExpiringSoon = expiryDate.isBefore(today.add(7, 'day'), 'day') && !isExpired
              
              if (isExpired) return 'expired-row'
              if (isExpiringSoon) return 'expiring-soon-row'
              return ''
            }}
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
        title={editing ? 'Sửa lô' : 'Thêm lô'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="lotName" label="Lô XN" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="receivedDate" label="Ngày nhập lô">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="expiryDate" label="Hạn sử dụng" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <DepartmentSelect 
            currentRole={currentRole}
            required={false}
          />
          <Form.Item name="machineIds" label="Máy xét nghiệm">
            <MachineMultiSelect placeholder="Chọn máy xét nghiệm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default LotsPage





