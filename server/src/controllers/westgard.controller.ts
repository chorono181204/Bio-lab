import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import * as westgardService from '../services/westgard.service'
import { withDept } from '../middleware/scopeDepartment'

export async function list(req: Request, res: Response) {
  try {
    console.log('=== LIST WESTGARD RULES ===')
    console.log('Query params:', req.query)
    
    const where = withDept({}, req)
    
    const result = await westgardService.listWestgardRules({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
      search: req.query.search as string,
      severity: req.query.severity as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      qcLevelId: req.query.qcLevelId as string,
      departmentId: where.departmentId
    })
    
    console.log('Westgard rules result:', result)
    
    return res.json(ok(result))
  } catch (e) {
    console.error('List westgard rules error:', e)
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list westgard rules'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('MISSING_ID', 'Rule ID is required'))
    }

    console.log('=== GET WESTGARD RULE BY ID ===')
    console.log('ID:', id)

    const rule = await westgardService.getWestgardRuleById(id)
    if (!rule) {
      return res.status(404).json(fail('NOT_FOUND', 'Westgard rule not found'))
    }

    console.log('Westgard rule:', rule)

    return res.json(ok(rule))
  } catch (e) {
    console.error('Get westgard rule error:', e)
    return res.status(500).json(fail('GET_ERROR', 'Failed to get westgard rule'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    console.log('=== CREATE WESTGARD RULE ===')
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
    
    const rule = await westgardService.createWestgardRule(input)
    console.log('Created westgard rule:', JSON.stringify(rule, null, 2))
    
    return res.status(201).json(ok(rule))
  } catch (e) {
    console.error('Create westgard rule error:', e)
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Rule code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create westgard rule'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('MISSING_ID', 'Rule ID is required'))
    }
    
    console.log('=== UPDATE WESTGARD RULE ===')
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
    console.log('Input to updateWestgardRule:', JSON.stringify(input, null, 2))
    console.log('userFullName:', userFullName)
    console.log('departmentId:', departmentId)
    
    const rule = await westgardService.updateWestgardRule(input)
    console.log('Updated westgard rule:', JSON.stringify(rule, null, 2))
    
    return res.json(ok(rule))
  } catch (e) {
    console.error('Update westgard rule error:', e)
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Rule code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update westgard rule'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('MISSING_ID', 'Rule ID is required'))
    }

    console.log('=== DELETE WESTGARD RULE ===')
    console.log('ID:', id)

    await westgardService.deleteWestgardRule(id)
    console.log('Deleted westgard rule:', id)

    return res.json(ok({ success: true }))
  } catch (e) {
    console.error('Delete westgard rule error:', e)
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete westgard rule'))
  }
}

export async function getOptions(req: Request, res: Response) {
  try {
    console.log('=== GET WESTGARD RULE OPTIONS ===')
    
    const options = await westgardService.getWestgardRuleOptions()
    console.log('Westgard rule options:', options)
    
    return res.json(ok(options))
  } catch (e) {
    console.error('Get westgard rule options error:', e)
    return res.status(500).json(fail('OPTIONS_ERROR', 'Failed to get westgard rule options'))
  }
}
