import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listAnalytes,
  getAnalyteById,
  createAnalyte,
  updateAnalyte,
  deleteAnalyte
} from '../services/analyte.service'

export async function list(req: Request, res: Response) {
  try {
    const options = req.query.options === 'true'
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const where = withDept({}, req)
    
    const result = await listAnalytes({
      ...pagination,
      search,
      departmentId: where.departmentId,
      options
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list analytes'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    const analyte = await getAnalyteById(id)
    
    if (!analyte) {
      return res.status(404).json(fail('NOT_FOUND', 'Analyte not found'))
    }
    
    return res.json(ok(analyte))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get analyte'))
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
    
    const analyte = await createAnalyte(input)
    return res.status(201).json(ok(analyte))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Analyte code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create analyte'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
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
    
    const analyte = await updateAnalyte(input)
    return res.json(ok(analyte))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Analyte not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Analyte code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update analyte'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    await deleteAnalyte(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Analyte not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete analyte'))
  }
}
