import { prisma } from '../config/db'
import type { CreateEntryInput, UpdateEntryInput, EntryListParams } from '../libs/types/entry'
import { createViolationsForEntry, reevaluateViolationsForEntry, deleteViolationsForEntry } from './violation.service'

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
      select: { id: true, value: true, entryDate: true },
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
  console.log('=== CREATE ENTRY SERVICE START ===')
  console.log('Input:', JSON.stringify(input, null, 2))
  
  const { date, ...restInput } = input
  const entryDate = new Date(date)
  
  console.log('Processed data:', {
    ...restInput,
    entryDate
  })
  
  try {
    // Create entry
    const entry = await prisma.entry.create({ 
      data: {
        ...restInput,
        entryDate
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

    console.log('Entry created successfully:', JSON.stringify(entry, null, 2))

    // Auto-create violations for this entry
    try {
      console.log('Creating violations for entry...')
      const violations = await createViolationsForEntry({
        analyteId: entry.analyteId,
        lotId: entry.lotId,
        qcLevelId: entry.qcLevelId,
        machineId: entry.machineId,
        entryId: entry.id,
        entryDate: entry.entryDate,
        value: entry.value,
        ...(entry.createdBy ? { createdBy: entry.createdBy } : {}),
        departmentId: (entry as any).departmentId || null
      })
      console.log('Violations created:', violations.length)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating violations for entry:', error.message)
      } else {
        console.error('Error creating violations for entry:', error)
      }
      // Don't fail the entry creation if violation creation fails
    }

    console.log('=== CREATE ENTRY SERVICE SUCCESS ===')
    return entry
  } catch (error) {
    console.error('=== CREATE ENTRY SERVICE ERROR ===')
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error name:', error.name)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error:', error)
    }
    console.error('===============================')
    throw error
  }
}

export async function updateEntry(input: UpdateEntryInput) {
  const { id, ...data } = input
  const { date, ...restData } = data
  
  // Get the entry before updating to check if value changed
  const existingEntry = await prisma.entry.findUnique({ where: { id } })
  if (!existingEntry) {
    throw new Error('Entry not found')
  }
  
  const updatedEntry = await prisma.entry.update({ 
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
  
  // Re-evaluate violations if value or date changed
  const valueChanged = restData.value !== undefined && restData.value !== existingEntry.value
  const dateChanged = date && new Date(date).getTime() !== existingEntry.entryDate.getTime()
  
  if (valueChanged || dateChanged) {
    try {
      console.log('Re-evaluating violations for updated entry...')
      await reevaluateViolationsForEntry({
        analyteId: updatedEntry.analyteId,
        lotId: updatedEntry.lotId,
        qcLevelId: updatedEntry.qcLevelId,
        machineId: updatedEntry.machineId,
        entryId: updatedEntry.id,
        entryDate: updatedEntry.entryDate,
        value: updatedEntry.value,
        ...(updatedEntry.updatedBy ? { createdBy: updatedEntry.updatedBy } : {}),
        departmentId: (updatedEntry as any).departmentId || null
      })
      console.log('Violations re-evaluated successfully')
    } catch (error) {
      console.error('Error re-evaluating violations:', error)
      // Don't fail the update if violation re-evaluation fails
    }
  }
  
  return updatedEntry
}

export async function deleteEntry(id: string) {
  // Delete violations first
  await deleteViolationsForEntry(id)
  
  // Then delete the entry
  return prisma.entry.delete({ where: { id } })
}