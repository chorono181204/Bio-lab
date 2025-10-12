import { prisma } from '../config/db'
import { hashPassword } from '../libs/auth/password'
import { UserDTO } from '../libs/types/user'


export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}

export async function listUsers(params: { page?: number; pageSize?: number; search?: string; departmentId?: string | null }) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize
  const where: any = {}
  if (params.departmentId) where.departmentId = params.departmentId
  if (params.search) where.OR = [{ username: { contains: params.search } }, { fullName: { contains: params.search } }]
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ])
  return { items, total, page, pageSize }
}

export async function createUser(input: UserDTO) {
  const password = await hashPassword(input.password)
  return prisma.user.create({ data: { ...input, password } })
}

export async function updateUser(input: UserDTO) {
  const { id, password, departmentId, ...data } = input
  // Only update non-password fields
  const updateData: any = { ...data }
  
  // Only include password if it's provided and not empty
  if (password && password.trim()) {
    updateData.password = await hashPassword(password)
  }
  
  // If departmentId is provided, add it to the update
  if (departmentId) {
    updateData.departmentId = departmentId
  }
  
  return prisma.user.update({ where: { id }, data: updateData })
}

export async function changePassword(id: string, newPassword: string, updatedBy?: string | null) {
  const password = await hashPassword(newPassword)
  return prisma.user.update({ where: { id }, data: { password, updatedBy: updatedBy || null } })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}


