export interface WestgardRule {
  id: string
  code: string
  name: string
  severity: 'warning' | 'error' | 'critical'
  description?: string
  type?: string
  windowSize?: number
  thresholdSd?: number
  consecutivePoints?: number
  sameSide?: boolean
  oppositeSides?: boolean
  sumAbsZGt?: number
  expression?: string
  customMessage?: string
  orderIndex?: number
  params?: string
  isActive: boolean
  departmentId?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
  qcLevels?: string[] // For frontend display
}

export interface CreateWestgardRuleInput {
  code: string
  name: string
  severity: 'warning' | 'error' | 'critical'
  description?: string
  type?: string
  windowSize?: number
  thresholdSd?: number
  consecutivePoints?: number
  sameSide?: boolean
  oppositeSides?: boolean
  sumAbsZGt?: number
  expression?: string
  customMessage?: string
  orderIndex?: number
  params?: string
  isActive?: boolean
  qcLevels?: string[]
}

export interface UpdateWestgardRuleInput extends Partial<CreateWestgardRuleInput> {
  id: string
}

export interface WestgardRuleFilters {
  search?: string
  severity?: string
  isActive?: boolean
  qcLevelId?: string
  departmentId?: string
}

export interface WestgardRuleListParams {
  page?: number
  pageSize?: number
  search?: string
  severity?: string
  isActive?: boolean
  qcLevelId?: string
  departmentId?: string
  options?: boolean
}
