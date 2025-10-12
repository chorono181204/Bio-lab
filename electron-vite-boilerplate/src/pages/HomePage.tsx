import React, { useEffect, useState } from 'react'
import { Skeleton } from 'antd'
import { Stats } from '../components/Home/StatsTiles'
import OptionCards from '../components/Home/OptionCards'
import { useApi } from '../hooks'
import { lookupService } from '../services'

const HomePage: React.FC = () => {
  const { data: apiData, loading, execute: loadStats } = useApi(lookupService.getInitData)
  const [stats, setStats] = useState<Stats>({ users: 0, devices: 0, analytes: 0, qcLots: 0, entriesToday: 0 })

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (apiData) {
      // Calculate stats from API data
      const statsData = {
        users: 0, // TODO: Get from user service
        devices: apiData.machines?.length || 0,
        analytes: apiData.analytes?.length || 0,
        qcLots: apiData.lots?.length || 0,
        entriesToday: 0 // TODO: Calculate from entries data
      }
      setStats(statsData)
    }
  }, [apiData])

  return (
    <div>
      {/* Bỏ hàng thống kê trên theo yêu cầu, hiển thị số ngay trong option cards */}
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : <OptionCards stats={stats} />}
    </div>
  )
}

export default HomePage


