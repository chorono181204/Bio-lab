import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface QCLimit {
  id: string
  analyteId: string
  qcLevelId?: string // Thêm qcLevelId
  analyteName: string
  qcLevel: string
  qcName?: string
  lot: string
  applyToMachine: boolean
  machineId?: string
  machineName?: string
  unit: string
  decimals: number
  mean: number
  sd: number
  cv?: number
  tea?: number
  cvRef?: number
  peerGroup?: number
  biasEqa?: number
  inputDate?: string
  exp?: string
  method?: string
  note?: string
  biasMethod?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  // Object fields from backend
  analyte?: {
    id: string
    code: string
    name: string
  }
  lot?: {
    id: string
    code: string
    lotName?: string
  }
  qcLevel?: {
    id: string
    name: string
  }
  machine?: {
    id: string
    deviceCode: string
    name: string
  }
}

export interface CreateQCLimitInput {
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  unit?: string
  decimals?: number
  mean: number
  sd: number
  cv?: number
  tea?: number
  cvRef?: number
  peerGroup?: number
  biasEqa?: number
  inputDate?: string
  exp?: string
  method?: string
  note?: string
  biasMethod?: string
  createdBy?: string
}

export interface UpdateQCLimitInput extends Partial<CreateQCLimitInput> {
  id: string
  updatedBy?: string
}

export interface QCLimitListParams {
  page?: number
  pageSize?: number
  search?: string
  analyteId?: string
  lotId?: string
  machineId?: string
  qcLevel?: string
  options?: boolean
}

// Helper function to map backend data to frontend format
const mapLimitData = (limit: any): QCLimit => ({
  id: limit.id,
  analyteId: limit.analyteId,
  qcLevelId: limit.qcLevelId,
  analyteName: limit.analyte?.name || '',
  qcName: limit.qcLevel?.name,
  applyToMachine: !!limit.machineId,
  machineId: limit.machineId,
  machineName: limit.machine?.name,
  unit: limit.unit || '',
  decimals: limit.decimals || 2,
  mean: limit.mean || 0,
  sd: limit.sd || 0,
  cv: limit.cv,
  tea: limit.tea,
  cvRef: limit.cvRef,
  peerGroup: limit.peerGroup,
  biasEqa: limit.biasEqa,
  inputDate: limit.inputDate,
  exp: limit.exp,
  method: limit.method,
  note: limit.note,
  biasMethod: limit.biasMethod,
  createdBy: limit.createdBy,
  updatedBy: limit.updatedBy,
  createdAt: limit.createdAt,
  updatedAt: limit.updatedAt,
  // Keep original objects for frontend use
  analyte: limit.analyte,
  lot: limit.lot,
  qcLevel: limit.qcLevel,
  machine: limit.machine
})

export const limitService = {
  list: async (params?: QCLimitListParams): Promise<ApiResponse<PaginatedResponse<QCLimit>>> => {
  console.log('=== LIMIT SERVICE LIST ===')
  console.log('params:', params)
  console.log('timestamp:', new Date().toISOString())
  
  const response = await apiClient.get('/limits', { params })
  console.log('raw response:', response)
  console.log('response timestamp:', new Date().toISOString())
    if (response.data && 'items' in response.data) {
      const mappedResponse = {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(mapLimitData)
        }
      }
      console.log('mapped response:', mappedResponse)
      return mappedResponse
    }
    console.log('returning raw response:', response)
    return response
  },

  getById: async (id: string): Promise<ApiResponse<QCLimit>> => {
    const response = await apiClient.get(`/limits/${id}`)
    return {
      ...response,
      data: mapLimitData(response.data)
    }
  },

  create: async (data: CreateQCLimitInput): Promise<ApiResponse<QCLimit>> => {
    const response = await apiClient.post('/limits', data)
    return {
      ...response,
      data: mapLimitData(response.data)
    }
  },

  update: async (id: string, data: UpdateQCLimitInput): Promise<ApiResponse<QCLimit>> => {
    const response = await apiClient.put(`/limits/${id}`, data)
    return {
      ...response,
      data: mapLimitData(response.data)
    }
  },

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/limits/${id}`),

  async getLimitOptions(): Promise<QCLimit[]> {
    const response = await this.list({
      options: true
    })
    return response.data.items
  }
}