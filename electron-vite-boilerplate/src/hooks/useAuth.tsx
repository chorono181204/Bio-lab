import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { authService, User } from '../services/auth.service'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      authService.getCurrentUser()
        .then(response => {
          if (response.success) {
            setUser(response.data)
          } else {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login with:', { username, password: '***' })
      const response = await authService.login({ username, password })
      console.log('🔐 Login response:', response)
      
      if (response.success) {
        console.log('✅ Login successful, saving to localStorage')
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('username', response.data.user.username)
        localStorage.setItem('role', response.data.user.role || 'user')
        localStorage.setItem('fullName', response.data.user.fullName || response.data.user.username)
        setUser(response.data.user)
        console.log('✅ User data saved to localStorage:', {
          token: response.data.token.substring(0, 20) + '...',
          user: response.data.user
        })
        return true
      }
      console.log('❌ Login failed:', response)
      return false
    } catch (error) {
      console.error('❌ Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
