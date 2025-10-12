export interface Form {
  id: string
  name: string
  code: string
  issueRound?: string
  issueDate?: Date
  note?: string
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

export interface CreateFormInput {
  name: string
  code: string
  issueRound?: string
  issueDate?: Date
  note?: string
  departmentId?: string
  createdBy?: string
}

export interface UpdateFormInput {
  name?: string
  code?: string
  issueRound?: string
  issueDate?: Date
  note?: string
  departmentId?: string
  updatedBy?: string
}

export interface FormFilters {
  search?: string
  departmentId?: string
  options?: boolean
}