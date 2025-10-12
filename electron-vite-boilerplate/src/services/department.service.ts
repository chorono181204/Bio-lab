import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  lockedEntryMonths?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentInput {
  name: string
  code: string
  description?: string
  lockedEntryMonths?: string
}

export interface UpdateDepartmentInput extends Partial<CreateDepartmentInput> {
  id: string
}

export interface DepartmentListParams {
  page?: number
  pageSize?: number
  search?: string
  options?: boolean
}

export const departmentService = {
  list: (params?: DepartmentListParams): Promise<ApiResponse<PaginatedResponse<Department> | Department[]>> =>
    apiClient.get('/departments', { params }),
  
  getById: (id: string): Promise<ApiResponse<Department>> =>
    apiClient.get(`/departments/${id}`),
  
  create: (data: CreateDepartmentInput): Promise<ApiResponse<Department>> =>
    apiClient.post('/departments', data),
  
  update: (id: string, data: UpdateDepartmentInput): Promise<ApiResponse<Department>> =>
    apiClient.put(`/departments/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/departments/${id}`),
}







