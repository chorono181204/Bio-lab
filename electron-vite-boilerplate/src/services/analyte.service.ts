import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Analyte {
  id: string
  code: string
  name: string
  unit?: string
  decimals?: number
  qualityRequirement?: number
  note?: string
  departmentId: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAnalyteInput {
  code: string
  name: string
  unit?: string
  decimals?: number
  qualityRequirement?: number
  note?: string
  departmentId?: string
}

export interface UpdateAnalyteInput extends Partial<CreateAnalyteInput> {
  id: string
}

export interface AnalyteListParams {
  page?: number
  pageSize?: number
  search?: string
  options?: boolean
}

export const analyteService = {
  list: (params?: AnalyteListParams): Promise<ApiResponse<PaginatedResponse<Analyte> | Analyte[]>> =>
    apiClient.get('/analytes', { params }),
  
  getById: (id: string): Promise<ApiResponse<Analyte>> =>
    apiClient.get(`/analytes/${id}`),
  
  create: (data: CreateAnalyteInput): Promise<ApiResponse<Analyte>> =>
    apiClient.post('/analytes', data),
  
  update: (id: string, data: UpdateAnalyteInput): Promise<ApiResponse<Analyte>> =>
    apiClient.put(`/analytes/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/analytes/${id}`),
}
