import { prisma } from '../config/db'
import type { CreateWestgardRuleInput, UpdateWestgardRuleInput } from '../libs/types/westgard-rule'

export async function getWestgardRuleById(id: string) {
  return prisma.westgardRule.findUnique({ where: { id } })
}

export async function getWestgardRuleByCode(code: string) {
  return prisma.westgardRule.findUnique({ where: { code } })
}

export async function listWestgardRules(params: { 
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
    where.OR = [
      { code: { contains: params.search } },
      { name: { contains: params.search } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.westgardRule.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { orderIndex: 'asc' } 
    }),
    prisma.westgardRule.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createWestgardRule(input: CreateWestgardRuleInput) {
  return prisma.westgardRule.create({ data: input })
}

export async function updateWestgardRule(input: UpdateWestgardRuleInput) {
  const { id, ...data } = input
  return prisma.westgardRule.update({ where: { id }, data })
}

export async function deleteWestgardRule(id: string) {
  return prisma.westgardRule.delete({ where: { id } })
}







