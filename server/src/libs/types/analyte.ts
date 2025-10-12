export type AnalyteDTO = {
  id: string
  code: string
  name: string
  unit?: string | null
  decimals: number
  qualityRequirement?: number | null
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateAnalyteInput = {
  code: string
  name: string
  unit?: string | null
  decimals?: number
  qualityRequirement?: number | null
  note?: string | null
  departmentId?: string | null
  createdBy?: string | null
}

export type UpdateAnalyteInput = {
  id: string
  code?: string
  name?: string
  unit?: string | null
  decimals?: number
  qualityRequirement?: number | null
  note?: string | null
  departmentId?: string | null
  updatedBy?: string | null
}


