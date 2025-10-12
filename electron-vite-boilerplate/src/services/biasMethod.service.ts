import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface BiasMethod {
  id: string
  name: string
  note?: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBiasMethodInput {
  name: string
  note?: string
  departmentId?: string
}

export interface UpdateBiasMethodInput extends Partial<CreateBiasMethodInput> {
  id: string
}

export interface BiasMethodListParams {
  page?: number
  pageSize?: number
  search?: string
  options?: boolean
}

export const biasMethodService = {
  list: (params?: BiasMethodListParams): Promise<ApiResponse<PaginatedResponse<BiasMethod> | BiasMethod[]>> =>
    apiClient.get('/bias-methods', { params }),
  
  getById: (id: string): Promise<ApiResponse<BiasMethod>> =>
    apiClient.get(`/bias-methods/${id}`),
  
  create: (data: CreateBiasMethodInput): Promise<ApiResponse<BiasMethod>> =>
    apiClient.post('/bias-methods', data),
  
  update: (id: string, data: UpdateBiasMethodInput): Promise<ApiResponse<BiasMethod>> =>
    apiClient.put(`/bias-methods/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/bias-methods/${id}`),
}






