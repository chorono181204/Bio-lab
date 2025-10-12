import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine
} from '../services/machine.service'

export async function list(req: Request, res: Response) {
  try {
    const options = req.query.options === 'true'
    const lotId = req.query.lotId as string
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const where = withDept({}, req)
    
    const result = await listMachines({
      ...pagination,
      search,
      departmentId: where.departmentId,
      options,
      lotId
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list machines'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const machine = await getMachineById(id)
    
    if (!machine) {
      return res.status(404).json(fail('NOT_FOUND', 'Machine not found'))
    }
    
    return res.json(ok(machine))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get machine'))
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
    
    const machine = await createMachine(input)
    return res.status(201).json(ok(machine))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Machine device code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create machine'))
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
    
    const machine = await updateMachine(input)
    return res.json(ok(machine))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Machine not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Machine device code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update machine'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteMachine(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Machine not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete machine'))
  }
}
