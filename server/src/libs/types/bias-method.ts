export type BiasMethodDTO = {
  id: string
  name: string
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateBiasMethodInput = {
  name: string
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateBiasMethodInput = {
  id: string
  name?: string
  note?: string | null
  departmentId?: string | null
  updatedBy?: string | null
}







