import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import {
  listLimits,
  getLimitById,
  createLimit,
  updateLimit,
  deleteLimit
} from '../services/limit.service'

export async function list(req: Request, res: Response) {
  try {
    console.log('=== LIST LIMITS DEBUG ===')
    console.log('Query params:', req.query)
    
    const options = req.query.options === 'true'
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const analyteId = req.query.analyteId as string
    const lotId = req.query.lotId as string
    const machineId = req.query.machineId as string
    const qcLevel = req.query.qcLevel as string
    
    console.log('=== FILTER PARAMS ===')
    console.log('lotId:', lotId)
    console.log('machineId:', machineId)
    console.log('qcLevel:', qcLevel)
    console.log('analyteId:', analyteId)
    console.log('search:', search)
    
    const result = await listLimits({
      ...pagination,
      search,
      analyteId,
      lotId,
      machineId,
      qcLevel,
      options
    })
    
    console.log('=== RESULT ===')
    console.log('Total items:', result.total)
    console.log('Items count:', result.items?.length || 0)
    console.log('First item:', result.items?.[0] ? JSON.stringify(result.items[0], null, 2) : 'No items')
    return res.json(ok(result))
  } catch (e) {
    console.error('List limits error:', e)
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list limits'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Limit ID is required'))
    }
    const limit = await getLimitById(id)
    
    if (!limit) {
      return res.status(404).json(fail('NOT_FOUND', 'Limit not found'))
    }
    
    return res.json(ok(limit))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get limit'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    console.log('=== CREATE LIMIT START ===')
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    
    const input = {
      ...req.body,
      createdBy: userFullName,
      exp: req.body.exp ? new Date(req.body.exp) : undefined
    }
    
    console.log('Input to createLimit:', JSON.stringify(input, null, 2))
    
    const limit = await createLimit(input)
    console.log('Created limit successfully:', limit.id)
    return res.status(201).json(ok(limit))
  } catch (e: any) {
    console.error('=== CREATE LIMIT ERROR ===')
    console.error('Error name:', e.name)
    console.error('Error message:', e.message)
    console.error('Error code:', e.code)
    console.error('Error stack:', e.stack)
    console.error('Full error:', e)
    console.error('========================')
    
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_LIMIT', 'Đã tồn tại giới hạn QC cho tổ hợp (Bộ XN, Lô, Mức QC, Máy) này. Vui lòng chọn tổ hợp khác hoặc cập nhật giới hạn hiện có.'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create limit'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    console.log('=== UPDATE LIMIT START ===')
    console.log('Limit ID:', req.params.id)
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Limit ID is required'))
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
      updatedBy: userFullName,
      exp: req.body.exp ? new Date(req.body.exp) : undefined
    }
    
    console.log('Input to updateLimit:', JSON.stringify(input, null, 2))
    
    const limit = await updateLimit(input)
    console.log('Updated limit successfully:', limit.id)
    return res.json(ok(limit))
  } catch (e: any) {
    console.error('=== UPDATE LIMIT ERROR ===')
    console.error('Error name:', e.name)
    console.error('Error message:', e.message)
    console.error('Error code:', e.code)
    console.error('Error stack:', e.stack)
    console.error('Full error:', e)
    console.error('========================')
    
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_LIMIT', 'Limit already exists for this combination'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update limit'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Limit ID is required'))
    }
    
    await deleteLimit(id)
    return res.json(ok({ message: 'Limit deleted successfully' }))
  } catch (e: any) {
    if (e.code === 'P2003') {
      return res.status(400).json(fail('CONSTRAINT_ERROR', 'Cannot delete limit that is being used'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete limit'))
  }
}