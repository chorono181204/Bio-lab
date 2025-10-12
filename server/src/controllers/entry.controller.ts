import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  getEntryById,
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry
} from '../services/entry.service'

export async function list(req: Request, res: Response) {
  try {
    console.log('=== LIST ENTRIES DEBUG ===')
    console.log('Query params:', req.query)
    
    const options = req.query.options === 'true'
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const analyteId = req.query.analyteId as string
    const lotId = req.query.lotId as string
    const machineId = req.query.machineId as string
    const qcLevelId = req.query.qcLevelId as string
    const dateFrom = req.query.dateFrom as string
    const dateTo = req.query.dateTo as string
    const where = withDept({}, req)
    
    console.log('=== FILTER PARAMS ===')
    console.log('lotId:', lotId)
    console.log('machineId:', machineId)
    console.log('qcLevelId:', qcLevelId)
    console.log('analyteId:', analyteId)
    console.log('dateFrom:', dateFrom)
    console.log('dateTo:', dateTo)
    console.log('search:', search)
    console.log('departmentId:', where.departmentId)
    
    const result = await listEntries({
      ...pagination,
      search,
      analyteId,
      lotId,
      machineId,
      qcLevelId,
      dateFrom,
      dateTo,
      departmentId: where.departmentId,
      options
    })
    
    console.log('=== RESULT ===')
    console.log('Total items:', result.total)
    console.log('Items count:', result.items?.length || 0)
    console.log('First item:', result.items?.[0] ? JSON.stringify(result.items[0], null, 2) : 'No items')
    return res.json(ok(result))
  } catch (e) {
    console.error('List entries error:', e)
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list entries'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('MISSING_ID', 'Entry ID is required'))
    }
    
    const entry = await getEntryById(id)
    if (!entry) {
      return res.status(404).json(fail('NOT_FOUND', 'Entry not found'))
    }
    
    return res.json(ok(entry))
  } catch (e) {
    console.error('Get entry by ID error:', e)
    return res.status(500).json(fail('GET_ERROR', 'Failed to get entry'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    console.log('=== CREATE ENTRY DEBUG ===')
    console.log('Body:', req.body)
    
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName
    const departmentId = user?.departmentId
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    
    const input = {
      ...req.body,
      createdBy: userFullName,
      departmentId
    }
    
    const entry = await createEntry(input)
    console.log('Created entry:', JSON.stringify(entry, null, 2))
    
    return res.status(201).json(ok(entry))
  } catch (e) {
    console.error('Create entry error:', e)
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create entry'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('MISSING_ID', 'Entry ID is required'))
    }
    
    console.log('=== UPDATE ENTRY DEBUG ===')
    console.log('ID:', id)
    console.log('Body:', req.body)
    
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName
    const departmentId = user?.departmentId
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    
    const input = {
      ...req.body,
      id,
      updatedBy: userFullName,
      departmentId
    }
    
    console.log('=== UPDATE INPUT DEBUG ===')
    console.log('Input to updateEntry:', JSON.stringify(input, null, 2))
    console.log('userFullName:', userFullName)
    console.log('departmentId:', departmentId)
    
    const entry = await updateEntry(input)
    console.log('Updated entry:', JSON.stringify(entry, null, 2))
    
    return res.json(ok(entry))
  } catch (e) {
    console.error('Update entry error:', e)
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update entry'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('MISSING_ID', 'Entry ID is required'))
    }
    
    await deleteEntry(id)
    return res.json(ok(null))
  } catch (e) {
    console.error('Delete entry error:', e)
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete entry'))
  }
}