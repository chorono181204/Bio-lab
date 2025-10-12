import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { parsePagination } from '../libs/utils/pagination'
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser
} from '../services/user.service'

export async function list(req: Request, res: Response) {
  try {
    const pagination = parsePagination(req.query)
    const search = req.query.search as string
    const departmentId = req.query.departmentId as string
    
    const result = await listUsers({
      ...pagination,
      search,
      departmentId
    })
    
    return res.json(ok(result))
  } catch (e) {
    return res.status(500).json(fail('LIST_ERROR', 'Failed to list users'))
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    }
    const user = await getUserById(id)
    
    if (!user) {
      return res.status(404).json(fail('NOT_FOUND', 'User not found'))
    }
    
    // Remove password from response
    const { password, ...safeUser } = user as any
    return res.json(ok(safeUser))
  } catch (e) {
    return res.status(500).json(fail('GET_ERROR', 'Failed to get user'))
  }
}

export async function create(req: Request, res: Response) {
  try {
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; role?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName 
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    
    // Admin/Manager can create users in any department, regular users can only create in their department
    const isAdminOrManager = user.role === 'admin' || user.role === 'manager'
    const input = {
      ...req.body,
      createdBy: userFullName,
      // Only apply department scope for non-admin/manager users
      ...(isAdminOrManager ? {} : { departmentId: user.departmentId })
    }
    
    const newUser = await createUser(input)
    // Remove password from response
    const { password, ...safeUser } = newUser as any
    return res.status(201).json(ok(safeUser))
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_USERNAME', 'Username already exists'))
    }
    return res.status(500).json(fail('CREATE_ERROR', 'Failed to create user'))
  }
}

export async function update(req: Request, res: Response) {
  try {
    console.log('👤 Update user - Request received:', { 
      id: req.params.id, 
      user: (req as any).user,
      body: req.body 
    })
    const { id } = req.params
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; role?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName 
    if (!userId) {
      console.log('❌ Update user - No user ID in request')
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    
   
    const isAdminOrManager = user.role === 'admin' || user.role === 'manager'
    const input = {
      ...req.body,
      id,
      updatedBy: userFullName,
 
      ...(isAdminOrManager ? {} : { departmentId: user.departmentId })
    }
    
    console.log('👤 Updating user:', { id, input })
    const updatedUser = await updateUser(input)
    console.log('👤 User updated successfully:', updatedUser.id)
    
    // Remove password from response
    const { password, ...safeUser } = updatedUser as any
    return res.json(ok(safeUser))
  } catch (e: any) {
    console.error('❌ User update error:', e)
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'User not found'))
    }
    if (e.code === 'P2002') {
      return res.status(400).json(fail('DUPLICATE_USERNAME', 'Username already exists'))
    }
    return res.status(500).json(fail('UPDATE_ERROR', `Failed to update user: ${e.message}`))
  }
}

export async function changeUserPassword(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    const user = (req as any).user as { sub?: string; id?: string; fullName?: string; role?: string; departmentId?: string }
    const userId = user?.sub || user?.id
    const userFullName = user?.fullName 
    
    if (!userId) {
      return res.status(401).json(fail('UNAUTHORIZED', 'User not authenticated'))
    }
    
    // Admin/Manager can change password for any user, regular users can only change for users in their department
    const isAdminOrManager = user.role === 'admin' || user.role === 'manager'
    
    if (!newPassword) {
      return res.status(400).json(fail('VALIDATION_ERROR', 'New password is required'))
    }
    
    const updatedUser = await changePassword(id, newPassword, userFullName)
    // Remove password from response
    const { password, ...safeUser } = updatedUser as any
    return res.json(ok(safeUser))
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'User not found'))
    }
    return res.status(500).json(fail('PASSWORD_CHANGE_ERROR', 'Failed to change password'))
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json(fail('INVALID_ID', 'ID is required'))
    }
    await deleteUser(id)
    return res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'User not found'))
    }
    return res.status(500).json(fail('DELETE_ERROR', 'Failed to delete user'))
  }
}
