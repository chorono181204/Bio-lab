import { prisma } from '../config/db'
import type { CreateEntryInput, UpdateEntryInput, EntryListParams } from '../libs/types/entry'

export async function getEntryById(id: string) {
  return prisma.entry.findUnique({ 
    where: { id },
    include: {
      analyte: {
        select: { id: true, code: true, name: true }
      },
      machine: {
        select: { id: true, deviceCode: true, name: true }
      },
      qcLevel: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, code: true, lotName: true }
      }
    }
  })
}

export async function listEntries(params: EntryListParams) {
  const where: any = {}
  
  if (params.analyteId) where.analyteId = params.analyteId
  if (params.lotId) where.lotId = params.lotId
  if (params.machineId) where.machineId = params.machineId
  if (params.qcLevelId) where.qcLevelId = params.qcLevelId
  if (params.departmentId) where.departmentId = params.departmentId
  
  if (params.dateFrom || params.dateTo) {
    where.entryDate = {}
    if (params.dateFrom) where.entryDate.gte = new Date(params.dateFrom)
    if (params.dateTo) where.entryDate.lte = new Date(params.dateTo)
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
    const items = await prisma.entry.findMany({ 
      where,
      select: { id: true, value: true, date: true },
      orderBy: { createdAt: 'desc' }
    })
    return items
  }

  // Regular pagination mode
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.entry.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' },
      include: {
        analyte: {
          select: { id: true, code: true, name: true }
        },
        machine: {
          select: { id: true, deviceCode: true, name: true }
        },
        qcLevel: {
          select: { id: true, name: true }
        },
        lot: {
          select: { id: true, code: true, lotName: true }
        }
      }
    }),
    prisma.entry.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createEntry(input: CreateEntryInput) {
  const { date, ...restInput } = input
  return prisma.entry.create({ 
    data: {
      ...restInput,
      entryDate: new Date(date)
    },
    include: {
      analyte: {
        select: { id: true, code: true, name: true }
      },
      machine: {
        select: { id: true, deviceCode: true, name: true }
      },
      qcLevel: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, code: true, lotName: true }
      }
    }
  })
}

export async function updateEntry(input: UpdateEntryInput) {
  const { id, ...data } = input
  const { date, ...restData } = data
  return prisma.entry.update({ 
    where: { id }, 
    data: {
      ...restData,
      ...(date && { entryDate: new Date(date) })
    },
    include: {
      analyte: {
        select: { id: true, code: true, name: true }
      },
      machine: {
        select: { id: true, deviceCode: true, name: true }
      },
      qcLevel: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, code: true, lotName: true }
      }
    }
  })
}

export async function deleteEntry(id: string) {
  return prisma.entry.delete({ where: { id } })
}