import { apiClient, ApiResponse } from '../utils/api'

export interface LookupOption {
  id: string
  code?: string
  name: string
  label?: string
}

export interface InitLookupData {
  lots: LookupOption[]
  machines: LookupOption[]
  qcLevels: LookupOption[]
  analytes: LookupOption[]
}

export const lookupService = {
  getInitData: (): Promise<ApiResponse<InitLookupData>> =>
    apiClient.get('/lookups/init'),
}







