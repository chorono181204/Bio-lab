import { Request, Response, NextFunction } from 'express'

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { role?: string }
    if (!user?.role || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } })
    }
    next()
  }
}


