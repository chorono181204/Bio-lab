export type LotDTO = {
  id: string
  code: string
  lotName?: string | null
  status?: number | null
  receivedDate?: Date | null
  expiryDate?: Date | null
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateLotInput = {
  code: string
  lotName?: string | null
  status?: number | null
  receivedDate?: Date | null
  expiryDate?: Date | null
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateLotInput = {
  id: string
  code?: string
  lotName?: string | null
  status?: number | null
  receivedDate?: Date | null
  expiryDate?: Date | null
  note?: string | null
  departmentId?: string | null
  updatedBy?: string | null
}







