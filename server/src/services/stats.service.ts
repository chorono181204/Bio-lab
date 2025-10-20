import { prisma } from '../config/db'

export interface DepartmentStats {
  forms: number
  analytes: number
  lots: number
  machines: number
  users: number
  entriesToday: number
  entriesThisWeek: number
  entriesThisMonth: number
  violationsToday: number
  violationsThisWeek: number
  violationsThisMonth: number
}

export async function getDepartmentStats(departmentId?: string | null): Promise<DepartmentStats> {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Build where clause for department filtering
  const whereClause = departmentId ? { departmentId } : {}

  console.log('=== STATS QUERY DEBUG ===')
  console.log('Department ID:', departmentId)
  console.log('Where clause:', whereClause)
  console.log('Today:', startOfToday)
  console.log('Week start:', startOfWeek)
  console.log('Month start:', startOfMonth)

  try {
    // Get basic counts
    const [forms, analytes, lots, machines, users] = await Promise.all([
      prisma.form.count({ where: whereClause }),
      prisma.analyte.count({ where: whereClause }),
      prisma.lot.count({ where: whereClause }),
      prisma.machine.count({ where: whereClause }),
      prisma.user.count({ where: whereClause })
    ])

    // Get entry counts by time period
    const [entriesToday, entriesThisWeek, entriesThisMonth] = await Promise.all([
      prisma.entry.count({
        where: {
          ...whereClause,
          entryDate: {
            gte: startOfToday
          }
        }
      }),
      prisma.entry.count({
        where: {
          ...whereClause,
          entryDate: {
            gte: startOfWeek
          }
        }
      }),
      prisma.entry.count({
        where: {
          ...whereClause,
          entryDate: {
            gte: startOfMonth
          }
        }
      })
    ])

    // Get violation counts by time period
    const [violationsToday, violationsThisWeek, violationsThisMonth] = await Promise.all([
      prisma.violation.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: startOfToday
          }
        }
      }),
      prisma.violation.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: startOfWeek
          }
        }
      }),
      prisma.violation.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    const stats: DepartmentStats = {
      forms,
      analytes,
      lots,
      machines,
      users,
      entriesToday,
      entriesThisWeek,
      entriesThisMonth,
      violationsToday,
      violationsThisWeek,
      violationsThisMonth
    }

    console.log('=== STATS RESULT ===')
    console.log('Stats:', stats)

    return stats
  } catch (error) {
    console.error('Error getting department stats:', error)
    throw error
  }
}
