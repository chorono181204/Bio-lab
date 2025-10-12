export interface Entry {
  id: string
  analyteId: string
  machineId: string
  qcLevelId: string
  lotId: string
  date: Date
  value: number
  unit?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: Date
  updatedAt?: Date
  // Relations
  analyte?: {
    id: string
    code: string
    name: string
  }
  machine?: {
    id: string
    deviceCode: string
    name: string
  }
  qcLevel?: {
    id: string
    name: string
  }
  lot?: {
    id: string
    code: string
    lotName: string
  }
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
  departmentId?: string
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
  departmentId?: string | null
  options?: boolean
}