export type JwtPayload = {
  sub: string
  username: string
  role?: string | null
  departmentId?: string | null
  iat?: number
  exp?: number
}

export type LoginBody = {
  username: string
  password: string
}

export type AuthUser = {
  id: string
  username: string
  role: string
  departmentId: string
}