import React, { useEffect, useState } from 'react'
import { Skeleton, Card, Row, Col, Statistic, Typography } from 'antd'
import { Stats } from '../components/Home/OptionCards'
import OptionCards from '../components/Home/OptionCards'
import { useApi } from '../hooks'
import { statsService } from '../services'

const { Title } = Typography

const HomePage: React.FC = () => {
  const { data: statsData, loading, execute: loadStats } = useApi(statsService.getStats)
  const [stats, setStats] = useState<Stats>({ 
    users: 0, 
    devices: 0, 
    analytes: 0, 
    qcLots: 0, 
    entriesToday: 0,
    forms: 0,
    lots: 0,
    machines: 0,
    entriesThisWeek: 0,
    entriesThisMonth: 0,
    violationsToday: 0,
    violationsThisWeek: 0,
    violationsThisMonth: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (statsData) {
      console.log('=== STATS DATA RECEIVED ===')
      console.log('Raw statsData:', statsData)
      setStats(statsData)
    }
  }, [statsData])

  return (
    <div>
      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Nhập liệu hôm nay"
              value={stats.entriesToday}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Nhập liệu tuần này"
              value={stats.entriesThisWeek}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Nhập liệu tháng này"
              value={stats.entriesThisMonth}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Vi phạm hôm nay"
              value={stats.violationsToday}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Option Cards */}
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : <OptionCards stats={stats} />}
    </div>
  )
}

export default HomePage


