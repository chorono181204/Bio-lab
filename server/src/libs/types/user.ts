export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

export type UserDTO = {
  id: string
  username: string
  fullName?: string | null
  password: string 
  position?: string | null
  dob?: string | null
  note?: string | null
  role?: UserRole 
  departmentId?: string
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: Date
  updatedAt?: Date
}






