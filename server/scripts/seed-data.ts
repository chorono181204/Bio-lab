import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Departments
  const departments = [
    { code: 'HEM', name: 'Huyết học' },
    { code: 'BIO', name: 'Hóa sinh' },
    { code: 'MIC', name: 'Vi sinh' },
  ]

  const deptMap: Record<string, string> = {}
  for (const d of departments) {
    const up = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: { code: d.code, name: d.name, isActive: true }
    })
    deptMap[d.code] = up.id
  }

  // Users
  const adminPasswordHash = await bcrypt.hash('123456', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Quản trị viên',
      position: 'Quản trị viên',
      role: 'admin',
      password: adminPasswordHash,
      departmentId: (deptMap['HEM'] || Object.values(deptMap)[0]) as string
    }
  })

  const managers = [
    { username: 'manager-hem', fullName: 'Trưởng khoa Huyết học', dept: 'HEM' },
    { username: 'manager-bio', fullName: 'Trưởng khoa Hóa sinh', dept: 'BIO' },
    { username: 'manager-mic', fullName: 'Trưởng khoa Vi sinh', dept: 'MIC' },
  ]
  for (const m of managers) {
    const hash = await bcrypt.hash('123456', 10)
    await prisma.user.upsert({
      where: { username: m.username },
      update: {},
      create: {
        username: m.username,
        fullName: m.fullName,
        position: 'Trưởng khoa',
        role: 'manager',
        password: hash,
        departmentId: deptMap[m.dept] as string
      }
    })
  }

  // QC Levels per department
  const qcNames = ['QC1', 'QC2', 'QC3']
  for (const deptCode of Object.keys(deptMap)) {
    for (const name of qcNames) {
      await prisma.qcLevel.upsert({
        where: { name_departmentId: { name, departmentId: deptMap[deptCode] } as any },
        update: {},
        create: { name, departmentId: deptMap[deptCode] }
      })
    }
  }

  // Westgard rules per department (basic common set)
  const rules = [
    { code: '1_2s', name: '1-2s', severity: 'warning' as const, type: 'single' as const },
    { code: '1_3s', name: '1-3s', severity: 'error' as const, type: 'single' as const },
    { code: '2_2s', name: '2-2s', severity: 'error' as const, type: 'multiple' as const },
    { code: 'R_4s', name: 'R-4s', severity: 'error' as const, type: 'multiple' as const },
    { code: '4_1s', name: '4-1s', severity: 'error' as const, type: 'multiple' as const },
    { code: '10x',  name: '10x',  severity: 'critical' as const, type: 'multiple' as const },
  ]
  for (const deptCode of Object.keys(deptMap)) {
    for (const r of rules) {
      await prisma.westgardRule.upsert({
        where: { code_departmentId: { code: r.code, departmentId: deptMap[deptCode] } as any },
        update: { name: r.name, severity: r.severity, type: r.type },
        create: { code: r.code, name: r.name, severity: r.severity, type: r.type, departmentId: deptMap[deptCode], isActive: true }
      })
    }
  }

  console.log('✅ Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


