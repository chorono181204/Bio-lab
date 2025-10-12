export type ViolationDTO = {
  id: string
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  entryDate: Date
  ruleId: string
  content: string
  action?: string | null
  staff?: string | null
  status?: string | null
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateViolationInput = {
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  entryDate: Date
  ruleId: string
  content: string
  action?: string | null
  staff?: string | null
  status?: string | null
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateViolationInput = {
  id: string
  action?: string | null
  staff?: string | null
  status?: string | null
  updatedBy?: string | null
}







