import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Machine {
  id: string
  deviceCode: string
  name: string
  model?: string
  serial?: string
  status?: number
  note?: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  lots?: Array<{ id: string; code: string; lotName?: string; expiryDate?: string | Date }>
}

export interface CreateMachineInput {
  deviceCode: string
  name: string
  model?: string
  serial?: string
  status?: number
  note?: string
  departmentId?: string
  createdBy?: string
}

export interface UpdateMachineInput extends Partial<CreateMachineInput> {
  id: string
  updatedBy?: string
}

export interface MachineListParams {
  page?: number
  pageSize?: number
  search?: string
  options?: boolean
  lotId?: string
}

export const machineService = {
  list: (params?: MachineListParams): Promise<ApiResponse<PaginatedResponse<Machine> | Machine[]>> =>
    apiClient.get('/machines', { params }),
  
  getById: (id: string): Promise<ApiResponse<Machine>> =>
    apiClient.get(`/machines/${id}`),
  
  create: (data: CreateMachineInput): Promise<ApiResponse<Machine>> =>
    apiClient.post('/machines', data),
  
  update: (id: string, data: UpdateMachineInput): Promise<ApiResponse<Machine>> =>
    apiClient.put(`/machines/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/machines/${id}`),
}
