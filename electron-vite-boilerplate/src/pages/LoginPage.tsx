import React, { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { authService } from '../services/auth.service'

const LoginPage: React.FC<{ onSuccess: (username: string, password: string) => Promise<boolean> }> = ({ onSuccess }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  
  const onFinish = async () => {
    try {
      setLoading(true)
      const { username, password } = await form.validateFields()
      const success = await onSuccess(username, password)
      if (!success) {
        form.setFields([{ name: 'password', errors: ['Sai tài khoản hoặc mật khẩu'] }])
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('Có lỗi xảy ra khi đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 6px 20px rgba(25, 118, 210, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img 
            src="./logo.svg" 
            alt="Logo" 
            style={{ height: 48 }} 
            onError={(e) => {
              console.log('Login logo load error, using fallback');
              e.currentTarget.style.display = 'none';
              // Show fallback
              const fallback = document.createElement('div');
              fallback.style.cssText = `
                height: 48px; 
                width: 48px; 
                margin: 0 auto 8px auto;
                background: #1976d2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 20px;
              `;
              fallback.textContent = 'QC';
              e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
            }}
          />
          <div style={{ color: '#1976d2', fontWeight: 800, letterSpacing: 0.4, fontSize: 14, lineHeight: 1.2, marginTop: 8 }}>
            <div>BỆNH VIỆN ĐA KHOA SỐ 1</div>
            <div>TỈNH LÀO CAI</div>
            <div style={{ color: '#ffc107', fontSize: 12, fontWeight: 400, fontStyle: 'italic', marginTop: 4 }}>More than a hospital</div>
          </div>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin', serverUrl: (typeof localStorage !== 'undefined' && localStorage.getItem('serverUrl')) || 'http://localhost' }}>
          <Form.Item name="username" label="Tài khoản" rules={[{ required: true }]}> 
            <Input placeholder="admin" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
            <Input.Password placeholder="admin" />
          </Form.Item>
          <Form.Item name="serverUrl" label="URL máy chủ (QC Server)" tooltip="Ví dụ: http://192.168.102.100" rules={[{ required: true, message: 'Nhập URL máy chủ' }]}>
            <Input placeholder="http://localhost" onChange={(e)=>{
              const raw = e.target.value
              if (raw) localStorage.setItem('serverUrl', raw.trim().replace(/\/?$/, ''))
            }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>Đăng nhập</Button>
        </Form>
      </Card>
      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        fontSize: 11,
        color: '#1976d2',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 1.3,
        zIndex: 1000,
        fontWeight: 'bold'
      }}>
        <div>CKI Vũ Thị Thuý Phương, Bs CKII Trịnh Thị Thu Hoài - BVĐK số 1 tỉnh Lào Cai</div>
      </div>
    </div>
  )
}

export default LoginPage


