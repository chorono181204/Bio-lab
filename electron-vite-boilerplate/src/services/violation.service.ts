import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Violation {
  id: string
  entryId: string
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  ruleId: string
  entryDate: string
  value: number
  severity: string
  message?: string
  departmentId: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
  // Related data
  entry?: any
  analyte?: {
    id: string
    code: string
    name: string
  }
  rule?: {
    id: string
    name: string
    code: string
  }
}

export interface CreateViolationInput {
  entryId: string
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  ruleId: string
  entryDate: string
  value: number
  severity: string
  message?: string
  departmentId?: string
}

export interface UpdateViolationInput extends Partial<CreateViolationInput> {
  id: string
}

export interface ViolationListParams {
  page?: number
  pageSize?: number
  search?: string
  lotId?: string
  qcLevelId?: string
  machineId?: string
  analyteId?: string
  ruleId?: string
  severity?: string
  startDate?: string
  endDate?: string
}

export const violationService = {
  list: (params?: ViolationListParams): Promise<ApiResponse<PaginatedResponse<Violation>>> =>
    apiClient.get('/violations', { params }),
  
  getById: (id: string): Promise<ApiResponse<Violation>> =>
    apiClient.get(`/violations/${id}`),
  
  create: (data: CreateViolationInput): Promise<ApiResponse<Violation>> =>
    apiClient.post('/violations', data),
  
  update: (id: string, data: UpdateViolationInput): Promise<ApiResponse<Violation>> =>
    apiClient.put(`/violations/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/violations/${id}`),
}







