const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCv() {
  try {
    const limit = await prisma.limit.findFirst({ 
      where: { id: 'cmglwmqza0001134r0g8peqfu' } 
    })
    console.log('Limit from DB:', JSON.stringify(limit, null, 2))
    
    // Check all limits with cv field
    const limitsWithCv = await prisma.limit.findMany({
      where: {
        cv: { not: null }
      },
      select: { id: true, cv: true, mean: true, sd: true }
    })
    console.log('Limits with CV:', limitsWithCv)
    
    // Check all limits for this specific analyte
    const allLimits = await prisma.limit.findMany({
      where: {
        analyteId: 'cmglwmqza0001134r0g8peqfu'
      },
      select: { id: true, cv: true, mean: true, sd: true, analyteId: true }
    })
    console.log('All limits for this analyte:', allLimits)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCv()
