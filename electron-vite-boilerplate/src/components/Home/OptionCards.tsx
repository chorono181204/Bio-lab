import React from 'react'
import { Card, Col, Row } from 'antd'
import { FileTextOutlined, UnorderedListOutlined, ProfileOutlined, HddOutlined, TeamOutlined } from '@ant-design/icons'

export type Option = {
  key: string
  title: string
  icon: React.ReactNode
  color?: string
  onClick?: () => void
}

export type Stats = { 
  users: number; 
  devices: number; 
  analytes: number; 
  qcLots: number; 
  entriesToday: number;
  forms: number;
  lots: number;
  machines: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  violationsToday: number;
  violationsThisWeek: number;
  violationsThisMonth: number;
}

type Props = { onOpen?: (key: string) => void; stats?: Stats }

const OptionCards: React.FC<Props> = ({ onOpen, stats }) => {
  const options: Option[] = [
    { key: 'form', title: 'Cài đặt biểu mẫu', icon: <FileTextOutlined />, color: '#1976d2' },
    { key: 'analytes', title: 'Danh sách xét nghiệm', icon: <UnorderedListOutlined />, color: '#6a1b9a' },
    { key: 'lots', title: 'Quản lý lô', icon: <ProfileOutlined />, color: '#b7950b' },
    { key: 'devices', title: 'Quản lý máy', icon: <HddOutlined />, color: '#c62828' },
    { key: 'users', title: 'Quản lý người dùng', icon: <TeamOutlined />, color: '#1976d2' }
  ]

  return (
    <Row gutter={[16, 16]}>
      {options.map(op => (
        <Col key={op.key} xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card
            hoverable
            style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}
            bodyStyle={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => onOpen?.(op.key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, color: op.color }}>{op.icon}</span>
              <span style={{ fontWeight: 700 }}>{op.title}</span>
            </div>
            {stats && (
              <span style={{ fontWeight: 800, color: op.key === 'devices' ? '#00897b' : op.key === 'analytes' ? '#6a1b9a' : op.key === 'lots' ? '#b7950b' : '#1976d2' }}>
                {op.key === 'form' && stats.forms}
                {op.key === 'analytes' && stats.analytes}
                {op.key === 'lots' && stats.lots}
                {op.key === 'devices' && stats.machines}
                {op.key === 'users' && stats.users}
              </span>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default OptionCards


