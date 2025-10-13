import React, { useState, useEffect } from 'react'
import { Button, DatePicker, Form, Input, Select, Space, message, Modal } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { authService } from '../services/auth.service'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../utils/api'

type Profile = {
  name: string
  dob?: string
  password?: string
}


const ProfilePage: React.FC = () => {
  const [form] = Form.useForm<Profile>()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const { user, logout } = useAuth()

  // Load current user profile
  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      console.log('=== LOAD PROFILE ===')
      
      // Always call API to get fresh data
      const response = await authService.getCurrentUser()
      if (response.success) {
        console.log('API response:', response.data)
        
        form.setFieldsValue({
          name: response.data.fullName || response.data.username,
          dob: response.data.dob ? dayjs(response.data.dob) : undefined,
        })
        console.log('Profile loaded from API successfully')
      } else {
        console.error('API failed:', response)
        message.error('Không thể tải thông tin hồ sơ từ server')
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
      
      console.log('=== UPDATE PROFILE ===')
      console.log('Form values:', values)
      
      const updateData: any = {
        fullName: values.name,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
      }
      
      if (values.password) {
        updateData.password = values.password
      }
      
      console.log('Update data being sent:', updateData)
      console.log('DOB value:', values.dob)
      console.log('DOB formatted:', values.dob ? values.dob.format('YYYY-MM-DD') : 'undefined')
      
      // Call API to update profile using axios
      const response = await apiClient.put('/users/profile', updateData)
      
      if (response.success) {
        console.log('Profile updated successfully:', response.data)
        message.success('Cập nhật hồ sơ thành công')
        
        // Update localStorage with new data
        if (response.data) {
          localStorage.setItem('fullName', response.data.fullName || '')
          // Reload profile to get updated data
          loadProfile()
        }
      } else {
        console.error('Profile update failed:', response)
        message.error(response.error?.message || 'Lỗi khi cập nhật hồ sơ')
      }
      
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
      console.log('=== LOGOUT ===')
      logout()
      setLogoutModalVisible(false)
      message.success('Đăng xuất thành công')
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


