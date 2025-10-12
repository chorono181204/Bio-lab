import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const prisma = new PrismaClient()
  try {
    const username = 'admin'
    const password = 'admin123' // change after first login
    const fullName = 'Administrator'

    // Ensure default department
    const dep = await prisma.department.upsert({
      where: { code: 'LAB' },
      update: {},
      create: { code: 'LAB', name: 'Laboratory', createdBy: 'seed' },
    })

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.upsert({
      where: { username },
      update: { password: hashed, fullName, role: 'admin', departmentId: dep.id },
      create: { username, password: hashed, fullName, role: 'admin', departmentId: dep.id, createdBy: 'seed' },
    })

    console.log('Seeded admin user:', { username, password })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })


