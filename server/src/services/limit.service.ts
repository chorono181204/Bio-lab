import { prisma } from '../config/db'
import type { CreateLimitInput, UpdateLimitInput } from '../libs/types/limit'

export async function getLimitById(id: string) {
  return prisma.limit.findUnique({ 
    where: { id },
    include: {
      analyte: {
        select: { id: true, code: true, name: true }
      },
      lot: {
        select: { id: true, code: true, lotName: true }
      },
      qcLevel: {
        select: { id: true, name: true }
      },
      machine: {
        select: { id: true, deviceCode: true, name: true }
      },
      biasMethod: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function listLimits(params: { 
  page?: number
  pageSize?: number
  search?: string
  analyteId?: string
  lotId?: string
  machineId?: string
  qcLevel?: string
  departmentId?: string | null
  options?: boolean
}) {
  const where: any = {}
  
  if (params.departmentId) where.departmentId = params.departmentId
  if (params.analyteId) where.analyteId = params.analyteId
  if (params.lotId) where.lotId = params.lotId
  if (params.machineId) where.machineId = params.machineId
  if (params.qcLevel) {
    where.qcLevelId = params.qcLevel
  }
  
  if (params.search) {
    where.OR = [
      { analyte: { name: { contains: params.search } } },
      { lot: { code: { contains: params.search } } },
      { machine: { name: { contains: params.search } } }
    ]
  }

  // Options mode: return slim array for dropdowns
  if (params.options) {
    const items = await prisma.limit.findMany({ 
      where,
      select: { id: true, mean: true, sd: true },
      orderBy: { createdAt: 'desc' }
    })
    return items
  }

  // Regular pagination mode
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.limit.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' },
      include: {
        analyte: {
          select: { id: true, code: true, name: true }
        },
        lot: {
          select: { id: true, code: true, lotName: true }
        },
        qcLevel: {
          select: { id: true, name: true }
        },
        machine: {
          select: { id: true, deviceCode: true, name: true }
        },
        biasMethod: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.limit.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createLimit(input: CreateLimitInput) {
  // Use upsert to avoid unique constraint errors
  return prisma.limit.upsert({
    where: {
      analyteId_lotId_qcLevelId_machineId: {
        analyteId: input.analyteId,
        lotId: input.lotId,
        qcLevelId: input.qcLevelId,
        machineId: input.machineId
      }
    },
    update: input,
    create: input,
    include: {
      analyte: {
        select: { id: true, code: true, name: true }
      },
      lot: {
        select: { id: true, code: true, lotName: true }
      },
      qcLevel: {
        select: { id: true, name: true }
      },
      machine: {
        select: { id: true, deviceCode: true, name: true }
      },
      biasMethod: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function updateLimit(input: UpdateLimitInput) {
  const { id, ...data } = input
  return prisma.limit.update({ 
    where: { id }, 
    data,
    include: {
      analyte: {
        select: { id: true, code: true, name: true }
      },
      lot: {
        select: { id: true, code: true, lotName: true }
      },
      qcLevel: {
        select: { id: true, name: true }
      },
      machine: {
        select: { id: true, deviceCode: true, name: true }
      },
      biasMethod: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function deleteLimit(id: string) {
  return prisma.limit.delete({ where: { id } })
}