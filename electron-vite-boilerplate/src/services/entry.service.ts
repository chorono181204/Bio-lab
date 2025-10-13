import { apiClient, ApiResponse, PaginatedResponse } from '../utils/api'

export interface Entry {
  id: string
  analyteId: string
  analyteName: string
  machineId: string
  machineName: string
  qcLevelId: string
  qcLevelName: string
  lotId: string
  lotCode: string
  date: string
  value: number
  unit: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface CreateEntryInput {
  analyteId: string
  machineId: string
  qcLevelId: string
  lotId: string
  date: string
  value: number
  unit?: string
  note?: string
  createdBy?: string
}

export interface UpdateEntryInput extends Partial<CreateEntryInput> {
  id: string
  updatedBy?: string
}

export interface EntryListParams {
  page?: number
  pageSize?: number
  search?: string
  analyteId?: string
  lotId?: string
  machineId?: string
  qcLevelId?: string
  dateFrom?: string
  dateTo?: string
  options?: boolean
}

// Helper function to map backend data to frontend format
const mapEntryData = (entry: any): Entry => ({
  id: entry.id,
  analyteId: entry.analyteId,
  analyteName: typeof entry.analyte?.name === 'string' ? entry.analyte.name : (entry.analyteName || ''),
  machineId: entry.machineId,
  machineName: typeof entry.machine?.name === 'string' ? entry.machine.name : (entry.machineName || ''),
  qcLevelId: entry.qcLevelId,
  qcLevelName: typeof entry.qcLevel?.name === 'string' ? entry.qcLevel.name : (entry.qcLevelName || ''),
  lotId: entry.lotId,
  lotCode: typeof entry.lot?.code === 'string' ? entry.lot.code : (entry.lotCode || ''),
  date: entry.entryDate || entry.date,
  value: entry.value,
  unit: entry.unit || '',
  createdBy: entry.createdBy,
  updatedBy: entry.updatedBy,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt
})

export const entryService = {
  list: async (params?: EntryListParams): Promise<ApiResponse<PaginatedResponse<Entry>>> => {
    console.log('=== ENTRY SERVICE LIST ===')
    console.log('params:', params)
    const response = await apiClient.get('/entries', { params })
    console.log('raw response:', response)
    if (response.data && 'items' in response.data) {
      const mappedResponse = {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(mapEntryData)
        }
      }
      console.log('mapped response:', mappedResponse)
      return mappedResponse
    }
    console.log('returning raw response:', response)
    return response
  },

  getById: async (id: string): Promise<ApiResponse<Entry>> => {
    const response = await apiClient.get(`/entries/${id}`)
    return {
      ...response,
      data: mapEntryData(response.data)
    }
  },

  create: async (data: CreateEntryInput): Promise<ApiResponse<Entry>> => {
    const response = await apiClient.post('/entries', data)
    return {
      ...response,
      data: mapEntryData(response.data)
    }
  },

  update: async (id: string, data: UpdateEntryInput): Promise<ApiResponse<Entry>> => {
    const response = await apiClient.put(`/entries/${id}`, data)
    return {
      ...response,
      data: mapEntryData(response.data)
    }
  },

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/entries/${id}`),

  async getEntryOptions(): Promise<Entry[]> {
    const response = await this.list({
      options: true
    })
    return response.data.items
  }
}