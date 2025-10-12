export type WestgardRuleDTO = {
  id: string
  code: string
  name: string
  severity: string
  description?: string | null
  type?: string | null
  windowSize?: number | null
  thresholdSd?: number | null
  consecutivePoints?: number | null
  sameSide?: boolean | null
  oppositeSides?: boolean | null
  sumAbsZGt?: number | null
  expression?: string | null
  customMessage?: string | null
  orderIndex?: number | null
  params?: string | null
  isActive: boolean
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateWestgardRuleInput = {
  code: string
  name: string
  severity: string
  description?: string | null
  type?: string | null
  windowSize?: number | null
  thresholdSd?: number | null
  consecutivePoints?: number | null
  sameSide?: boolean | null
  oppositeSides?: boolean | null
  sumAbsZGt?: number | null
  expression?: string | null
  customMessage?: string | null
  orderIndex?: number | null
  params?: string | null
  isActive?: boolean
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateWestgardRuleInput = {
  id: string
  code?: string
  name?: string
  severity?: string
  description?: string | null
  type?: string | null
  windowSize?: number | null
  thresholdSd?: number | null
  consecutivePoints?: number | null
  sameSide?: boolean | null
  oppositeSides?: boolean | null
  sumAbsZGt?: number | null
  expression?: string | null
  customMessage?: string | null
  orderIndex?: number | null
  params?: string | null
  isActive?: boolean
  departmentId?: string | null
  updatedBy?: string | null
}







