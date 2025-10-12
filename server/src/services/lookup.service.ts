import { prisma } from '../config/db'

export async function getInitLookupData(departmentId: string | null | undefined) {
  const where: any = {}
  if (departmentId) where.departmentId = departmentId

  // Get all lots for this department
  const lots = await prisma.lot.findMany({
    where,
    select: { id: true, code: true, lotName: true },
    orderBy: { id: 'asc' }
  })

  // Get first lot ID
  const firstLotId = lots.length > 0 ? lots[0].id : null

  // Get machines for first lot (if exists)
  let machines: any[] = []
  if (firstLotId) {
    const machineLots = await prisma.machineLot.findMany({
      where: { lotId: firstLotId },
      include: {
        machine: {
          select: {
            id: true,
            deviceCode: true,
            name: true
          }
        }
      }
    })
    machines = machineLots.map(ml => ({
      id: ml.machine.id,
      deviceCode: ml.machine.deviceCode,
      name: ml.machine.name,
      label: `${ml.machine.deviceCode} - ${ml.machine.name}`
    }))
  }

  // Get QC levels for first lot (if exists)
  let qcLevels: any[] = []
  if (firstLotId) {
    const lotQcLevels = await prisma.lotQcLevel.findMany({
      where: { lotId: firstLotId },
      include: {
        qcLevel: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    qcLevels = lotQcLevels.map(lql => ({
      id: lql.qcLevel.id,
      name: lql.qcLevel.name
    }))
  }

  // Get all analytes for this department
  const analytes = await prisma.analyte.findMany({
    where,
    select: { id: true, code: true, name: true },
    orderBy: { id: 'asc' }
  })

  return {
    lots,
    machines,
    qcLevels,
    analytes
  }
}








