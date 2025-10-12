import { prisma } from '../config/db'
import type { CreateQcLevelInput, UpdateQcLevelInput } from '../libs/types/qcLevel'

export async function getQcLevelById(id: string) {
  return prisma.qcLevel.findUnique({ 
    where: { id },
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function getQcLevelByName(name: string) {
  return prisma.qcLevel.findUnique({ where: { name } })
}

export async function listQcLevels(params: { 
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string | null
  options?: boolean
}) {
  const where: any = {}
  if (params.departmentId) where.departmentId = params.departmentId
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } }
    ]
  }

  // Options mode: return slim array for dropdowns (FE will sort)
  if (params.options) {
    const items = await prisma.qcLevel.findMany({ 
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
    return items
  }

  // Regular pagination mode
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.qcLevel.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.qcLevel.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createQcLevel(input: CreateQcLevelInput) {
  return prisma.qcLevel.create({ 
    data: input,
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function updateQcLevel(input: UpdateQcLevelInput) {
  const { id, ...data } = input
  return prisma.qcLevel.update({ 
    where: { id }, 
    data,
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function deleteQcLevel(id: string) {
  return prisma.qcLevel.delete({ where: { id } })
}

