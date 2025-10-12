export type MachineDTO = {
  id: string
  deviceCode: string
  name: string
  model?: string | null
  serial?: string | null
  status?: number | null
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateMachineInput = {
  deviceCode: string
  name: string
  model?: string | null
  serial?: string | null
  status?: number | null
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateMachineInput = {
  id: string
  deviceCode?: string
  name?: string
  model?: string | null
  serial?: string | null
  status?: number | null
  note?: string | null
  departmentId?: string | null
  updatedBy?: string | null
}







