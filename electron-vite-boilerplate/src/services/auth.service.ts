import { apiClient, ApiResponse } from '../utils/api'

export interface LoginRequest {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
  fullName?: string
  role?: string
  departmentId?: string
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authService = {
  login: (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    apiClient.post('/auth/login', credentials),
  
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/me'),
}
