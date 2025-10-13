export interface Limit {
  id: string
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  unit?: string
  decimals: number
  mean: number
  sd: number
  cv?: number
  tea?: number
  cvRef?: number
  peerGroup?: number
  biasEqa?: number
  biasMethodId?: string
  createdBy?: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
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
  biasMethod?: {
    id: string
    name: string
  }
}

export interface CreateLimitInput {
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
  biasMethodId?: string
  qcName?: string
  exp?: Date | string
  method?: string
  note?: string
  createdBy?: string
}

export interface UpdateLimitInput {
  id: string
  analyteId?: string
  lotId?: string
  qcLevelId?: string
  machineId?: string
  unit?: string
  decimals?: number
  mean?: number
  sd?: number
  cv?: number
  tea?: number
  cvRef?: number
  peerGroup?: number
  biasEqa?: number
  biasMethodId?: string
  updatedBy?: string
}

export interface LimitFilters {
  search?: string
  analyteId?: string
  lotId?: string
  machineId?: string
  qcLevel?: string
  options?: boolean
}