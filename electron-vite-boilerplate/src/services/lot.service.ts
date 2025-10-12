import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Lot {
  id: string
  code: string
  lotName?: string
  status?: number
  receivedDate?: string | Date
  expiryDate?: string | Date
  note?: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  machines?: Array<{ id: string; deviceCode: string; name: string }>
}

export interface CreateLotInput {
  code: string
  lotName?: string
  status?: number
  receivedDate?: string | Date
  expiryDate?: string | Date
  note?: string
  departmentId?: string
  createdBy?: string
}

export interface UpdateLotInput extends Partial<CreateLotInput> {
  id: string
  updatedBy?: string
}

export interface LotListParams {
  page?: number
  pageSize?: number
  search?: string
  options?: boolean
}

export interface MachineOption {
  id: string
  deviceCode: string
  name: string
  label: string
}

export interface QcLevelOption {
  id: string
  name: string
}

export const lotService = {
  list: (params?: LotListParams): Promise<ApiResponse<PaginatedResponse<Lot> | Lot[]>> =>
    apiClient.get('/lots', { params }),
  
  getById: (id: string): Promise<ApiResponse<Lot>> =>
    apiClient.get(`/lots/${id}`),
  
  getMachines: (lotId: string): Promise<ApiResponse<MachineOption[]>> =>
    apiClient.get(`/lots/${lotId}/machines`),
  
  getQcLevels: (lotId: string): Promise<ApiResponse<QcLevelOption[]>> =>
    apiClient.get(`/lots/${lotId}/qc-levels`),
  
  create: (data: CreateLotInput): Promise<ApiResponse<Lot>> =>
    apiClient.post('/lots', data),
  
  update: (id: string, data: UpdateLotInput): Promise<ApiResponse<Lot>> =>
    apiClient.put(`/lots/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/lots/${id}`),
}
