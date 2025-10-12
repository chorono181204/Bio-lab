export type QcLevelDTO = {
  id: string
  name: string
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateQcLevelInput = {
  name: string
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateQcLevelInput = {
  id: string
  name?: string
  departmentId?: string | null
  updatedBy?: string | null
}







