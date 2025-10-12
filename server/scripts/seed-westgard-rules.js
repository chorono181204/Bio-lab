const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

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
  },
  {
    code: '4-1s-2s',
    name: '4-1s-2s',
    description: 'Bốn điểm liên tiếp cùng phía ±1SD và ±2SD',
    severity: 'warning',
    type: 'multiple',
    windowSize: 4,
    thresholdSd: 1.0,
    consecutivePoints: 4,
    sameSide: true,
    oppositeSides: false,
    sumAbsZGt: 2.0,
    expression: 'consecutive_same_side(z, 4) > 1 AND consecutive_same_side(z, 4) < 2',
    customMessage: 'Cảnh báo: Bốn điểm QC liên tiếp có xu hướng lệch nhẹ nhưng chưa nghiêm trọng.',
    orderIndex: 8,
    params: JSON.stringify({
      causes: [
        'Xu hướng lệch nhẹ',
        'Thiết bị bắt đầu drift',
        'Môi trường thay đổi',
        'Reagent bắt đầu xuống cấp',
        'Hiệu chuẩn cần điều chỉnh'
      ],
      correctiveActions: [
        'Theo dõi xu hướng',
        'Kiểm tra hiệu chuẩn',
        'Theo dõi môi trường',
        'Lên lịch bảo trì',
        'Ghi chép để phân tích'
      ]
    }),
    isActive: true
  }
]

async function seedWestgardRules() {
  try {
    console.log('🌱 Bắt đầu seed Westgard rules...')
    
    // Lấy department đầu tiên (hoặc tạo default)
    let department = await prisma.department.findFirst()
    if (!department) {
      console.log('📝 Tạo department mặc định...')
      department = await prisma.department.create({
        data: {
          code: 'DEFAULT',
          name: 'Phòng xét nghiệm mặc định'
        }
      })
    }
    
    // Lấy QC levels
    let qcLevels = await prisma.qcLevel.findMany()
    if (qcLevels.length === 0) {
      console.log('📝 Tạo QC levels mặc định...')
      await prisma.qcLevel.createMany({
        data: [
          { name: 'QC1', departmentId: department.id },
          { name: 'QC2', departmentId: department.id },
          { name: 'QC3', departmentId: department.id }
        ]
      })
      qcLevels = await prisma.qcLevel.findMany()
    }
    
    console.log(`📊 Tìm thấy ${qcLevels.length} QC levels:`, qcLevels.map(q => q.name))
    
    // Tạo Westgard rules
    for (const ruleData of commonWestgardRules) {
      console.log(`📝 Tạo rule: ${ruleData.name}...`)
      
      const rule = await prisma.westgardRule.upsert({
        where: { code: ruleData.code },
        update: {
          ...ruleData,
          departmentId: department.id,
          updatedBy: 'System Seeder'
        },
        create: {
          ...ruleData,
          departmentId: department.id,
          createdBy: 'System Seeder'
        }
      })
      
      // Connect QC levels to the rule
      await prisma.westgardRule.update({
        where: { id: rule.id },
        data: {
          qcLevels: {
            connect: qcLevels.map(qcLevel => ({ id: qcLevel.id }))
          }
        }
      })
      
      console.log(`✅ Đã tạo rule: ${rule.name} (ID: ${rule.id})`)
    }
    
    console.log('🎉 Hoàn thành seed Westgard rules!')
    console.log(`📊 Đã tạo ${commonWestgardRules.length} rules`)
    console.log(`🔗 Mỗi rule được áp dụng cho ${qcLevels.length} QC levels`)
    
  } catch (error) {
    console.error('❌ Lỗi khi seed Westgard rules:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy seed
if (require.main === module) {
  seedWestgardRules()
    .then(() => {
      console.log('✅ Seed hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed thất bại:', error)
      process.exit(1)
    })
}

module.exports = { seedWestgardRules }
