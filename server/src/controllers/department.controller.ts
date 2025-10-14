import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import { withDept } from '../middleware/scopeDepartment'
import {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../services/department.service'

export async function list(req: Request, res: Response) {
  try {
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const user = (req as any).user as { role?: string; departmentId?: string }
    
    let departmentId = null
    // Admin xem tất cả, Manager chỉ xem khoa của mình
    if (user.role === 'manager') {
      departmentId = user.departmentId
    }
    
    const result = await listDepartments({
      ...pagination,
      search,
      departmentId
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list departments'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const department = await getDepartmentById(id)
    
    if (!department) {
      return res.status(404).json(fail('NOT_FOUND', 'Department not found'))
    }
    
    return res.json(ok(department))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get department'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    const input = {
      ...req.body,
      createdBy: userFullName
    }
    
    const department = await createDepartment(input)
    return res.status(201).json(ok(department))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Department code already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create department'))
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
    
    console.log('=== DEPARTMENT UPDATE BACKEND ===')
    console.log('Request body:', req.body)
    console.log('Input:', input)
    console.log('User:', userFullName)
    
    const department = await updateDepartment(input)
    console.log('Updated department:', department)
    return res.json(ok(department))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Department not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_CODE', 'Department code already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', 'Failed to update department'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteDepartment(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Department not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete department'))
  }
}
