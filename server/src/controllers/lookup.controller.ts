import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { withDept } from '../middleware/scopeDepartment'
import { getInitLookupData } from '../services/lookup.service'

export async function getInitData(req: Request, res: Response) {
  try {
    const where = withDept({}, req)
    const data = await getInitLookupData(where.departmentId)
    return res.json(ok(data))
  } catch (e) {
    return res.status(500).json(fail('LOOKUP_ERROR', 'Failed to get initial lookup data'))
  }
}








