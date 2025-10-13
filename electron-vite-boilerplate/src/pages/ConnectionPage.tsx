import React, { useState } from 'react'
import { Card, Form, Input, Button, Switch, Divider, Space, message, Row, Col, Typography, Alert } from 'antd'
import { 
  DatabaseOutlined, 
  ApiOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons'

const { Title, Text } = Typography

interface ConnectionSettings {
  serverUrl?: string
  hisEnabled: boolean
  hisApiUrl: string
  hisApiKey: string
  hisUsername: string
  hisPassword: string
  syncInterval: number
  autoSync: boolean
}

const ConnectionPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  const initialValues: ConnectionSettings = {
    serverUrl: (typeof localStorage !== 'undefined' && localStorage.getItem('serverUrl')) || 'http://localhost',
    hisEnabled: false,
    hisApiUrl: 'http://localhost:8080/api',
    hisApiKey: '',
    hisUsername: '',
    hisPassword: '',
    syncInterval: 30,
    autoSync: false
  }

  const onFinish = async (values: ConnectionSettings) => {
    setLoading(true)
    try {
      // TODO: Implement actual connection logic
      console.log('Connection settings:', values)
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Save dynamic server URL (host) for API baseURL, keep fixed port 4000
      try {
        const raw = (values.serverUrl || '').trim()
        if (raw) localStorage.setItem('serverUrl', raw.replace(/\/?$/, ''))
      } catch {}

      if (values.hisEnabled && values.hisApiUrl && values.hisApiKey) {
        // Save dynamic server URL (host) for API baseURL, keep fixed port 4000
        try {
          const url = (values.hisApiUrl || '').trim().replace(/\/?$/, '')
          if (url) {
            localStorage.setItem('serverUrl', url)
          }
        } catch {}
        setConnectionStatus('connected')
        message.success('Kết nối HIS thành công!')
      } else {
        setConnectionStatus('error')
        message.error('Vui lòng điền đầy đủ thông tin kết nối!')
      }
    } catch (error) {
      setConnectionStatus('error')
      message.error('Kết nối thất bại!')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    const values = form.getFieldsValue()
    setConnectionStatus('connecting')
    setLoading(true)
    
    try {
      // TODO: Implement actual connection test
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (values.hisApiUrl && values.hisApiKey) {
        setConnectionStatus('connected')
        message.success('Kết nối thành công!')
      } else {
        setConnectionStatus('error')
        message.error('Thông tin kết nối không hợp lệ!')
      }
    } catch (error) {
      setConnectionStatus('error')
      message.error('Không thể kết nối đến HIS!')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'connecting':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return <ExclamationCircleOutlined style={{ color: '#d9d9d9' }} />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Đã kết nối'
      case 'connecting':
        return 'Đang kết nối...'
      case 'error':
        return 'Lỗi kết nối'
      default:
        return 'Chưa kết nối'
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24, color: '#1976d2' }}>
        <ApiOutlined style={{ marginRight: 8 }} />
        Kết nối HIS
      </Title>

      <Row gutter={[24, 24]}>
        {/* Cài đặt kết nối */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <SettingOutlined />
                <span>Cài đặt kết nối</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={initialValues}
              onFinish={onFinish}
              onValuesChange={(_, allValues: any) => {
                try {
                  const raw = String(allValues?.serverUrl || '')
                  if (raw) {
                    localStorage.setItem('serverUrl', raw.trim().replace(/\/?$/, ''))
                  }
                } catch {}
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="hisEnabled"
                    valuePropName="checked"
                    label="Bật kết nối HIS"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="serverUrl"
                    label="URL máy chủ (QC Server)"
                    tooltip="Ví dụ: http://localhost hoặc http://192.168.1.10"
                    rules={[{ required: true, message: 'Vui lòng nhập URL máy chủ!' }]}
                  >
                    <Input placeholder="http://localhost" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="hisApiUrl"
                    label="URL API HIS"
                    rules={[{ required: true, message: 'Vui lòng nhập URL API!' }]}
                  >
                    <Input placeholder="http://localhost:8080/api" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="hisApiKey"
                    label="API Key"
                    rules={[{ required: true, message: 'Vui lòng nhập API Key!' }]}
                  >
                    <Input.Password placeholder="Nhập API Key" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="hisUsername"
                    label="Tên đăng nhập"
                  >
                    <Input placeholder="Username HIS" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="hisPassword"
                    label="Mật khẩu"
                  >
                    <Input.Password placeholder="Password HIS" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="syncInterval"
                    label="Tần suất đồng bộ (phút)"
                  >
                    <Input type="number" min={1} max={1440} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="autoSync"
                    valuePropName="checked"
                    label="Tự động đồng bộ"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: 24 }}>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<DatabaseOutlined />}
                  >
                    Lưu cài đặt
                  </Button>
                  <Button 
                    onClick={testConnection}
                    loading={loading}
                    icon={<ApiOutlined />}
                  >
                    Test kết nối
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Trạng thái kết nối */}
        <Col xs={24} lg={8}>
          <Card title="Trạng thái kết nối">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {getStatusIcon()}
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {getStatusText()}
                </Text>
              </div>

              <Alert
                message="Thông tin kết nối"
                description={
                  <div>
                    <div>• URL máy chủ: {form.getFieldValue('serverUrl') || localStorage.getItem('serverUrl') || 'http://localhost'}</div>
                    <div>• URL: {form.getFieldValue('hisApiUrl') || 'Chưa cấu hình'}</div>
                    <div>• API Key: {form.getFieldValue('hisApiKey') ? '***' : 'Chưa cấu hình'}</div>
                    <div>• Tự động đồng bộ: {form.getFieldValue('autoSync') ? 'Có' : 'Không'}</div>
                  </div>
                }
                type={connectionStatus === 'connected' ? 'success' : 'info'}
                showIcon
              />

              <Button 
                type="default" 
                block 
                onClick={testConnection}
                loading={loading}
                disabled={connectionStatus === 'connecting'}
              >
                Kiểm tra kết nối
              </Button>
            </Space>
          </Card>

          {/* Hướng dẫn */}
          <Card title="Hướng dẫn" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                <strong>1.</strong> Nhập URL API của hệ thống HIS
              </Text>
              <Text>
                <strong>2.</strong> Cung cấp API Key để xác thực
              </Text>
              <Text>
                <strong>3.</strong> Cấu hình tần suất đồng bộ dữ liệu
              </Text>
              <Text>
                <strong>4.</strong> Bật tự động đồng bộ nếu cần
              </Text>
              <Text>
                <strong>5.</strong> Test kết nối trước khi lưu
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ConnectionPage

