import React, { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Input, Select, Space, Table, Tag, message } from 'antd'
import { CheckCircleTwoTone, CloseCircleTwoTone, SearchOutlined } from '@ant-design/icons'
import WestgardSettingsModal from '../components/westgard/WestgardSettingsModal'
import dayjs from 'dayjs'
import { evaluateSingleLevel } from '../utils/westgard'
import { westgardService } from '../services/westgard.service'
import { lotService } from '../services/lot.service'
import { qcLevelService } from '../services/qcLevel.service'
import { userService } from '../services/user.service'

type Violation = {
  id: string
  date: string
  test: string
  qcLevels: string
  rules: string
  note: string
  action?: string
  staff?: string
  status?: 'approved' | 'rejected' | undefined
}

// dynamic rows will be computed from backend data

const ruleExplain: Record<string, { title: string; content: string[]; remedy: string }> = {
  '1_2s': {
    title: 'Vi phạm quy tắc 1-2s',
    content: [
      'Một điểm QC vượt ra ngoài giới hạn ±2SD.',
      'Đây là cảnh báo sớm, chưa chắc đã là lỗi hệ thống.',
      'Nguyên nhân: Sai số ngẫu nhiên, thao tác kỹ thuật, điều kiện môi trường.'
    ],
    remedy: 'Kiểm tra lại thao tác, hiệu chuẩn, điều kiện môi trường, mẫu QC. Theo dõi thêm để xác định xu hướng.'
  },
  '1_3s': {
    title: 'Vi phạm quy tắc 1-3s',
    content: [
      'Một điểm QC vượt ra ngoài giới hạn ±3SD.',
      'Đây là lỗi nghiêm trọng, cần dừng lại ngay.',
      'Nguyên nhân: Sai số hệ thống, lỗi thiết bị, sai hiệu chuẩn, mẫu QC hỏng.'
    ],
    remedy: 'Dừng chạy mẫu bệnh nhân. Kiểm tra và hiệu chuẩn lại thiết bị. Chạy lại mẫu QC và xác nhận trước khi tiếp tục.'
  },
  '2_2s': {
    title: 'Vi phạm quy tắc 2-2s',
    content: [
      'Hai điểm QC liên tiếp cùng vượt ra ngoài ±2SD về cùng một phía (cùng dương hoặc cùng âm).',
      'Nguyên nhân: Sai số hệ thống (systematic error), độ chệch (bias).'
    ],
    remedy: 'Kiểm tra hiệu chuẩn, reagent, nhiệt độ bảo quản. Hiệu chuẩn lại thiết bị nếu cần.'
  },
  R_4s: {
    title: 'Vi phạm quy tắc R-4s',
    content: [
      'Khoảng cách (Range) giữa hai điểm QC liên tiếp (hoặc giữa hai mức QC trong cùng một lần chạy) vượt quá 4SD.',
      'Đây có thể là sai số ngẫu nhiên lớn.',
      'Nguyên nhân: Thao tác kỹ thuật, lỗi thiết bị, sao chép kết quả sai, chất lượng hoá chất/mẫu kiểm không tốt, điều kiện phòng xét nghiệm không đảm bảo.'
    ],
    remedy: 'Xem lại nguyên nhân và thực hiện biện pháp khắc phục. Chạy lại kiểm tra điểm vi phạm.'
  },
  '4_1s': {
    title: 'Vi phạm quy tắc 4-1s',
    content: [
      'Bốn điểm QC liên tiếp cùng nằm về một phía so với giá trị trung bình (Mean), mỗi điểm vượt quá ±1SD.',
      'Nguyên nhân: Sai số hệ thống, độ chệch nhỏ nhưng liên tục.'
    ],
    remedy: 'Kiểm tra reagent, hiệu chuẩn, nhiệt độ. Theo dõi xu hướng để xác định nguyên nhân.'
  },
  '10x': {
    title: 'Vi phạm quy tắc 10x',
    content: [
      'Mười điểm QC liên tiếp cùng nằm về một phía so với giá trị trung bình (Mean).',
      'Nguyên nhân: Sai số hệ thống kéo dài, độ chệch liên tục.'
    ],
    remedy: 'Kiểm tra và hiệu chuẩn lại thiết bị. Kiểm tra reagent, điều kiện bảo quản. Có thể cần thay reagent hoặc bảo trì thiết bị.'
  }
}

