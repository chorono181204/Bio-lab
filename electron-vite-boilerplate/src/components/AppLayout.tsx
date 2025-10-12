import React, { ReactNode, useState } from 'react'
import { Layout, Menu, Dropdown, Button, Avatar } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { User } from '../services/auth.service'

type MenuItem = {
  key: string
  icon?: ReactNode
  label: ReactNode
  children?: MenuItem[]
  onClick?: () => void
}

type Props = {
  menuItems: MenuItem[]
  actions?: ReactNode
  children?: ReactNode
  onMenuClick?: (key: string) => void
  selectedKey?: string
  user?: User | null
  onLogout?: () => void
}

const { Header, Sider, Content } = Layout

export const AppLayout: React.FC<Props> = ({ menuItems, children, onMenuClick, selectedKey, user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false)
  
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => onMenuClick?.('profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: onLogout
    }
  ]
  
  return (
    <Layout hasSider style={{ minHeight: '100vh', background: '#fff', width: '100vw' }}>
      <Sider
        width={260}
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        style={{ background: '#fff' }}
      >
        <div style={{ padding: '14px 16px', textAlign: 'center' }}>
          <img 
            src="/logo.svg" 
            alt="Logo" 
            style={{ height: 32, width: 'auto', marginBottom: 8 }}
          />
          <div style={{ 
            color: '#1976d2', 
            fontWeight: 800, 
            letterSpacing: 0.4,
            fontSize: 12,
            lineHeight: 1.2,
            display: collapsed ? 'none' : 'block'
          }}>
            <div>BỆNH VIỆN ĐA KHOA SỐ 1</div>
            <div>TỈNH LÀO CAI</div>
            <div style={{
              color: '#ffc107',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'italic',
              marginTop: 4
            }}>More than a hospital</div>
          </div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : undefined}
          defaultOpenKeys={[menuItems[0]?.key as string]}
          items={menuItems as any}
          onClick={(e)=> onMenuClick?.(e.key)}
        />
      </Sider>
      <Layout style={{ minWidth: 0 }}>
        <Header style={{ background: '#fff', padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ 
              color: '#1976d2', 
              fontWeight: 800, 
              letterSpacing: 0.4,
              fontSize: 18,
              lineHeight: 1.2,
              textTransform: 'uppercase'
            }}>
              HỆ THỐNG QUẢN LÝ QC
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#666', fontSize: 14 }}>
                {user?.fullName || user?.username}
              </span>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Button type="text" style={{ padding: 0 }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                </Button>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content className="main-content" style={{ padding: 16, background: '#fff', position: 'relative' }}>
          <div style={{ background: '#fff', borderRadius: 8, minHeight: 360, padding: 16, border: '1px solid #f0f0f0' }}>
            {children}
          </div>
          <div style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: '#1976d2',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.3,
            zIndex: 1000,
            fontWeight: 'bold'
          }}>
            <div>Bs CKI. Vũ Thị Thuý Phương - 0349.648.326, Bs CKII Trịnh Thị Thu Hoài - BVĐK số 1 tỉnh Lào Cai</div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout