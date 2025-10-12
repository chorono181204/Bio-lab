import { PrismaClient } from '@prisma/client'
import { WestgardRule, CreateWestgardRuleInput, UpdateWestgardRuleInput, WestgardRuleListParams } from '../libs/types/westgard'

const prisma = new PrismaClient()

export async function listWestgardRules(params: WestgardRuleListParams) {
  const where: any = {}
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { code: { contains: params.search } },
      { description: { contains: params.search } }
    ]
  }
  
  if (params.severity) {
    where.severity = params.severity
  }
  
  if (params.isActive !== undefined) {
    where.isActive = params.isActive
  }
  
  if (params.departmentId) {
    where.departmentId = params.departmentId
  }
  
  if (params.qcLevelId) {
    where.qcLevels = {
      some: {
        id: params.qcLevelId
      }
    }
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const skip = (page - 1) * pageSize

  const [rules, total] = await Promise.all([
    prisma.westgardRule.findMany({
      where,
      include: {
        qcLevels: true
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: pageSize
    }),
    prisma.westgardRule.count({ where })
  ])

  // Map to include qcLevels for frontend
  const mappedRules = rules.map(rule => ({
    ...rule,
    qcLevels: rule.qcLevels?.map(level => level.id) || [],
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  }))

  return {
    items: mappedRules,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function getWestgardRuleById(id: string) {
  const rule = await prisma.westgardRule.findUnique({
    where: { id },
    include: {
      qcLevels: true
    }
  })

  if (!rule) {
    return null
  }

  return {
    ...rule,
    qcLevels: rule.qcLevels?.map(level => level.id) || [],
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  }
}

export async function createWestgardRule(input: CreateWestgardRuleInput) {
  const { qcLevels, ...ruleData } = input

  const rule = await prisma.westgardRule.create({
    data: {
      ...ruleData,
      isActive: ruleData.isActive ?? true
    },
    include: {
      qcLevels: true
    }
  })

  // Connect QC levels if provided
  if (qcLevels && qcLevels.length > 0) {
    await prisma.westgardRule.update({
      where: { id: rule.id },
      data: {
        qcLevels: {
          connect: qcLevels.map(qcLevelId => ({ id: qcLevelId }))
        }
      }
    })

    // Reload with levels
    const updatedRule = await prisma.westgardRule.findUnique({
      where: { id: rule.id },
      include: {
        qcLevels: true
      }
    })

    return {
      ...updatedRule!,
      qcLevels: updatedRule!.qcLevels.map(level => level.id),
      createdAt: updatedRule!.createdAt.toISOString(),
      updatedAt: updatedRule!.updatedAt.toISOString()
    }
  }

  return {
    ...rule,
    qcLevels: [],
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  }
}

export async function updateWestgardRule(input: UpdateWestgardRuleInput) {
  const { id, qcLevels, ...ruleData } = input

  const rule = await prisma.westgardRule.update({
    where: { id },
    data: ruleData,
    include: {
      qcLevels: true
    }
  })

  // Update QC levels if provided
  if (qcLevels !== undefined) {
    // Disconnect all existing QC levels
    await prisma.westgardRule.update({
      where: { id },
      data: {
        qcLevels: {
          set: []
        }
      }
    })

    // Connect new QC levels
    if (qcLevels.length > 0) {
      await prisma.westgardRule.update({
        where: { id },
        data: {
          qcLevels: {
            connect: qcLevels.map(qcLevelId => ({ id: qcLevelId }))
          }
        }
      })
    }

    // Reload with levels
    const updatedRule = await prisma.westgardRule.findUnique({
      where: { id },
      include: {
        qcLevels: true
      }
    })

    return {
      ...updatedRule!,
      qcLevels: updatedRule!.qcLevels.map(level => level.id),
      createdAt: updatedRule!.createdAt.toISOString(),
      updatedAt: updatedRule!.updatedAt.toISOString()
    }
  }

  return {
    ...rule,
    qcLevels: rule.qcLevels?.map(level => level.id) || [],
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  }
}

export async function deleteWestgardRule(id: string) {
  // Delete the rule (QC levels will be automatically disconnected)
  await prisma.westgardRule.delete({
    where: { id }
  })

  return { success: true }
}

export async function getWestgardRuleOptions() {
  const rules = await prisma.westgardRule.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      description: true
    },
    orderBy: [
      { orderIndex: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  return rules.map(rule => ({
    value: rule.id,
    label: `${rule.name} - ${rule.description || ''}`.trim(),
    code: rule.code
  }))
}
