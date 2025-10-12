import 'antd/dist/reset.css'
import './style.css'
import { ConfigProvider, App as AntApp } from 'antd'

import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BarChartOutlined,
  LineChartOutlined,
  DeploymentUnitOutlined,
  HomeOutlined,
  UserOutlined,
  ControlOutlined
} from '@ant-design/icons'
import viVN from 'antd/locale/vi_VN'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import FormsPage from './pages/FormsPage'
import AnalytesPage from './pages/AnalytesPage'
import LotsPage from './pages/LotsPage'
import MachinesPage from './pages/MachinesPage'
import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'
import LimitsPage from './pages/LimitsPage'
import EntryPage from './pages/EntryPage'
import SigmaPage from './pages/SigmaPage'
import LJPage from './pages/LJPage'
import WestgardPage from './pages/WestgardPage'
import QcSetupPage from './pages/QcSetupPage'
import DepartmentPage from './pages/DepartmentPage'

const root = document.querySelector<HTMLDivElement>('#app')!
root.innerHTML = `
  <div id="root"></div>
`

const mount = document.getElementById('root')!

function render() {
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />, label: 'Trang chủ',
      children: [
        { key: 'home', label: 'Trang chủ' },
        { key: 'forms', label: 'Cài đặt biểu mẫu' },
        { key: 'analytes',  label: 'Danh sách xét nghiệm' },
        { key: 'lots', label: 'Quản lý lô' },
        { key: 'devices', label: 'Quản lý máy' },
        { key: 'users', label: 'Quản lý người dùng' },
        { key: 'departments', label: 'Quản lý khoa' },
      ]
    },
    {
      key: 'qc-management',
      icon: <ControlOutlined />,
      label: 'Quản lý QC',
      children: [
        { key: 'limit', label: 'Thiết lập giới hạn QC' },
        { key: 'qcsetup', label: 'Thiết lập mức QC' },
        { key: 'entry', label: 'Điền dữ liệu QC' },
      ]
    },
    { key: 'lj', icon: <LineChartOutlined />, label: 'Levey-Jennings' },
    { key: 'westgard', icon: <BarChartOutlined />, label: 'Westgard' },
    { key: 'sigma', icon: <DeploymentUnitOutlined />, label: 'Six Sigma' },
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
  ]

  const AppContent = () => {
    const [activeKey, setActiveKey] = useState('home')
    const { isAuthenticated, user, login, logout } = useAuth()
    
    useEffect(() => {
      const setFromHash = () => {
        const k = (window.location.hash || '').replace(/^#/, '')
        if (k) setActiveKey(k)
      }
      setFromHash()
      window.addEventListener('hashchange', setFromHash)
      return () => window.removeEventListener('hashchange', setFromHash)
    }, [])

    return (
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1976d2', fontSize: 14 } }}>
        <AntApp>
          {isAuthenticated ? (
            <AppLayout
              menuItems={menuItems}
              onMenuClick={(k)=> { setActiveKey(k); window.location.hash = k }}
              selectedKey={activeKey}
              user={user}
              onLogout={logout}
            >
              <ProtectedRoute>
                {activeKey === 'home' && <HomePage />}
                {activeKey === 'forms' && <FormsPage />}
                {activeKey === 'analytes' && <AnalytesPage />}
                {activeKey === 'lots' && <LotsPage />}
                {activeKey === 'devices' && <MachinesPage />}
                {activeKey === 'users' && <UsersPage />}
                {activeKey === 'departments' && <DepartmentPage />}
                {activeKey === 'profile' && <ProfilePage />}
                {activeKey === 'limit' && <LimitsPage />}
                {activeKey === 'qcsetup' && <QcSetupPage />}
                {activeKey === 'entry' && <EntryPage />}
                {activeKey === 'lj' && <LJPage />}
                {activeKey === 'westgard' && <WestgardPage />}
                {activeKey === 'sigma' && <SigmaPage />}
              </ProtectedRoute>
            </AppLayout>
          ) : (
            <LoginPage onSuccess={login} />
          )}
        </AntApp>
      </ConfigProvider>
    )
  }

  const App = () => {
    return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    )
  }

  const r = ReactDOM.createRoot(mount)
  r.render(<App />)
}

render()


