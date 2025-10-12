import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface WestgardRule {
  id: string
  code: string
  name: string
  severity: 'warning' | 'error' | 'critical'
  description?: string
  type?: string
  windowSize?: number
  thresholdSd?: number
  consecutivePoints?: number
  sameSide?: boolean
  oppositeSides?: boolean
  sumAbsZGt?: number
  expression?: string
  customMessage?: string
  orderIndex?: number
  params?: string
  isActive: boolean
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  qcLevels?: string[]
}

export interface CreateWestgardRuleInput {
  code: string
  name: string
  severity: 'warning' | 'error' | 'critical'
  description?: string
  type?: string
  windowSize?: number
  thresholdSd?: number
  consecutivePoints?: number
  sameSide?: boolean
  oppositeSides?: boolean
  sumAbsZGt?: number
  expression?: string
  customMessage?: string
  orderIndex?: number
  params?: string
  isActive?: boolean
  qcLevels?: string[]
}

export interface UpdateWestgardRuleInput extends Partial<CreateWestgardRuleInput> {
  id: string
}

export interface WestgardRuleListParams {
  page?: number
  pageSize?: number
  search?: string
  severity?: string
  isActive?: boolean
  qcLevelId?: string
  departmentId?: string
  options?: boolean
}

// Helper function to map backend data to frontend format
const mapWestgardRuleData = (rule: any): WestgardRule => ({
  id: rule.id,
  code: rule.code,
  name: rule.name,
  severity: rule.severity,
  description: rule.description,
  type: rule.type,
  windowSize: rule.windowSize,
  thresholdSd: rule.thresholdSd,
  consecutivePoints: rule.consecutivePoints,
  sameSide: rule.sameSide,
  oppositeSides: rule.oppositeSides,
  sumAbsZGt: rule.sumAbsZGt,
  expression: rule.expression,
  customMessage: rule.customMessage,
  orderIndex: rule.orderIndex,
  params: rule.params,
  isActive: rule.isActive,
  departmentId: rule.departmentId,
  createdBy: rule.createdBy,
  updatedBy: rule.updatedBy,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
  qcLevels: rule.qcLevels || []
})

export const westgardService = {
  list: async (params?: WestgardRuleListParams): Promise<ApiResponse<PaginatedResponse<WestgardRule>>> => {
    console.log('=== WESTGARD SERVICE LIST ===')
    console.log('params:', params)
    console.log('timestamp:', new Date().toISOString())
    
    const response = await apiClient.get('/westgard-rules', { params })
    console.log('raw response:', response)
    console.log('response timestamp:', new Date().toISOString())
    
    if (response.data && 'items' in response.data) {
      const mappedResponse = {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(mapWestgardRuleData)
        }
      }
      console.log('mapped response:', mappedResponse)
      return mappedResponse
    }
    console.log('returning raw response:', response)
    return response
  },

  getById: async (id: string): Promise<ApiResponse<WestgardRule>> => {
    const response = await apiClient.get(`/westgard-rules/${id}`)
    return {
      ...response,
      data: mapWestgardRuleData(response.data)
    }
  },

  create: async (data: CreateWestgardRuleInput): Promise<ApiResponse<WestgardRule>> => {
    const response = await apiClient.post('/westgard-rules', data)
    return {
      ...response,
      data: mapWestgardRuleData(response.data)
    }
  },

  update: async (id: string, data: UpdateWestgardRuleInput): Promise<ApiResponse<WestgardRule>> => {
    const response = await apiClient.put(`/westgard-rules/${id}`, data)
    return {
      ...response,
      data: mapWestgardRuleData(response.data)
    }
  },

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/westgard-rules/${id}`),

  async getWestgardRuleOptions(): Promise<WestgardRule[]> {
    const response = await this.list({
      options: true
    })
    return response.data.items
  }
}