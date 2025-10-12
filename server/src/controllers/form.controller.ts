import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { getForms, getFormById, createForm, updateForm, deleteForm } from '../services/form.service'

export async function getAll(req: Request, res: Response) {
  try {
    const { search, departmentId, options } = req.query
    const user = (req as any).user as { departmentId?: string }
    
    const filters = {
      search: search as string,
      departmentId: (departmentId as string) || user.departmentId,
      options: options === 'true'
    }
    
    const result = await getForms(filters)
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get forms'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Form ID is required'))
    }
    
    const form = await getFormById(id)
    if (!form) {
      return res.status(404).json(fail('NOT_FOUND', 'Form not found'))
    }
    
    return res.json(ok(form))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get form'))
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
      createdBy: userFullName,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined
    }
    
    const form = await createForm(input)
    return res.status(201).json(ok(form))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Form code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create form'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Form ID is required'))
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
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined
    }
    
    const form = await updateForm(id, input)
    return res.json(ok(form))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Form not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Form code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update form'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'Form ID is required'))
    }
    
    await deleteForm(id)
    return res.json(ok({ message: 'Form deleted successfully' }))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Form not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete form'))
  }
}




