import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listWestgardRules,
  getWestgardRuleById,
  createWestgardRule,
  updateWestgardRule,
  deleteWestgardRule
} from '../services/westgard-rule.service'

export async function list(req: Request, res: Response) {
  try {
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const where = withDept({}, req)
    
    const result = await listWestgardRules({
      ...pagination,
      search,
      departmentId: where.departmentId
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list Westgard rules'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const rule = await getWestgardRuleById(id)
    
    if (!rule) {
      return res.status(404).json(fail('NOT_FOUND', 'Westgard rule not found'))
    }
    
    return res.json(ok(rule))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get Westgard rule'))
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
    
    const rule = await createWestgardRule(input)
    return res.status(201).json(ok(rule))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Westgard rule code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create Westgard rule'))
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
    
    const rule = await updateWestgardRule(input)
    return res.json(ok(rule))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Westgard rule not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Westgard rule code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update Westgard rule'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteWestgardRule(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Westgard rule not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete Westgard rule'))
  }
}
