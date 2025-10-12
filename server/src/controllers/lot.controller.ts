import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listLots,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  getMachinesByLotId,
  getQcLevelsByLotId
} from '../services/lot.service'

export async function list(req: Request, res: Response) {
  try {
    const options = req.query.options === 'true'
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const status = req.query.status as string
    const receivedDateFrom = req.query.receivedDateFrom as string
    const receivedDateTo = req.query.receivedDateTo as string
    const where = withDept({}, req)
    
    const result = await listLots({
      ...pagination,
      search,
      departmentId: where.departmentId,
      status,
      receivedDateFrom,
      receivedDateTo,
      options
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list lots'))
  }
}

export async function getMachinesByLot(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'Lot ID is required'))
    const machines = await getMachinesByLotId(id)
    return res.json(ok(machines))
  } catch (e) {
    return res.status(500).json(fail('LOOKUP_ERROR', 'Failed to get machines for lot'))
  }
}

export async function getQcLevelsByLot(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'Lot ID is required'))
    const qcLevels = await getQcLevelsByLotId(id)
    return res.json(ok(qcLevels))
  } catch (e) {
    return res.status(500).json(fail('LOOKUP_ERROR', 'Failed to get QC levels for lot'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    const lot = await getLotById(id)
    
    if (!lot) {
      return res.status(404).json(fail('NOT_FOUND', 'Lot not found'))
    }
    
    return res.json(ok(lot))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get lot'))
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
    
    const lot = await createLot(input)
    return res.status(201).json(ok(lot))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Lot code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create lot'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Lot ID is required'))
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
    
    const lot = await updateLot(input)
    return res.json(ok(lot))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Lot not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Lot code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update lot'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    await deleteLot(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Lot not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete lot'))
  }
}
