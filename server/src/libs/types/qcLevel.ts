export interface QcLevel {
  id: string
  name: string
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
  department?: {
    id: string
    name: string
  }
}

export interface CreateQcLevelInput {
  name: string
  departmentId?: string
  createdBy?: string
}

export interface UpdateQcLevelInput {
  id: string
  name?: string
  departmentId?: string
  updatedBy?: string
}

export interface QcLevelFilters {
  search?: string
  departmentId?: string
  options?: boolean
}

