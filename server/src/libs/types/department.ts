export type DepartmentDTO = {
  id: string
  code: string
  name: string
  lockedEntryMonths?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateDepartmentInput = {
  code: string
  name: string
  lockedEntryMonths?: string | null
  createdBy?: string | null
}

export type UpdateDepartmentInput = {
  id: string
  code?: string
  name?: string
  lockedEntryMonths?: string | null
  updatedBy?: string | null
}







