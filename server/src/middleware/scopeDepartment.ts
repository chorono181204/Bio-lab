import { Request, Response, NextFunction } from 'express'


export function scopeByDepartment(req: Request, _res: Response, next: NextFunction) {
  const user = (req as any).user as { role?: string; departmentId?: string | null }
  if (user?.role === 'admin') {
    (req as any).scopeDepartmentId = undefined
  } else {
    (req as any).scopeDepartmentId = user?.departmentId || null
  }
  next()
}

// Small helper to apply scope in queries
export function withDept(where: any, req: Request) {
  const dep = (req as any).scopeDepartmentId
  if (dep) return { ...(where || {}), departmentId: dep }
  return where || {}
}


