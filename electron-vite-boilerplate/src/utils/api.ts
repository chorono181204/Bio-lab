import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config/env'
import { message } from 'antd'

// API Configuration: allow dynamic base URL from localStorage (serverUrl), default to config.apiBaseUrl
const getBaseUrl = () => {
  const raw = localStorage.getItem('serverUrl')
  if (raw && raw.trim()) {
    const url = raw.replace(/\/?$/, '') // remove trailing slash
    return `${url}:4000/api`
  }
  return config.apiBaseUrl
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Refresh baseURL each request in case user updated serverUrl in Connection page
    config.baseURL = getBaseUrl()
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const errorData = error.response?.data
      const errorCode = errorData?.error?.code || ''
      const errorMessage = errorData?.error?.message || ''
      
      // Only logout for specific token expiration codes
      if (errorCode === 'TOKEN_EXPIRED' || 
          errorCode === 'INVALID_TOKEN' ||
          errorCode === 'TOKEN_NOT_ACTIVE') {
        
        // Token expired or invalid - logout user
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        localStorage.removeItem('fullName')
        
        // Show notification before redirect
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        
        // Redirect to login
        window.location.href = '/login'
      } else {
        // Other 401 errors (like unauthorized access) - just show error
        console.warn('401 Unauthorized:', { code: errorCode, message: errorMessage })
      }
    }
    return Promise.reject(error)
  }
)

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config).then(res => res.data),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then(res => res.data),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then(res => res.data),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config).then(res => res.data),
}

export default api
