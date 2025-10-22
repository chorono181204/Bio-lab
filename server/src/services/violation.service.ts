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
  dateFrom?: string
  dateTo?: string
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
  
  // Date filtering
  if (params.dateFrom || params.dateTo) {
    where.entryDate = {}
    if (params.dateFrom) {
      where.entryDate.gte = new Date(params.dateFrom)
    }
    if (params.dateTo) {
      where.entryDate.lte = new Date(params.dateTo)
    }
  }

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

// Delete all violations for a specific entry
export async function deleteViolationsForEntry(entryId: string) {
  return prisma.violation.deleteMany({
    where: { entryId }
  })
}

// Re-evaluate violations for an entry (delete old ones and create new ones)
export async function reevaluateViolationsForEntry(entryData: {
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  entryId: string
  entryDate: Date
  value: number
  createdBy?: string
  departmentId?: string | null
}) {
  // First delete existing violations for this entry
  await deleteViolationsForEntry(entryData.entryId)
  
  // Then create new violations based on current value
  return createViolationsForEntry(entryData)
}

// Auto-create violations when adding new entry
export async function createViolationsForEntry(entryData: {
  analyteId: string
  lotId: string
  qcLevelId: string
  machineId: string
  entryId: string
  entryDate: Date
  value: number
  createdBy?: string
  departmentId?: string | null
}) {
  console.log('=== CREATE VIOLATIONS FOR ENTRY START ===')
  console.log('Entry data:', JSON.stringify(entryData, null, 2))
  
  try {
    // Get limits for this entry
    console.log('Looking for limits...')
    const limit = await prisma.limit.findFirst({
      where: {
        analyteId: entryData.analyteId,
        lotId: entryData.lotId,
        qcLevelId: entryData.qcLevelId,
        machineId: entryData.machineId
      }
    })

    if (!limit) {
      console.log('No limits found for entry, skipping violation evaluation')
      return []
    }

    console.log('Found limit:', JSON.stringify(limit, null, 2))

    // Get Westgard rules for this QC level
    console.log('Looking for Westgard rules for QC level:', entryData.qcLevelId)
    console.log('Entry department ID:', entryData.departmentId)
    
    // Let's also check the QC level details
    const qcLevel = await prisma.qcLevel.findUnique({
      where: { id: entryData.qcLevelId },
      include: {
        westgardRules: {
          select: { id: true, code: true, departmentId: true }
        }
      }
    })
    console.log('QC Level details:', qcLevel ? {
      id: qcLevel.id,
      name: qcLevel.name,
      departmentId: qcLevel.departmentId,
      westgardRules: qcLevel.westgardRules
    } : 'Not found')
    
    // First, let's see all Westgard rules
    const allWestgardRules = await prisma.westgardRule.findMany({
      include: {
        qcLevels: {
          select: { id: true, name: true }
        }
      }
    })
    console.log('All Westgard rules in database:', allWestgardRules.length)
    console.log('All Westgard rules with QC levels:', allWestgardRules.map(r => ({ 
      id: r.id, 
      code: r.code, 
      departmentId: r.departmentId,
      qcLevels: r.qcLevels.map(qc => ({ id: qc.id, name: qc.name }))
    })))
    
    const westgardRules = await prisma.westgardRule.findMany({
      where: {
        qcLevels: {
          some: {
            id: entryData.qcLevelId
          }
        }
      }
    })

    console.log('Found Westgard rules for QC level:', westgardRules.length)
    console.log('Westgard rules for QC level:', westgardRules.map(r => ({ id: r.id, code: r.code })))

    if (westgardRules.length === 0) {
      console.log('No Westgard rules found for QC level, skipping violation evaluation')
      return []
    }

    const violations: Array<{ analyteId: string; lotId: string; qcLevelId: string; machineId: string; entryId: string; entryDate: Date; ruleId: string; content: string; status: string; createdBy: string | null }> = []
    const { mean, sd } = limit
    const value = entryData.value

    // Resolve names for content message
    const [analyteObj, qcLevelObj] = await Promise.all([
      prisma.analyte.findUnique({ where: { id: entryData.analyteId }, select: { code: true, name: true } }),
      prisma.qcLevel.findUnique({ where: { id: entryData.qcLevelId }, select: { name: true } })
    ])
    // Hiển thị tên xét nghiệm (ví dụ: Ure, Amin), ưu tiên name rồi mới tới code
    const analyteLabel = analyteObj?.name || analyteObj?.code || ''
    const qcLevelLabel = qcLevelObj?.name || ''
    const d = entryData.entryDate
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dateLabel = `${dd}/${mm}`

    // Helper to find rule by code
    const getRuleByCode = (code: string) => westgardRules.find(r => r.code === code)

    // Load recent entries (including current) for sequence-based rules
    const recentEntriesDesc = await prisma.entry.findMany({
      where: {
        analyteId: entryData.analyteId,
        lotId: entryData.lotId,
        qcLevelId: entryData.qcLevelId,
        machineId: entryData.machineId,
        ...(entryData.departmentId ? { departmentId: entryData.departmentId } : {}),
        entryDate: { lte: entryData.entryDate }
      },
      // get the latest 20 points
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      take: 20
    })
    const recentEntries = [...recentEntriesDesc].reverse()
    console.log('[WG] Sequence size for evaluation:', recentEntries.length)

    // Build Z-scores (value in SD units)
    const zs = recentEntries.map(e => sd !== 0 ? (Number(e.value) - mean) / sd : 0)
    const signs = zs.map(z => (z >= 0 ? 1 : -1))

    // Helper: check if all numbers have same sign as the first element
    const sameSideArr = (arr: number[]) => arr.length > 0 && arr.every(z => Math.sign(z) === Math.sign(arr[0]!))

    // Rule priority hierarchy (higher number = higher priority)
    const rulePriority: Record<string, number> = {
      '1-3s': 6,    // Highest priority - Critical
      '2-2s': 5,    // Critical
      'R-4s': 4,    // Critical
      '1-2s': 3,    // Warning
      '2-3s': 2,    // Warning
      '4-1s': 1,    // Warning
      '10x': 0      // Lowest priority - Warning
    }

    // Evaluate each Westgard rule and collect violations
    const ruleViolations: Array<{ rule: any; content: string; priority: number }> = []

    for (const rule of westgardRules) {
      let violated = false
      let content = ''

      switch (rule.code) {
        case '1-2s':
          if (Math.abs(value - mean) > 2 * sd) {
            violated = true
            content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc 1-2s`
          }
          break

        case '1-3s':
          if (Math.abs(value - mean) > 3 * sd) {
            violated = true
            content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc 1-3s`
          }
          break

        case '2-3s': {
          // Two of the last three results exceed 2SD on the same side
          if (zs.length >= 3) {
            const last3 = zs.slice(-3)
            const beyond2 = last3.map(z => Math.abs(z) > 2)
            // Count how many exceed 2SD, must be at least 2 and same side among those
            const indices = last3.map((z, i) => ({ z, i })).filter(o => Math.abs(o.z) > 2)
            if (indices.length >= 2) {
              const zSel = indices.map(o => o.z)
              if (sameSideArr(zSel)) {
                violated = true
                content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc 2-3s`
              }
            }
          }
          break
        }

        case '2-2s': {
          // Two consecutive results exceed 2SD on same side
          if (zs.length >= 2) {
            const z1 = zs[zs.length - 1]!
            const z0 = zs[zs.length - 2]!
            if (Math.abs(z1) > 2 && Math.abs(z0) > 2 && Math.sign(z1) === Math.sign(z0)) {
              violated = true
              content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc 2-2s`
            }
          }
          break
        }

        case 'R-4s': {
          // Two consecutive results differ by at least 4SD
          if (zs.length >= 2) {
            const z1 = zs[zs.length - 1]!
            const z0 = zs[zs.length - 2]!
            if (Math.abs(z1 - z0) >= 4) {
              violated = true
              content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc R-4s`
            }
          }
          break
        }

        case '4-1s': {
          // Four consecutive results exceed 1SD on the same side
          if (zs.length >= 4) {
            const last4 = zs.slice(-4)
            const allBeyond1 = last4.every(z => Math.abs(z) > 1)
            const sameSideOk = sameSideArr(last4)
            if (allBeyond1 && sameSideOk) {
              violated = true
              content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc 4-1s`
            }
          }
          break
        }

        case '10x': {
          // Ten consecutive results on the same side of mean
          if (zs.length >= 10) {
            const last10 = zs.slice(-10)
            const sameSideOk = sameSideArr(last10)
            if (sameSideOk) {
              violated = true
              content = `Ngày ${dateLabel}, xét nghiệm ${analyteLabel}: ${qcLevelLabel} vi phạm nguyên tắc 10x`
            }
          }
          break
        }

        default:
          console.log(`Unknown Westgard rule: ${rule.code}`)
      }

      if (violated) {
        const priority = rulePriority[rule.code] || 0
        ruleViolations.push({
          rule,
          content,
          priority
        })
      }
    }

    // Only create violation for the highest priority rule
    if (ruleViolations.length > 0) {
      // Sort by priority (highest first)
      ruleViolations.sort((a, b) => b.priority - a.priority)
      const highestPriorityViolation = ruleViolations[0]!
      
      violations.push({
        analyteId: entryData.analyteId,
        lotId: entryData.lotId,
        qcLevelId: entryData.qcLevelId,
        machineId: entryData.machineId,
        entryId: entryData.entryId,
        entryDate: entryData.entryDate,
        ruleId: highestPriorityViolation.rule.id,
        content: highestPriorityViolation.content,
        status: 'pending',
        createdBy: entryData.createdBy ?? null
      })
      
      console.log(`Selected highest priority violation: ${highestPriorityViolation.rule.code} (priority: ${highestPriorityViolation.priority})`)
      console.log(`Total violations found: ${ruleViolations.length}, created: 1`)
    }

    console.log('Evaluated violations:', violations.length)

    // Create violations if any
    if (violations.length > 0) {
      console.log('Creating violations in database...')
      // Attach department if available
      const dataToCreate = violations.map(v => ({
        ...v,
        ...(entryData.departmentId ? { departmentId: entryData.departmentId } : {})
      }))
      const createdViolations = await prisma.violation.createMany({
        data: dataToCreate as any
      })
      console.log(`Created ${createdViolations.count} violations for entry`)
      console.log('=== CREATE VIOLATIONS FOR ENTRY SUCCESS ===')
      return violations
    }

    console.log('No violations found, skipping creation')
    console.log('=== CREATE VIOLATIONS FOR ENTRY SUCCESS ===')
    return []
  } catch (error) {
    console.error('=== CREATE VIOLATIONS FOR ENTRY ERROR ===')
    if (error instanceof Error) {
      console.error('Error creating violations for entry:', error.message)
      console.error('Error name:', error.name)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error creating violations:', error)
    }
    console.error('=========================================')
    return []
  }
}







