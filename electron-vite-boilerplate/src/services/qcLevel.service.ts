import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface QcLevel {
  id: string
  name: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  department?: {
    id: string
    name: string
  }
}

export interface CreateQcLevelInput {
  name: string
  departmentId?: string
  createdBy?: string
}

export interface UpdateQcLevelInput extends Partial<CreateQcLevelInput> {
  id: string
  updatedBy?: string
}

export interface QcLevelListParams {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  options?: boolean
}

export const qcLevelService = {
  list: (params?: QcLevelListParams): Promise<ApiResponse<PaginatedResponse<QcLevel>>> =>
    apiClient.get('/qc-levels', { params }),

  getById: (id: string): Promise<ApiResponse<QcLevel>> =>
    apiClient.get(`/qc-levels/${id}`),

  create: (data: CreateQcLevelInput): Promise<ApiResponse<QcLevel>> =>
    apiClient.post('/qc-levels', data),

  update: (id: string, data: UpdateQcLevelInput): Promise<ApiResponse<QcLevel>> =>
    apiClient.put(`/qc-levels/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/qc-levels/${id}`),

  async getQcLevelOptions(departmentId?: string): Promise<QcLevel[]> {
    const response = await this.list({
      options: true,
      departmentId
    })
    return response.data.data.items
  }
}