import { prisma } from '../config/db'
import type { CreateMachineInput, UpdateMachineInput } from '../libs/types/machine'

export async function getMachineById(id: string) {
  return prisma.machine.findUnique({ 
    where: { id },
    include: {
      lots: {
        select: { id: true, code: true, lotName: true, expiryDate: true }
      }
    }
  })
}

export async function getMachineByDeviceCode(deviceCode: string) {
  return prisma.machine.findUnique({ where: { deviceCode } })
}

export async function listMachines(params: { 
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string | null
  options?: boolean
  lotId?: string
}) {
  const where: any = {}
  if (params.departmentId) where.departmentId = params.departmentId
  
  // Filter by lot if provided
  if (params.lotId) {
    where.lots = {
      some: { id: params.lotId }
    }
  }
  
  if (params.search) {
    where.OR = [
      { deviceCode: { contains: params.search } },
      { name: { contains: params.search } }
    ]
  }

  // Options mode: return slim array for dropdowns (FE will sort)
  if (params.options) {
    const items = await prisma.machine.findMany({ 
      where,
      select: { id: true, deviceCode: true, name: true },
      orderBy: { id: 'asc' }
    })
    return items.map(m => ({
      id: m.id,
      deviceCode: m.deviceCode,
      name: m.name,
      label: `${m.deviceCode} - ${m.name}`
    }))
  }

  // Regular pagination mode
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.machine.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' },
      include: {
        lots: {
          select: { id: true, code: true, lotName: true, expiryDate: true }
        }
      }
    }),
    prisma.machine.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createMachine(input: CreateMachineInput) {
  const { lotIds, ...data } = input as any
  return prisma.machine.create({ 
    data: {
      ...data,
      lots: lotIds ? {
        connect: lotIds.map((id: string) => ({ id }))
      } : undefined
    },
    include: {
      lots: {
        select: { id: true, code: true, lotName: true, expiryDate: true }
      }
    }
  })
}

export async function updateMachine(input: UpdateMachineInput) {
  const { id, lotIds, ...data } = input as any
  return prisma.machine.update({ 
    where: { id }, 
    data: {
      ...data,
      lots: lotIds ? {
        set: lotIds.map((id: string) => ({ id }))
      } : undefined
    },
    include: {
      lots: {
        select: { id: true, code: true, lotName: true, expiryDate: true }
      }
    }
  })
}

export async function deleteMachine(id: string) {
  return prisma.machine.delete({ where: { id } })
}
