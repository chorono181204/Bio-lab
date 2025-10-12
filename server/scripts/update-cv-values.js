const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateCVValues() {
  try {
    console.log('Starting CV values update...')
    
    // Get all limits that don't have CV values
    const limits = await prisma.limit.findMany({
      where: {
        OR: [
          { cv: null },
          { cv: 0 }
        ],
        AND: [
          { mean: { not: 0 } },
          { sd: { not: 0 } }
        ]
      }
    })
    
    console.log(`Found ${limits.length} limits to update`)
    
    let updated = 0
    for (const limit of limits) {
      if (limit.mean > 0 && limit.sd > 0) {
        const cv = (limit.sd / limit.mean) * 100
        
        await prisma.limit.update({
          where: { id: limit.id },
          data: { cv: Number(cv.toFixed(2)) }
        })
        
        updated++
        console.log(`Updated limit ${limit.id}: CV = ${cv.toFixed(2)}%`)
      }
    }
    
    console.log(`Successfully updated ${updated} limits with CV values`)
  } catch (error) {
    console.error('Error updating CV values:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCVValues()

