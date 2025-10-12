import { PrismaClient } from '@prisma/client'
import { Form, CreateFormInput, UpdateFormInput, FormFilters } from '../types/form.types'
import { formatDate } from '../utils/dateFormatter'

const prisma = new PrismaClient()

export async function getForms(filters: FormFilters = {}) {
  const { search, departmentId, options = false } = filters
  
  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (departmentId) {
    where.departmentId = departmentId
  }
  
  const select = options ? {
    id: true,
    name: true,
    code: true
  } : {
    id: true,
    name: true,
    code: true,
    issueRound: true,
    issueDate: true,
    note: true,
    departmentId: true,
    createdBy: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
    department: {
      select: {
        id: true,
        name: true
      }
    }
  }
  
  const [items, total] = await Promise.all([
    prisma.form.findMany({
      where,
      select,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.form.count({ where })
  ])
  
  // Format dates in items
  const formattedItems = items.map(item => ({
    ...item,
    issueDate: formatDate(item.issueDate),
    createdAt: formatDate(item.createdAt),
    updatedAt: formatDate(item.updatedAt)
  }))
  
  return { items: formattedItems, total }
}

export async function getFormById(id: string) {
  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  
  if (!form) return null
  
  return {
    ...form,
    issueDate: formatDate(form.issueDate),
    createdAt: formatDate(form.createdAt),
    updatedAt: formatDate(form.updatedAt)
  }
}

export async function createForm(input: CreateFormInput) {
  const form = await prisma.form.create({
    data: input,
    include: {
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  
  return {
    ...form,
    issueDate: formatDate(form.issueDate),
    createdAt: formatDate(form.createdAt),
    updatedAt: formatDate(form.updatedAt)
  }
}

export async function updateForm(id: string, input: UpdateFormInput) {
  const form = await prisma.form.update({
    where: { id },
    data: input,
    include: {
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  
  return {
    ...form,
    issueDate: formatDate(form.issueDate),
    createdAt: formatDate(form.createdAt),
    updatedAt: formatDate(form.updatedAt)
  }
}

export async function deleteForm(id: string) {
  return prisma.form.delete({
    where: { id }
  })
}
