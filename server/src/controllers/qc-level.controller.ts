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
} from '../services/qc-level.service'

export async function list(req: Request, res: Response) {
  try {
    const options = req.query.options === 'true'
    const lotId = req.query.lotId as string
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const where = withDept({}, req)
    
    const result = await listQcLevels({
      ...pagination,
      search,
      departmentId: where.departmentId,
      options,
      lotId
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
    const user = (req as any).user as { id?: string; departmentId?: string }
    const input = {
      ...req.body,
      departmentId: req.body.departmentId || user.departmentId,
      createdBy: user.id
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
    const user = (req as any).user as { id?: string }
    const input = {
      ...req.body,
      id,
      updatedBy: user.id
    }
    
    const qcLevel = await updateQcLevel(input)
    return res.json(ok(qcLevel))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'QC level not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_NAME', 'QC level name already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update QC level'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteQcLevel(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'QC level not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete QC level'))
  }
}
