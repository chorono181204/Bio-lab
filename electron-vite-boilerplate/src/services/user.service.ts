import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface User {
  id: string
  username: string
  fullName?: string
  role?: string
  position?: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  // Related data
  department?: {
    id: string
    name: string
    code: string
  }
}

export interface CreateUserInput {
  username: string
  password: string
  fullName?: string
  role?: string
  position?: string
  departmentId?: string
}

export interface UpdateUserInput {
  id: string
  username?: string
  fullName?: string
  role?: string
  position?: string
  departmentId?: string
}

export interface ChangePasswordInput {
  oldPassword: string
  newPassword: string
}

export interface UserListParams {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  role?: string
  isActive?: boolean
}

export const userService = {
  list: (params?: UserListParams): Promise<ApiResponse<PaginatedResponse<User>>> =>
    apiClient.get('/users', { params }),
  
  getById: (id: string): Promise<ApiResponse<User>> =>
    apiClient.get(`/users/${id}`),
  
  create: (data: CreateUserInput): Promise<ApiResponse<User>> =>
    apiClient.post('/users', data),
  
  update: (id: string, data: UpdateUserInput): Promise<ApiResponse<User>> =>
    apiClient.put(`/users/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/users/${id}`),
  
  changePassword: (id: string, data: ChangePasswordInput): Promise<ApiResponse<void>> =>
    apiClient.put(`/users/${id}/change-password`, data),
}
