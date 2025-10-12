import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Skeleton, message } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useApi, usePagination } from '../hooks'
import { userService, User, departmentService, Department } from '../services'
import DepartmentSelect from '../components/DepartmentSelect'

type Role = 'Quản trị' | 'Quản lý' | 'Người dùng'

const roleOptions = [
  { value: 'admin', label: 'Quản trị' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'user', label: 'Người dùng' },
]

// Department options will be loaded from API

const roleMapDbToUi: Record<string, Role> = {
  admin: 'Quản trị',
  manager: 'Quản lý',
  user: 'Người dùng',
}

const UsersPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'
  const currentRole = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || 'admin'

  // API hooks
  const { data: apiData, loading, execute: loadUsers } = useApi(userService.list)
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  const data = (apiData && 'items' in apiData ? apiData.items : []) as User[]

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load data on mount and when filters change
  useEffect(() => {
    loadUsers({
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
      render: (_: any, __: User, index: number) => (pagination.page - 1) * pagination.pageSize + index + 1 
    },
    { 
      title: 'Tên đăng nhập', 
      dataIndex: 'username', 
      width: 150,
      sorter: (a: User, b: User) => a.username.localeCompare(b.username),
    },
    { 
      title: 'Họ tên', 
      dataIndex: 'fullName', 
      width: 200,
      sorter: (a: User, b: User) => (a.fullName || '').localeCompare(b.fullName || ''),
    },
    { 
      title: 'Chức vụ', 
      dataIndex: 'position', 
      width: 150,
      sorter: (a: User, b: User) => ((a as any).position || '').localeCompare((b as any).position || ''),
    },
    { 
      title: 'Khoa phòng', 
      dataIndex: 'department', 
      width: 150,
      render: (dept: any) => dept?.name || '',
      sorter: (a: User, b: User) => ((a as any).department?.name || '').localeCompare((b as any).department?.name || ''),
    },
    { 
      title: 'Vai trò', 
      dataIndex: 'role', 
      width: 120,
      render: (role: string) => {
        const roleUi = roleMapDbToUi[role] || 'Người dùng'
        const color = role === 'admin' ? 'red' : role === 'manager' ? 'blue' : 'green'
        return <Tag color={color}>{roleUi}</Tag>
      },
      sorter: (a: User, b: User) => (a.role || '').localeCompare(b.role || ''),
    },
    { 
      title: 'Tạo bởi', 
      dataIndex: 'createdBy', 
      width: 140,
      sorter: (a: User, b: User) => ((a as any).createdBy || '').localeCompare((b as any).createdBy || ''),
    },
    { 
      title: 'Cập nhật bởi', 
      dataIndex: 'updatedBy', 
      width: 160,
      sorter: (a: User, b: User) => ((a as any).updatedBy || '').localeCompare((b as any).updatedBy || ''),
    },
    {
      title: 'Hành động', 
      width: 160,
      render: (_: any, record: User) => {
        const isOwner = (record as any).createdBy === currentUser
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
              title="Xóa người dùng?"
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

  const onEdit = (rec: User) => {
    setEditing(rec)
    form.setFieldsValue({ 
      ...rec, 
      password: undefined,
      role: rec.role || 'user',
      departmentId: rec.departmentId || undefined
    })
    setOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await userService.delete(id)
      message.success('Xóa thành công')
      loadUsers({
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
      const payload: any = {
        username: values.username,
        fullName: values.fullName,
        role: values.role || 'user',
        position: values.position,
        departmentId: values.departmentId,
      }
      
      // Only include password if it's provided and not empty
      if (values.password && values.password.trim()) {
        payload.password = values.password
      }
      
      if (editing) {
        await userService.update(editing.id, { ...payload, id: editing.id })
        message.success('Cập nhật thành công')
      } else {
        if (!values.password) {
          message.error('Vui lòng nhập mật khẩu')
          return
        }
        await userService.create({ ...payload, password: values.password })
        message.success('Tạo mới thành công')
      }
      
      setOpen(false)
      loadUsers({
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
        <Button type="primary" onClick={onCreate}>Thêm người dùng</Button>
        <Input
          placeholder="Tìm kiếm người dùng..."
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
        title={editing ? 'Sửa người dùng' : 'Thêm người dùng'}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item 
            name="password" 
            label="Mật khẩu" 
            rules={editing ? [] : [{ required: true }]}
            extra={editing ? "Để trống nếu không muốn thay đổi mật khẩu" : ""}
          >
            <Input.Password placeholder={editing ? "Mật khẩu mới (tùy chọn)" : "Nhập mật khẩu"} />
          </Form.Item>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Chức vụ">
            <Input />
          </Form.Item>
          <DepartmentSelect 
            currentRole={currentRole}
            required={false}
          />
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select options={roleOptions} placeholder="Chọn vai trò" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UsersPage