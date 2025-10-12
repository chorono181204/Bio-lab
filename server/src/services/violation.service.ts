import { prisma } from '../config/db'
import type { CreateViolationInput, UpdateViolationInput } from '../libs/types/violation'

export async function getViolationById(id: string) {
  return prisma.violation.findUnique({ 
    where: { id },
    include: {
      analyte: { select: { id: true, code: true, name: true } },
      lot: { select: { id: true, code: true, lotName: true } },
      qcLevel: { select: { id: true, name: true } },
      machine: { select: { id: true, deviceCode: true, name: true } },
      rule: { select: { id: true, code: true, name: true, severity: true } }
    }
  })
}

export async function listViolations(params: { 
  page?: number
  pageSize?: number
  analyteId?: string
  lotId?: string
  qcLevelId?: string
  machineId?: string
  ruleId?: string
  status?: string
  departmentId?: string | null
}) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20))
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  if (params.departmentId) where.departmentId = params.departmentId
  if (params.analyteId) where.analyteId = params.analyteId
  if (params.lotId) where.lotId = params.lotId
  if (params.qcLevelId) where.qcLevelId = params.qcLevelId
  if (params.machineId) where.machineId = params.machineId
  if (params.ruleId) where.ruleId = params.ruleId
  if (params.status) where.status = params.status

  const [items, total] = await Promise.all([
    prisma.violation.findMany({ 
      where, 
      skip, 
      take: pageSize, 
      orderBy: { createdAt: 'desc' },
      include: {
        analyte: { select: { id: true, code: true, name: true } },
        lot: { select: { id: true, code: true, lotName: true } },
        qcLevel: { select: { id: true, name: true } },
        machine: { select: { id: true, deviceCode: true, name: true } },
        rule: { select: { id: true, code: true, name: true, severity: true } }
      }
    }),
    prisma.violation.count({ where })
  ])

  return { items, total, page, pageSize }
}

export async function createViolation(input: CreateViolationInput) {
  return prisma.violation.create({ 
    data: input,
    include: {
      analyte: { select: { id: true, code: true, name: true } },
      lot: { select: { id: true, code: true, lotName: true } },
      qcLevel: { select: { id: true, name: true } },
      machine: { select: { id: true, deviceCode: true, name: true } },
      rule: { select: { id: true, code: true, name: true, severity: true } }
    }
  })
}

export async function updateViolation(input: UpdateViolationInput) {
  const { id, ...data } = input
  return prisma.violation.update({ 
    where: { id }, 
    data,
    include: {
      analyte: { select: { id: true, code: true, name: true } },
      lot: { select: { id: true, code: true, lotName: true } },
      qcLevel: { select: { id: true, name: true } },
      machine: { select: { id: true, deviceCode: true, name: true } },
      rule: { select: { id: true, code: true, name: true, severity: true } }
    }
  })
}

export async function deleteViolation(id: string) {
  return prisma.violation.delete({ where: { id } })
}







