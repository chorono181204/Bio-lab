import React, { useState, useEffect } from 'react'
import { Modal, Form, Table, Switch, Select, Input, InputNumber, Button, Space, Tag, Divider, message, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { westgardService } from '../../services/westgard.service'
import { qcLevelService } from '../../services/qcLevel.service'

type WestgardRule = {
  id: string
  name: string
  description: string
  isActive: boolean
  severity: 'warning' | 'error' | 'critical'
  type?: string
  windowSize?: number | null
  thresholdSd?: number | null
  consecutivePoints?: number | null
  sameSide?: boolean | null
  oppositeSides?: boolean | null
  sumAbsZGt?: number | null
  causes: string[]
  correctiveActions: string[]
  appliesTo: string[]
  customMessage?: string
}



const severityOptions = [
  { value: 'warning', label: 'Cảnh báo', color: 'transparent', border: '1px solid #faad14', textColor: '#faad14' },
  { value: 'error', label: 'Lỗi', color: 'transparent', border: '1px solid #ff4d4f', textColor: '#ff4d4f' },
  { value: 'critical', label: 'Nghiêm trọng', color: 'transparent', border: '1px solid #ff4d4f', textColor: '#ff4d4f' }
]


interface WestgardSettingsModalProps {
  open: boolean
  onClose: () => void
  onSave: (rules: WestgardRule[]) => void
}

const WestgardSettingsModal: React.FC<WestgardSettingsModalProps> = ({ open, onClose, onSave }) => {
  const [rules, setRules] = useState<WestgardRule[]>([])
  const [editingRule, setEditingRule] = useState<WestgardRule | null>(null)
  const [qcOptions, setQcOptions] = useState<Array<{value: string, label: string}>>([])
  const [form] = Form.useForm()

  // Load rules from backend when open
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        // Load QC levels
        const levelsResponse = await qcLevelService.list({ page: 1, pageSize: 1000 })
        if (levelsResponse.success && levelsResponse.data) {
          const levels = 'items' in levelsResponse.data ? levelsResponse.data.items : []
          setQcOptions(levels.map((l: any) => ({ value: l.id, label: l.name })))
        }
        
        // Load westgard rules
        const rulesResponse = await westgardService.list({ page: 1, pageSize: 1000 })
        if (rulesResponse.success && rulesResponse.data) {
          const rules = 'items' in rulesResponse.data ? rulesResponse.data.items : []
          // Map BE fields to FE shape
          const mapped = rules.map((r: any) => ({
            id: r.id,
            code: r.code || r.id, // Fallback to id if code is missing
            name: r.name,
            description: r.description || '',
            isActive: r.isActive,
            severity: r.severity,
            type: r.type || 'single', // Fallback to single if type is missing
            windowSize: r.windowSize,
            thresholdSd: r.thresholdSd,
            consecutivePoints: r.consecutivePoints,
            sameSide: r.sameSide,
            oppositeSides: r.oppositeSides,
            sumAbsZGt: r.sumAbsZGt,
            causes: r.params ? JSON.parse(r.params).causes || [] : [],
            correctiveActions: r.params ? JSON.parse(r.params).correctiveActions || [] : [],
            appliesTo: r.qcLevels || [],
            customMessage: r.customMessage || undefined
          }))
          setRules(mapped)
        } else {
          console.error('Failed to load westgard rules:', rulesResponse)
          message.error('Không tải được dữ liệu quy tắc Westgard')
          setRules([])
        }
      } catch (e) {
        console.error('Load westgard rules error', e)
        message.error('Lỗi khi tải dữ liệu quy tắc Westgard')
        setRules([])
      }
    })()
  }, [open])

  const handleToggleActive = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const handleEdit = (rule: WestgardRule) => {
    setEditingRule(rule)
    form.setFieldsValue(rule)
  }

  const handleAddRule = () => {
    const newRule: WestgardRule = {
      id: `temp_${Date.now()}`,
      name: '',
      description: '',
      isActive: true,
      severity: 'warning',
      type: 'single',
      windowSize: 1,
      thresholdSd: 2,
      consecutivePoints: 1,
      sameSide: false,
      oppositeSides: false,
      sumAbsZGt: null,
      causes: [],
      correctiveActions: [],
      appliesTo: [],
      customMessage: undefined
    }
    
    setEditingRule(newRule)
    form.setFieldsValue(newRule)
  }

  const handleDeleteRule = async (rule: WestgardRule) => {
    try {
      const response = await westgardService.delete(rule.id)
      if (response.success) {
        setRules(prev => prev.filter(r => r.id !== rule.id))
        if (editingRule?.id === rule.id) {
          setEditingRule(null)
          form.resetFields()
        }
        message.success('Đã xóa quy tắc')
      } else {
        message.error('Xóa quy tắc thất bại')
      }
    } catch (e) {
      console.error('Delete westgard rule error', e)
      message.error('Xóa quy tắc thất bại')
    }
  }

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields()
      console.log('Form values:', values)
      console.log('appliesTo value:', values.appliesTo)
      
      const updatedRule = { ...editingRule, ...values }
      const payload = {
        code: updatedRule.name,
        name: updatedRule.name,
        description: updatedRule.description,
        severity: updatedRule.severity,
        isActive: updatedRule.isActive,
        type: updatedRule.type || 'single',
        windowSize: updatedRule.windowSize,
        thresholdSd: updatedRule.thresholdSd,
        consecutivePoints: updatedRule.consecutivePoints,
        sameSide: updatedRule.sameSide,
        oppositeSides: updatedRule.oppositeSides,
        sumAbsZGt: updatedRule.sumAbsZGt,
        customMessage: updatedRule.customMessage || null,
        params: JSON.stringify({
          causes: updatedRule.causes || [],
          correctiveActions: updatedRule.correctiveActions || []
        }),
        qcLevels: updatedRule.appliesTo || []
      }
      
      console.log('Saving rule:', payload)
      console.log('QC Levels to save:', updatedRule.appliesTo)
      
      let response
      if (updatedRule.id.startsWith('temp_')) {
        // Create new rule
        response = await westgardService.create(payload)
      } else {
        // Update existing rule
        response = await westgardService.update(updatedRule.id, payload)
      }
      
      if (response.success) {
        setEditingRule(null)
        form.resetFields()
        message.success(updatedRule.id.startsWith('temp_') ? 'Tạo quy tắc thành công!' : 'Cập nhật quy tắc thành công!')
        
        // Reload rules to get latest data
        const rulesResponse = await westgardService.list({ page: 1, pageSize: 1000 })
        if (rulesResponse.success && rulesResponse.data) {
          const rules = 'items' in rulesResponse.data ? rulesResponse.data.items : []
          const mapped = rules.map((r: any) => ({
            id: r.id,
            code: r.code || r.id,
            name: r.name,
            description: r.description || '',
            isActive: r.isActive,
            severity: r.severity,
            type: r.type || 'single',
            windowSize: r.windowSize,
            thresholdSd: r.thresholdSd,
            consecutivePoints: r.consecutivePoints,
            sameSide: r.sameSide,
            oppositeSides: r.oppositeSides,
            sumAbsZGt: r.sumAbsZGt,
            causes: r.params ? JSON.parse(r.params).causes || [] : [],
            correctiveActions: r.params ? JSON.parse(r.params).correctiveActions || [] : [],
            appliesTo: r.qcLevels || [],
            customMessage: r.customMessage || undefined
          }))
          setRules(mapped)
          onSave(mapped)
        }
      } else {
        message.error(updatedRule.id.startsWith('temp_') ? 'Tạo quy tắc thất bại' : 'Cập nhật quy tắc thất bại')
      }
    } catch (e) {
      console.error('Save edit error:', e)
      message.error('Lỗi khi lưu quy tắc')
    }
  }

  const handleCancelEdit = () => {
    // If editing a temp rule, remove it from the list
    if (editingRule?.id.startsWith('temp_')) {
      setRules(prev => prev.filter(rule => rule.id !== editingRule.id))
    }
    setEditingRule(null)
    form.resetFields()
  }


  const columns = [
    {
      title: 'Tên quy tắc',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      ellipsis: true,
      render: (name: string, record: WestgardRule) => (
        <Space>
          <Tooltip title={name} placement="topLeft">
            <span style={{ maxWidth: 160, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          </Tooltip>
          {!record.isActive && <Tag color="default">Tắt</Tag>}
        </Space>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string) => (
        <div style={{ 
          wordWrap: 'break-word', 
          whiteSpace: 'normal',
          lineHeight: '1.4'
        }}>
          {text}
        </div>
      )
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity: string) => {
        const opt: any = severityOptions.find(s => s.value === severity)
        return (
          <Tag style={{ 
            background: opt?.color, 
            border: opt?.border, 
            color: opt?.textColor,
            whiteSpace: 'nowrap'
          }}>
            {opt?.label}
          </Tag>
        )
      }
    },
    {
      title: 'Áp dụng cho',
      dataIndex: 'appliesTo',
      key: 'appliesTo',
      width: 200,
      render: (appliesTo: string[]) => {
        const idToName = new Map(qcOptions.map(o => [o.value, o.label]))
        return (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '4px',
            maxWidth: '180px'
          }}>
            {(appliesTo || []).map(id => (
              <Tag key={id} color="blue" style={{ margin: '2px 0' }}>
                {idToName.get(id) || id}
              </Tag>
            ))}
          </div>
        )
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: WestgardRule) => (
        <Switch 
          checked={isActive} 
          onChange={() => handleToggleActive(record.id)}
        />
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      render: (_: any, record: WestgardRule) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm title="Xóa quy tắc này?" onConfirm={() => handleDeleteRule(record)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Modal
      title="Cài đặt Westgard Rules"
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 1200 }}
      bodyStyle={{ 
        maxHeight: '80vh', 
        overflow: 'hidden',
        padding: '16px'
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="add" icon={<PlusOutlined />} onClick={handleAddRule}>
          Thêm quy tắc
        </Button>
      ]}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        height: '100%',
        minHeight: 0
      }}>
        {/* Danh sách rules */}
        <div style={{ 
          flex: '1 1 60%', 
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <Table
            dataSource={rules}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 'calc(80vh - 200px)' }}
            style={{ height: '100%' }}
          />
        </div>

        {/* Form chỉnh sửa */}
        <div style={{ 
          flex: '1 1 40%', 
          minWidth: 0, 
          overflow: 'hidden',
          borderLeft: '1px solid #f0f0f0',
          paddingLeft: 16,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {editingRule ? (
            <div style={{ 
              padding: '0 8px',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              maxHeight: 'calc(80vh - 120px)'
            }}>
              <h4 style={{ marginBottom: 16 }}>Chỉnh sửa quy tắc: {editingRule.name}</h4>
              <Form form={form} layout="vertical" onFinish={handleSaveEdit}>
                <Form.Item name="name" label="Tên quy tắc" rules={[{ required: true, message: 'Nhập tên quy tắc' }]}> 
                  <Input placeholder="VD: 1-2s, 1-3s hoặc tên tùy chỉnh" />
                </Form.Item>
                
                <Form.Item name="type" label="Loại quy tắc">
                  <Select 
                    placeholder="Chọn loại quy tắc"
                    options={[
                      { value: 'single', label: 'Đơn quy tắc' },
                      { value: 'multiple', label: 'Đa quy tắc' }
                    ]}
                  />
                </Form.Item>
                
                <Form.Item name="description" label="Mô tả">
                  <Input.TextArea 
                    rows={2} 
                    style={{ 
                      wordWrap: 'break-word',
                      resize: 'none'
                    }} 
                  />
                </Form.Item>
                
                <Form.Item name="severity" label="Mức độ">
                  <Select options={severityOptions} />
                </Form.Item>

                <Form.Item name="appliesTo" label="Áp dụng cho">
                  <Select 
                    mode="multiple" 
                    options={qcOptions}
                    placeholder="Chọn QC levels"
                  />
                </Form.Item>

                <Divider orientation="left" style={{ margin: '8px 0' }}>Tham số đánh giá</Divider>
                <Space style={{ display: 'flex' }} wrap>
                  <Form.Item name="windowSize" label="Cửa sổ (điểm)" style={{ width: 160 }}>
                    <InputNumber min={1} placeholder="VD: 2, 4, 10" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="thresholdSd" label="Ngưỡng SD" style={{ width: 160 }}>
                    <InputNumber min={0} step={0.1} placeholder="VD: 3, 2, 1" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="consecutivePoints" label="Số điểm liên tiếp" style={{ width: 180 }}>
                    <InputNumber min={1} placeholder="VD: 2, 4, 10" style={{ width: '100%' }} />
                  </Form.Item>
                </Space>
                <Space style={{ display: 'flex' }} wrap>
                  <Form.Item name="sameSide" label="Cùng phía mean" style={{ width: 180 }}>
                    <Select options={[{ value: true, label: 'Có' }, { value: false, label: 'Không' }]} />
                  </Form.Item>
                  <Form.Item name="oppositeSides" label="Khác phía (R-4s)" style={{ width: 180 }}>
                    <Select options={[{ value: true, label: 'Có' }, { value: false, label: 'Không' }]} />
                  </Form.Item>
                  <Form.Item name="sumAbsZGt" label="Tổng |z| >" style={{ width: 160 }}>
                    <InputNumber min={0} step={0.1} placeholder="VD: 4" style={{ width: '100%' }} />
                  </Form.Item>
                </Space>
                
                <Form.Item name="causes" label="Nguyên nhân có thể">
                  <Select
                    mode="tags"
                    placeholder="Nhập nguyên nhân"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item name="correctiveActions" label="Hành động khắc phục">
                  <Select
                    mode="tags"
                    placeholder="Nhập hành động khắc phục"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item name="customMessage" label="Thông báo tùy chỉnh">
                  <Input.TextArea 
                    rows={2} 
                    placeholder="Thông báo hiển thị khi vi phạm" 
                    style={{ 
                      wordWrap: 'break-word',
                      resize: 'none'
                    }}
                  />
                </Form.Item>
                
                <Space>
                  <Button type="primary" onClick={handleSaveEdit}>
                    Lưu
                  </Button>
                  <Button onClick={handleCancelEdit}>
                    Hủy
                  </Button>
                </Space>
              </Form>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#999',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <p>Chọn một quy tắc để chỉnh sửa</p>
              <p style={{ fontSize: 12 }}>
                Click vào icon <EditOutlined /> để chỉnh sửa quy tắc
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default WestgardSettingsModal

