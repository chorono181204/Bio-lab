import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listQcLevels,
  getQcLevelById,
  createQcLevel,
  updateQcLevel,
  deleteQcLevel
} from '../services/qcLevel.service'

export async function list(req: Request, res: Response) {
  try {
    const options = req.query.options === 'true'
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const where = withDept({}, req)
    
    const result = await listQcLevels({
      ...pagination,
      search,
      departmentId: where.departmentId,
      options
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list QC levels'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const qcLevel = await getQcLevelById(id)
    
    if (!qcLevel) {
      return res.status(404).json(fail('NOT_FOUND', 'QC level not found'))
    }
    
    return res.json(ok(qcLevel))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get QC level'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    const input = {
      ...req.body,
      departmentId: req.body.departmentId || user.departmentId,
      createdBy: userFullName
    }
    
    const qcLevel = await createQcLevel(input)
    return res.status(201).json(ok(qcLevel))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_NAME', 'QC level name already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create QC level'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'QC level ID is required'))
    }
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    const input = {
      ...req.body,
      id,
      updatedBy: userFullName
    }
    
    const qcLevel = await updateQcLevel(input)
    return res.json(ok(qcLevel))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_NAME', 'QC level name already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update QC level'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'QC level ID is required'))
    }
    
    await deleteQcLevel(id)
    return res.json(ok(null, 'QC level deleted successfully'))
  } catch (e: any) {
    if (e.code === 'P2003') {
      return res.status(400).json(fail('CONSTRAINT_ERROR', 'Cannot delete QC level that is being used'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete QC level'))
  }
}

