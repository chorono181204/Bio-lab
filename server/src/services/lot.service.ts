import { prisma } from '../config/db'
import type { CreateLotInput, UpdateLotInput } from '../libs/types/lot'

export async function getLotById(id: string) {
  return prisma.lot.findUnique({ 
    where: { id },
    include: {
      machines: {
        select: { id: true, deviceCode: true, name: true }
      }
    }
  })
}

export async function getLotByCode(code: string) {
  return prisma.lot.findUnique({ where: { code } })
}

export async function listLots(params: { 
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string | null
  status?: string
  receivedDateFrom?: string
  receivedDateTo?: string
  options?: boolean
}) {
  const where: any = {}
  if (params.departmentId) where.departmentId = params.departmentId
  
  // Search filter
  if (params.search) {
    where.OR = [
      { code: { contains: params.search } },
      { lotName: { contains: params.search } }
    ]
  }
  
  // Status filter
  if (params.status) {
    where.status = params.status
  }
  
  // Received date range filter
  if (params.receivedDateFrom || params.receivedDateTo) {
    where.receivedDate = {}
    if (params.receivedDateFrom) {
      where.receivedDate.gte = params.receivedDateFrom
    }
    if (params.receivedDateTo) {
      where.receivedDate.lte = params.receivedDateTo
    }
  }

  // Options mode: return slim array for dropdowns (FE will sort)
  if (params.options) {
    const items = await prisma.lot.findMany({ 
      where,
      select: { id: true, code: true, lotName: true },
      orderBy: { id: 'asc' }
    })
    return items
  }

  // Regular pagination mode
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.lot.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' },
      include: {
        machines: {
          select: { id: true, deviceCode: true, name: true }
        }
      }
    }),
    prisma.lot.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function getMachinesByLotId(lotId: string) {
  // Get machines linked to this lot via Prisma relation
  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: {
      machines: {
        select: {
          id: true,
          deviceCode: true,
          name: true
        }
      }
    }
  })
  
  return lot?.machines.map(machine => ({
    id: machine.id,
    deviceCode: machine.deviceCode,
    name: machine.name,
    label: `${machine.deviceCode} - ${machine.name}`
  })) || []
}

export async function getQcLevelsByLotId(lotId: string) {
  // Get QC levels linked to this lot via Prisma relation
  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: {
      qcLevels: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  
  return lot?.qcLevels.map(qcLevel => ({
    id: qcLevel.id,
    name: qcLevel.name
  })) || []
}

export async function createLot(input: CreateLotInput) {
  const { machineIds, ...data } = input as any
  return prisma.lot.create({ 
    data: {
      ...data,
      machines: machineIds ? {
        connect: machineIds.map((id: string) => ({ id }))
      } : undefined
    },
    include: {
      machines: {
        select: { id: true, deviceCode: true, name: true }
      }
    }
  })
}

export async function updateLot(input: UpdateLotInput) {
  const { id, machineIds, ...data } = input as any
  return prisma.lot.update({ 
    where: { id }, 
    data: {
      ...data,
      machines: machineIds ? {
        set: machineIds.map((id: string) => ({ id }))
      } : undefined
    },
    include: {
      machines: {
        select: { id: true, deviceCode: true, name: true }
      }
    }
  })
}

export async function deleteLot(id: string) {
  return prisma.lot.delete({ where: { id } })
}
