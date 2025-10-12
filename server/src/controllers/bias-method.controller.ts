import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listBiasMethods,
  getBiasMethodById,
  createBiasMethod,
  updateBiasMethod,
  deleteBiasMethod
} from '../services/bias-method.service'

export async function list(req: Request, res: Response) {
  try {
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const where = withDept({}, req)
    
    const result = await listBiasMethods({
      ...pagination,
      search,
      departmentId: where.departmentId
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list bias methods'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const method = await getBiasMethodById(id)
    
    if (!method) {
      return res.status(404).json(fail('NOT_FOUND', 'Bias method not found'))
    }
    
    return res.json(ok(method))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get bias method'))
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
    
    const method = await createBiasMethod(input)
    return res.status(201).json(ok(method))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_NAME', 'Bias method name already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create bias method'))
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
    
    const method = await updateBiasMethod(input)
    return res.json(ok(method))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Bias method not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_NAME', 'Bias method name already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update bias method'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteBiasMethod(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Bias method not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete bias method'))
  }
}