const WestgardPage: React.FC = () => {
  const [rows, setRows] = useState<Violation[]>([])
  const [range, setRange] = useState<[any, any] | null>([dayjs().startOf('month'), dayjs().endOf('month')] as any)
  const [lot, setLot] = useState<string>('')
  const [lotId, setLotId] = useState<string>('')
  const [machine, setMachine] = useState<string>('')
  const [selectedRule, setSelectedRule] = useState<string | undefined>(undefined)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string; id?: string }[]>([])
  const [machineOptions, setMachineOptions] = useState<{ value: string; label: string }[]>([])
  const [ruleOptions, setRuleOptions] = useState<{ value: string; label: string }[]>([])
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([])

  // Load lots, rules, and users from backend
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [lotsResponse, rulesResponse, usersResponse] = await Promise.all([
          lotService.list({ page: 1, pageSize: 1000 }),
          westgardService.list({ page: 1, pageSize: 1000, isActive: true }),
          userService.list({ page: 1, pageSize: 1000 })
        ])
        if (!mounted) return
        
        // Set lot options
        if (lotsResponse.success && lotsResponse.data) {
          const lots = 'items' in lotsResponse.data ? lotsResponse.data.items : []
          const opts = lots.map((l: any) => ({ value: l.code, label: l.code, id: l.id }))
          setLotOptions(opts)
          if (opts[0]) {
            setLot(opts[0].value)
            setLotId(opts[0].id || '')
          }
        } else {
          console.error('Failed to load lots:', lotsResponse)
          message.error('Không tải được danh sách lô')
        }
        
        // Set rule options
        if (rulesResponse.success && rulesResponse.data) {
          const rules = 'items' in rulesResponse.data ? rulesResponse.data.items : []
          const ruleOpts = rules
            .filter((r: any) => r.isActive)
            .map((r: any) => ({ 
              value: r.code, 
              label: `${r.name} - ${r.description || ''}`.trim()
            }))
          setRuleOptions(ruleOpts)
        } else {
          console.error('Failed to load westgard rules:', rulesResponse)
          message.error('Không tải được danh sách quy tắc Westgard')
        }
        
        // Set user options
        if (usersResponse.success && usersResponse.data) {
          const users = 'items' in usersResponse.data ? usersResponse.data.items : []
          const userOpts = users.map((u: any) => ({
            value: u.fullName || u.username,
            label: `${u.fullName || u.username} ${u.position ? `(${u.position})` : ''}`
          }))
          setUserOptions(userOpts)
        } else {
          console.error('Failed to load users:', usersResponse)
          message.error('Không tải được danh sách người dùng')
        }
      } catch (e) {
        console.error('Load data error:', e)
        message.error('Lỗi khi tải dữ liệu')
      }
    })()
    return () => { mounted = false }
  }, [])

  // Load machines by selected lot
  useEffect(() => {
    ;(async () => {
      try {
        if (!lotId) { setMachineOptions([]); setMachine(''); return }
        const response = await lotService.getMachines(lotId)
        if (response.success && response.data) {
          const opts = response.data.map((m: any) => ({ value: m.id, label: `${m.deviceCode} - ${m.name}` }))
          setMachineOptions(opts)
          if (!machine || !opts.some((o: { value: string }) => o.value === machine)) {
            setMachine(opts[0]?.value || '')
          }
        } else {
          setMachineOptions([])
        }
      } catch (e) {
        console.error('Load machines error:', e)
        setMachineOptions([])
      }
    })()
  }, [lotId])

  // Load stored violations only; if trống thì hiển thị trống
  const loadViolations = async () => {
    try {
      if (!lotId || !machine) { setRows([]); return }
      // Load violations from API
      const from = range?.[0]?.format?.('YYYY-MM-DD')
      const to = range?.[1]?.format?.('YYYY-MM-DD')
      console.log('[WG] fetch violations', { lotId, machineId: machine, from, to })
      
      // TODO: Implement violation service API call
      // const response = await violationService.list({ lotId, machineId: machine, dateFrom: from, dateTo: to })
      // For now, show empty state
      console.log('[WG] violations - API not implemented yet')
      setRows([])
    } catch (e) {
      console.error('Load violations error', e)
      message.error('Không tải được dữ liệu vi phạm')
      setRows([])
    }
  }

  // Auto reload when filters change
  useEffect(() => { loadViolations() }, [lotId, machine, range])

  const columns = useMemo(() => ([
    {
      title: 'Nội dung',
      dataIndex: 'note',
      render: (text: string) => (
        <div style={{ whiteSpace: 'pre-line' }}>
          {text}
        </div>
      )
    },
    {
      title: 'Hành động khắc phục',
      dataIndex: 'action',
      width: 280,
      render: (_: any, r: Violation) => (
        <Input
          placeholder="Nhập mô tả khắc phục"
          value={r.action}
          onChange={(e) => setRows(prev => prev.map(x => x.id === r.id ? { ...x, action: e.target.value } : x))}
          onBlur={async () => {
            try {
              // TODO: Implement violation update API call
              // await violationService.update(r.id, { action: r.action, staff: r.staff, status: r.status })
              console.log('Update violation action - API not implemented yet')
            } catch (e) {
              console.error('Error saving action:', e)
            }
          }}
        />
      )
    },
    {
      title: 'Nhân viên', width: 200, dataIndex: 'staff',
      render: (_: any, r: Violation) => (
        <Select
          placeholder="Chọn nhân viên"
          value={r.staff}
          onChange={async (v) => {
            setRows(prev => prev.map(x => x.id === r.id ? { ...x, staff: v } : x))
            try {
              // TODO: Implement violation update API call
              // await violationService.update(r.id, { action: r.action, staff: v, status: r.status })
              console.log('Update violation staff - API not implemented yet')
            } catch (e) {
              console.error('Error saving staff:', e)
            }
          }}
          options={userOptions}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          allowClear
        />
      )
    },
    {
      title: '', width: 120,
      render: (_: any, r: Violation) => (
        <Space>
          <Button 
            type="text" 
            onClick={async () => {
              setRows(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved' } : x))
              try {
                // TODO: Implement violation update API call
                // await violationService.update(r.id, { action: r.action, staff: r.staff, status: 'approved' })
                console.log('Approve violation - API not implemented yet')
                message.success('Đã duyệt vi phạm')
              } catch (e) {
                console.error('Error approving:', e)
                message.error('Lỗi khi duyệt')
              }
            }}
          >
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </Button>
          <Button 
            type="text" 
            onClick={async () => {
              setRows(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x))
              try {
                // TODO: Implement violation update API call
                // await violationService.update(r.id, { action: r.action, staff: r.staff, status: 'rejected' })
                console.log('Reject violation - API not implemented yet')
                message.success('Đã từ chối vi phạm')
              } catch (e) {
                console.error('Error rejecting:', e)
                message.error('Lỗi khi từ chối')
              }
            }}
          >
            <CloseCircleTwoTone twoToneColor="#ff4d4f" />
          </Button>
          {r.status && <Tag color={r.status === 'approved' ? 'blue' : 'red'}>{r.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</Tag>}
        </Space>
      )
    }
  ]), [userOptions])

  // Filtered and paginated data
  const filteredData = useMemo(() => {
    let filtered = rows
    
    // Filter by rule
    if (selectedRule) {
      filtered = filtered.filter(item => item.rules === selectedRule)
    }
    
    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(item => 
        item.test.toLowerCase().includes(searchLower) ||
        item.qcLevels.toLowerCase().includes(searchLower) ||
        item.rules.toLowerCase().includes(searchLower) ||
        item.note.toLowerCase().includes(searchLower) ||
        item.action?.toLowerCase().includes(searchLower) ||
        item.staff?.toLowerCase().includes(searchLower)
      )
    }
    return filtered
  }, [rows, selectedRule, searchText])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, pageSize])

  return (
    <div>
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Select
          placeholder="Chọn lô QC"
          value={lot}
          style={{ width: 200 }}
          options={lotOptions}
          onChange={(v, option: any) => { setLot(v as string); setLotId(option?.id) }}
        />
        <Select
          placeholder="Chọn máy"
          value={machine}
          style={{ width: 220 }}
          options={machineOptions}
          onChange={(v) => setMachine(v as string)}
        />
        <DatePicker.RangePicker value={range as any} onChange={(v)=> setRange(v as any)} />
        <Select
          placeholder="Lọc theo lỗi"
          value={selectedRule}
          style={{ width: 200 }}
          options={ruleOptions}
          onChange={(v) => setSelectedRule(v as string | undefined)}
          allowClear
        />
        <Button disabled={!lot || !machine}>Xuất ra file</Button>
        <Button type="primary" onClick={() => setSettingsOpen(true)}>Cài đặt</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns as any}
        dataSource={paginatedData}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredData.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => {
            setCurrentPage(page)
            setPageSize(size || 10)
          },
          onShowSizeChange: (_, size) => {
            setCurrentPage(1)
            setPageSize(size)
          }
        }}
      />

      <WestgardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(rules) => {
          // TODO: Lưu rules vào database
          console.log('Saved rules:', rules)
        }}
      />
    </div>
  )
}

export default WestgardPage


