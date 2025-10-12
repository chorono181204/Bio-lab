import React from 'react'
import { Card, Col, Row, Skeleton, Statistic } from 'antd'

export type Stats = {
  users: number
  devices: number
  analytes: number
  qcLots: number
  entriesToday: number
}

type Props = {
  loading: boolean
  stats: Stats
}

const StatsTiles: React.FC<Props> = ({ loading, stats }) => {
  const tiles = [
    { title: 'Người dùng', value: stats.users, color: '#1976d2' },
    { title: 'Thiết bị', value: stats.devices, color: '#00897b' },
    { title: 'Xét nghiệm (analyte)', value: stats.analytes, color: '#6a1b9a' },
    { title: 'Lô QC', value: stats.qcLots, color: '#b7950b' },
    { title: 'Bản ghi hôm nay', value: stats.entriesToday, color: '#c62828' }
  ]

  return (
    <Row gutter={[16, 16]}>
      {tiles.map((t) => (
        <Col key={t.title} xs={12} sm={8} md={6} lg={4}>
          <Card style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic title={<span style={{ color: '#666' }}>{t.title}</span>} value={t.value} valueStyle={{ color: t.color, fontWeight: 800 }} />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default StatsTiles


