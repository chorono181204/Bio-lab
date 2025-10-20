import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { withDept } from '../middleware/scopeDepartment'
import { getDepartmentStats } from '../services/stats.service'

export async function getStats(req: Request, res: Response) {
  try {
    const user = (req as any).user as { role?: string; departmentId?: string }
    const where = withDept({}, req)
    
    console.log('=== GET STATS DEBUG ===')
    console.log('User role:', user.role)
    console.log('Department ID:', where.departmentId)
    
    const stats = await getDepartmentStats(where.departmentId)
    
    return res.json(ok(stats))
  } catch (e) {
    console.error('Stats error:', e)
    return res.status(500).json(fail('STATS_ERROR', 'Failed to get statistics'))
  }
}
