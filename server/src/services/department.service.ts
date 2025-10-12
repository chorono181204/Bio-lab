import { prisma } from '../config/db'
import type { CreateDepartmentInput, UpdateDepartmentInput } from '../libs/types/department'

export async function getDepartmentById(id: string) {
  return prisma.department.findUnique({ where: { id } })
}

export async function getDepartmentByCode(code: string) {
  return prisma.department.findUnique({ where: { code } })
}

export async function listDepartments(params: { 
  page?: number
  pageSize?: number
  search?: string
}) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  if (params.search) {
    where.OR = [
      { code: { contains: params.search } },
      { name: { contains: params.search } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.department.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.department.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createDepartment(input: CreateDepartmentInput) {
  return prisma.department.create({ data: input })
}

export async function updateDepartment(input: UpdateDepartmentInput) {
  const { id, ...data } = input
  return prisma.department.update({ where: { id }, data })
}

export async function deleteDepartment(id: string) {
  return prisma.department.delete({ where: { id } })
}







