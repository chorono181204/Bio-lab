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
      create: { code: d.code, name: d.name }
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
    const deptId = deptMap[deptCode] as string
    for (const name of qcNames) {
      await prisma.qcLevel.upsert({
        where: { name_departmentId: { name, departmentId: deptId } as any },
        update: {},
        create: { name, department: { connect: { id: deptId as string } } }
      })
    }
  }

  // Westgard rules per department (detailed common set)
  const commonWestgardRules = [
    {
      code: '1-2s',
      name: '1-2s',
      description: 'Một điểm nằm ngoài ±2SD',
      severity: 'error',
      type: 'single',
      windowSize: 1,
      thresholdSd: 2.0,
      consecutivePoints: 1,
      sameSide: false,
      oppositeSides: false,
      sumAbsZGt: null,
      expression: 'abs(z) > 2',
      customMessage: 'Cảnh báo: Một điểm QC vượt ra ngoài giới hạn ±2SD. Kiểm tra lại thao tác và điều kiện môi trường.',
      orderIndex: 1,
      params: JSON.stringify({
        causes: [
          'Sai số ngẫu nhiên',
          'Lỗi thiết bị',
          'Thao tác kỹ thuật',
          'Điều kiện môi trường thay đổi',
          'Mẫu QC có vấn đề'
        ],
        correctiveActions: [
          'Kiểm tra lại thao tác',
          'Hiệu chuẩn thiết bị',
          'Chạy lại mẫu QC',
          'Kiểm tra điều kiện môi trường',
          'Thay mẫu QC mới'
        ]
      }),
      isActive: true
    },
    {
      code: '1-3s',
      name: '1-3s',
      description: 'Một điểm nằm ngoài ±3SD',
      severity: 'critical',
      type: 'single',
      windowSize: 1,
      thresholdSd: 3.0,
      consecutivePoints: 1,
      sameSide: false,
      oppositeSides: false,
      sumAbsZGt: null,
      expression: 'abs(z) > 3',
      customMessage: 'NGHIÊM TRỌNG: Một điểm QC vượt ra ngoài giới hạn ±3SD. Dừng xét nghiệm ngay lập tức!',
      orderIndex: 2,
      params: JSON.stringify({
        causes: [
          'Lỗi nghiêm trọng của thiết bị',
          'Hỏng thiết bị',
          'Mẫu QC hỏng',
          'Sai hiệu chuẩn',
          'Lỗi hệ thống'
        ],
        correctiveActions: [
          'DỪNG xét nghiệm mẫu bệnh nhân',
          'Kiểm tra toàn bộ hệ thống',
          'Hiệu chuẩn lại thiết bị',
          'Thay mẫu QC mới',
          'Xác nhận trước khi tiếp tục'
        ]
      }),
      isActive: true
    },
    {
      code: '2-2s',
      name: '2-2s',
      description: 'Hai điểm liên tiếp cùng phía ±2SD',
      severity: 'error',
      type: 'multiple',
      windowSize: 2,
      thresholdSd: 2.0,
      consecutivePoints: 2,
      sameSide: true,
      oppositeSides: false,
      sumAbsZGt: null,
      expression: 'consecutive_same_side(z, 2) > 2',
      customMessage: 'Cảnh báo: Hai điểm QC liên tiếp cùng vượt ra ngoài ±2SD về cùng một phía. Có thể có xu hướng lệch.',
      orderIndex: 3,
      params: JSON.stringify({
        causes: [
          'Xu hướng lệch (systematic error)',
          'Thiết bị drift',
          'Môi trường thay đổi',
          'Reagent có vấn đề',
          'Hiệu chuẩn không chính xác'
        ],
        correctiveActions: [
          'Kiểm tra xu hướng',
          'Hiệu chuẩn lại thiết bị',
          'Kiểm tra môi trường',
          'Thay reagent mới',
          'Theo dõi thêm'
        ]
      }),
      isActive: true
    },
    {
      code: 'R-4s',
      name: 'R-4s',
      description: 'Hai điểm liên tiếp cách nhau >4SD',
      severity: 'critical',
      type: 'multiple',
      windowSize: 2,
      thresholdSd: null,
      consecutivePoints: 2,
      sameSide: false,
      oppositeSides: true,
      sumAbsZGt: 4.0,
      expression: 'abs(z1 - z2) > 4',
      customMessage: 'NGHIÊM TRỌNG: Khoảng cách giữa hai điểm QC liên tiếp vượt quá 4SD. Sai số ngẫu nhiên lớn!',
      orderIndex: 4,
      params: JSON.stringify({
        causes: [
          'Sai số ngẫu nhiên lớn',
          'Lỗi thiết bị',
          'Sao chép kết quả sai',
          'Chất lượng hóa chất kém',
          'Điều kiện phòng xét nghiệm không đảm bảo'
        ],
        correctiveActions: [
          'Xem lại nguyên nhân',
          'Chạy lại kiểm tra điểm vi phạm',
          'Kiểm tra thiết bị',
          'Thay hóa chất mới',
          'Cải thiện điều kiện phòng xét nghiệm'
        ]
      }),
      isActive: true
    },
    {
      code: '4-1s',
      name: '4-1s',
      description: 'Bốn điểm liên tiếp cùng phía ±1SD',
      severity: 'warning',
      type: 'multiple',
      windowSize: 4,
      thresholdSd: 1.0,
      consecutivePoints: 4,
      sameSide: true,
      oppositeSides: false,
      sumAbsZGt: null,
      expression: 'consecutive_same_side(z, 4) > 1',
      customMessage: 'Cảnh báo: Bốn điểm QC liên tiếp cùng nằm về một phía so với mean. Có xu hướng nhẹ.',
      orderIndex: 5,
      params: JSON.stringify({
        causes: [
          'Xu hướng nhẹ',
          'Thiết bị cần hiệu chuẩn',
          'Môi trường thay đổi nhẹ',
          'Reagent bắt đầu xuống cấp',
          'Drift nhỏ của thiết bị'
        ],
        correctiveActions: [
          'Theo dõi xu hướng',
          'Lên lịch hiệu chuẩn',
          'Kiểm tra môi trường',
          'Theo dõi chất lượng reagent',
          'Ghi chép để phân tích'
        ]
      }),
      isActive: true
    },
    {
      code: '10x',
      name: '10x',
      description: 'Mười điểm liên tiếp cùng phía mean',
      severity: 'warning',
      type: 'multiple',
      windowSize: 10,
      thresholdSd: null,
      consecutivePoints: 10,
      sameSide: true,
      oppositeSides: false,
      sumAbsZGt: null,
      expression: 'consecutive_same_side(z, 10)',
      customMessage: 'Cảnh báo: Mười điểm QC liên tiếp cùng nằm về một phía so với mean. Thiết bị có drift.',
      orderIndex: 6,
      params: JSON.stringify({
        causes: [
          'Thiết bị drift',
          'Môi trường không ổn định',
          'Reagent xuống cấp',
          'Hiệu chuẩn không chính xác',
          'Thiết bị cần bảo trì'
        ],
        correctiveActions: [
          'Hiệu chuẩn thiết bị',
          'Kiểm tra môi trường',
          'Thay reagent mới',
          'Lên lịch bảo trì',
          'Theo dõi xu hướng dài hạn'
        ]
      }),
      isActive: true
    },
    {
      code: '2-3s',
      name: '2-3s',
      description: 'Hai điểm liên tiếp cùng phía ±3SD',
      severity: 'critical',
      type: 'multiple',
      windowSize: 2,
      thresholdSd: 3.0,
      consecutivePoints: 2,
      sameSide: true,
      oppositeSides: false,
      sumAbsZGt: null,
      expression: 'consecutive_same_side(z, 2) > 3',
      customMessage: 'NGHIÊM TRỌNG: Hai điểm QC liên tiếp cùng vượt ra ngoài ±3SD. Lỗi hệ thống nghiêm trọng!',
      orderIndex: 7,
      params: JSON.stringify({
        causes: [
          'Lỗi hệ thống nghiêm trọng',
          'Thiết bị hỏng hoàn toàn',
          'Mẫu QC hỏng',
          'Sai hiệu chuẩn nghiêm trọng',
          'Lỗi phần mềm'
        ],
        correctiveActions: [
          'DỪNG xét nghiệm ngay lập tức',
          'Kiểm tra toàn bộ hệ thống',
          'Thay thiết bị nếu cần',
          'Thay mẫu QC mới',
          'Hiệu chuẩn lại từ đầu'
        ]
      }),
      isActive: true
    }
  ]

  for (const deptCode of Object.keys(deptMap)) {
    const deptId = deptMap[deptCode] as string
    console.log(`📝 Tạo Westgard rules cho department: ${deptCode}`)
    
    for (const ruleData of commonWestgardRules) {
      await prisma.westgardRule.upsert({
        where: { code_departmentId: { code: ruleData.code, departmentId: deptId } as any },
        update: {
          ...ruleData,
          departmentId: deptId,
          updatedBy: 'System Seeder'
        },
        create: {
          ...ruleData,
          departmentId: deptId,
          createdBy: 'System Seeder',
          department: { connect: { id: deptId as string } }
        }
      })
    }
  }

  console.log('✅ Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


