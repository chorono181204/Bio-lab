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
  // Process date fields
  const processedInput = {
    ...input,
    inputDate: input.inputDate ? new Date(input.inputDate) : undefined,
    exp: input.exp ? new Date(input.exp) : undefined,
  }
  
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
    update: processedInput,
    create: processedInput,
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
  
  // Process date fields
  const processedData = {
    ...data,
    inputDate: data.inputDate ? new Date(data.inputDate) : undefined,
    exp: data.exp ? new Date(data.exp) : undefined,
  }
  
  try {
    // Normal update first
    return await prisma.limit.update({ 
      where: { id }, 
      data: processedData,
      include: {
        analyte: { select: { id: true, code: true, name: true } },
        lot: { select: { id: true, code: true, lotName: true } },
        qcLevel: { select: { id: true, name: true } },
        machine: { select: { id: true, deviceCode: true, name: true } },
        biasMethod: { select: { id: true, name: true } }
      }
    })
  } catch (err: any) {
    // Handle unique collision when changing composite key to an existing one
    if (err?.code === 'P2002' && processedData.analyteId && processedData.lotId && processedData.qcLevelId && processedData.machineId) {
      const existing = await prisma.limit.findUnique({
        where: {
          analyteId_lotId_qcLevelId_machineId: {
            analyteId: processedData.analyteId as string,
            lotId: processedData.lotId as string,
            qcLevelId: processedData.qcLevelId as string,
            machineId: processedData.machineId as string,
          }
        }
      })
      if (existing) {
        // Update the existing record with incoming fields (non-unique fields), then delete the old record
        const { analyteId, lotId, qcLevelId, machineId, ...rest } = processedData as any
        const updated = await prisma.limit.update({
          where: { id: existing.id },
          data: rest,
          include: {
            analyte: { select: { id: true, code: true, name: true } },
            lot: { select: { id: true, code: true, lotName: true } },
            qcLevel: { select: { id: true, name: true } },
            machine: { select: { id: true, deviceCode: true, name: true } },
            biasMethod: { select: { id: true, name: true } }
          }
        })
        if (existing.id !== id) {
          // Best-effort cleanup of the old record
          try { await prisma.limit.delete({ where: { id } }) } catch {}
        }
        return updated
      }
    }
    throw err
  }
}

export async function deleteLimit(id: string) {
  return prisma.limit.delete({ where: { id } })
}