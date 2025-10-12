import { prisma } from '../config/db'
import type { CreateBiasMethodInput, UpdateBiasMethodInput } from '../libs/types/bias-method'

export async function getBiasMethodById(id: string) {
  return prisma.biasMethod.findUnique({ where: { id } })
}

export async function getBiasMethodByName(name: string) {
  return prisma.biasMethod.findUnique({ where: { name } })
}

export async function listBiasMethods(params: { 
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string | null
}) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  if (params.departmentId) where.departmentId = params.departmentId
  if (params.search) {
    where.name = { contains: params.search }
  }

  const [items, total] = await Promise.all([
    prisma.biasMethod.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.biasMethod.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createBiasMethod(input: CreateBiasMethodInput) {
  return prisma.biasMethod.create({ data: input })
}

export async function updateBiasMethod(input: UpdateBiasMethodInput) {
  const { id, ...data } = input
  return prisma.biasMethod.update({ where: { id }, data })
}

export async function deleteBiasMethod(id: string) {
  return prisma.biasMethod.delete({ where: { id } })
}







