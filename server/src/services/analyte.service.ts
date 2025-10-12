import { prisma } from '../config/db'
import type { CreateAnalyteInput, UpdateAnalyteInput } from '../libs/types/analyte'

export async function getAnalyteById(id: string) {
  return prisma.analyte.findUnique({ where: { id } })
}

export async function getAnalyteByCode(code: string) {
  return prisma.analyte.findUnique({ where: { code } })
}

export async function listAnalytes(params: { 
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
      { code: { contains: params.search } },
      { name: { contains: params.search } }
    ]
  }

  // Options mode: return slim array for dropdowns (FE will sort)
  if (params.options) {
    const items = await prisma.analyte.findMany({ 
      where,
      select: { id: true, code: true, name: true },
      orderBy: { id: 'asc' }
    })
    return items
  }

  // Regular pagination mode
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.analyte.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.analyte.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createAnalyte(input: CreateAnalyteInput) {
  return prisma.analyte.create({ data: input })
}

export async function updateAnalyte(input: UpdateAnalyteInput) {
  const { id, ...data } = input
  return prisma.analyte.update({ where: { id }, data })
}

export async function deleteAnalyte(id: string) {
  return prisma.analyte.delete({ where: { id } })
}
