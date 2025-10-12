import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/db'
import { fail } from '../libs/utils/response'
import dayjs from 'dayjs'

export function lockEntryByMonth(field: 'entryDate' | 'exp' = 'entryDate') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { role?: string; departmentId?: string }
    
    // Admin bypass
    if (user?.role === 'admin') return next()
    
    const depId = user?.departmentId
    if (!depId) return next()

    try {
      // Get department's locked months
      const dep = await prisma.department.findUnique({
        where: { id: depId },
        select: { lockedEntryMonths: true }
      })

      const csv = dep?.lockedEntryMonths || ''
      const locked = new Set(csv.split(',').map(s => s.trim()).filter(Boolean))

      // Get date from request body
      const raw = req.body?.[field] || req.body?.date
      if (!raw) return next() // No date in payload, let controller handle validation

      const d = dayjs(String(raw))
      if (!d.isValid()) {
        return res.status(400).json(fail('INVALID_DATE', 'Ngày không hợp lệ'))
      }

      const monthKey = d.format('YYYY-MM')
      if (locked.has(monthKey)) {
        return res.status(403).json(fail('MONTH_LOCKED', `Tháng ${monthKey} đã bị khóa`))
      }

      next()
    } catch (e) {
      return res.status(500).json(fail('LOCK_CHECK_ERROR', 'Lỗi kiểm tra khóa tháng'))
    }
  }
}







