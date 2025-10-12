import React, { useState, useEffect } from 'react'
import { Button, DatePicker, Form, Input, Select, Space, message, Modal } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

type Profile = {
  name: string
  department?: string
  dob?: string
  password?: string
}

const departmentOptions = [
  { value: 'Huyết học', label: 'Huyết học' },
  { value: 'Hóa sinh', label: 'Hóa sinh' },
  { value: 'Đông máu', label: 'Đông máu' },
  { value: 'Vi sinh', label: 'Vi sinh' },
  { value: 'Miễn dịch', label: 'Miễn dịch' },
  { value: 'Tế bào học', label: 'Tế bào học' },
]

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm<Profile>()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  
  const currentUser = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || 'admin'

  // Load current user profile
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const profile = await (window as any).iqc?.profile?.getCurrentUser?.(currentUser)
      if (profile) {
        form.setFieldsValue({
          name: profile.name,
          department: profile.department,
          dob: profile.dob ? dayjs(profile.dob) : undefined,
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      message.error('Không thể tải thông tin hồ sơ')
    } finally {
      setProfileLoading(false)
    }
  }

  const onSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      const updateData: any = {
        name: values.name,
        department: values.department,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
      }
      
      if (values.password) {
        updateData.password = values.password
      }
      
      await (window as any).iqc?.profile?.update?.(currentUser, updateData)
      message.success('Cập nhật hồ sơ thành công')
      
      // Clear password field
      form.setFieldsValue({ password: undefined })
    } catch (error) {
      console.error('Error updating profile:', error)
      message.error('Lỗi khi cập nhật hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await (window as any).iqc?.auth?.logout?.()
      // Clear stored session info
      localStorage.removeItem('authed_user')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      localStorage.removeItem('department')
      localStorage.removeItem('fullName')
      localStorage.removeItem('position')
      message.success('Đã đăng xuất thành công')
      // Reload page to go back to login
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      message.error('Lỗi khi đăng xuất')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Thông tin cá nhân</h2>
        <Button 
          type="primary" 
          danger 
          icon={<LogoutOutlined />}
          onClick={() => setLogoutModalVisible(true)}
        >
          Đăng xuất
        </Button>
      </div>

      <Form form={form} layout="vertical" loading={profileLoading}>
        <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}> 
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>
        <Form.Item name="department" label="Khoa"> 
          <Select options={departmentOptions} placeholder="Chọn khoa" allowClear />
        </Form.Item>
        <Form.Item name="dob" label="Ngày sinh"> 
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Chọn ngày sinh" />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu mới" rules={[{ min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }]}> 
          <Input.Password autoComplete="new-password" placeholder="Nhập mật khẩu mới (để trống nếu không đổi)" />
        </Form.Item>
        <Space>
          <Button type="primary" loading={loading} onClick={onSave}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button onClick={() => form.resetFields()}>
            Đặt lại
          </Button>
        </Space>
      </Form>

      <Modal
        title="Xác nhận đăng xuất"
        open={logoutModalVisible}
        onOk={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
        okText="Đăng xuất"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
      </Modal>
    </div>
  )
}

export default ProfilePage


