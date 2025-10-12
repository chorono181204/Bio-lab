import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listViolations,
  getViolationById,
  createViolation,
  updateViolation,
  deleteViolation
} from '../services/violation.service'

export async function list(req: Request, res: Response) {
  try {
    const pagination = parsePagination(req.query)
    const where = withDept({}, req)
    
    const result = await listViolations({
      ...pagination,
      analyteId: req.query.analyteId as string,
      lotId: req.query.lotId as string,
      qcLevelId: req.query.qcLevelId as string,
      machineId: req.query.machineId as string,
      ruleId: req.query.ruleId as string,
      status: req.query.status as string,
      departmentId: where.departmentId
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list violations'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    const violation = await getViolationById(id)
    
    if (!violation) {
      return res.status(404).json(fail('NOT_FOUND', 'Violation not found'))
    }
    
    return res.json(ok(violation))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get violation'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    const user = (req as any).user as { id?: string; departmentId?: string }
    const input = {
      ...req.body,
      entryDate: new Date(req.body.entryDate),
      departmentId: req.body.departmentId || user.departmentId,
      createdBy: user.id
    }
    
    const violation = await createViolation(input)
    return res.status(201).json(ok(violation))
  } catch (e: any) {
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create violation'))
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
    
    const violation = await updateViolation(input)
    return res.json(ok(violation))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Violation not found'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update violation'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    await deleteViolation(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Violation not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete violation'))
  }
}
