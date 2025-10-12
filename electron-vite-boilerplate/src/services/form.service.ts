import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Form {
  id: string
  name: string
  code: string
  issueRound?: string
  issueDate?: string | Date
  note?: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string | Date
  updatedAt: string | Date
  department?: {
    id: string
    name: string
  }
}

export interface CreateFormInput {
  name: string
  code: string
  issueRound?: string
  issueDate?: string | Date
  note?: string
  departmentId?: string
}

export interface UpdateFormInput extends Partial<CreateFormInput> {
  id: string
}

export interface FormListParams {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  options?: boolean
}

export const formService = {
  list: (params?: FormListParams): Promise<ApiResponse<PaginatedResponse<Form>>> =>
    apiClient.get('/forms', { params }),
  
  getById: (id: string): Promise<ApiResponse<Form>> =>
    apiClient.get(`/forms/${id}`),
  
  create: (data: CreateFormInput): Promise<ApiResponse<Form>> =>
    apiClient.post('/forms', data),
  
  update: (id: string, data: UpdateFormInput): Promise<ApiResponse<Form>> =>
    apiClient.put(`/forms/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/forms/${id}`),

  // Get forms for dropdown (options mode)
  async getFormOptions(departmentId?: string): Promise<Form[]> {
    const response = await this.list({ 
      options: true, 
      departmentId 
    })
    return response.data.data.items
  }
}




