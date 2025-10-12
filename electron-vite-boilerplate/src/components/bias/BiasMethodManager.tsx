import React, { useState, useEffect } from 'react'
import { Select, Button, Input, Modal, message, List, Popconfirm, Typography } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { biasMethodService, BiasMethod } from '../../services'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

// Using BiasMethod from services

interface BiasMethodManagerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export const BiasMethodManager: React.FC<BiasMethodManagerProps> = ({
  value,
  onChange,
  placeholder = "Chọn phương pháp BIAS",
  style
}) => {
  const [biasMethods, setBiasMethods] = useState<BiasMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BiasMethod | null>(null)
  const [newMethodName, setNewMethodName] = useState('')
  const [newMethodDesc, setNewMethodDesc] = useState('')

  // Load bias methods
  const loadBiasMethods = async () => {
    try {
      setLoading(true)
      console.log('=== LOADING BIAS METHODS ===')
      const response = await biasMethodService.list({ options: true })
      console.log('Bias methods response:', response)
      
      if (response.data) {
        // Check if data is array or has items property
        const methods = Array.isArray(response.data) ? response.data : response.data.items || []
        console.log('Bias methods data:', methods)
        setBiasMethods(methods)
      } else {
        console.log('No bias methods data')
        setBiasMethods([])
      }
    } catch (error) {
      console.error('Error loading bias methods:', error)
      message.error('Không thể tải danh sách phương pháp BIAS')
      setBiasMethods([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBiasMethods()
  }, [])

  // Create new bias method
  const handleCreate = async () => {
    if (!newMethodName.trim()) {
      message.warning('Nhập tên phương pháp BIAS')
      return
    }

    try {
      await biasMethodService.create({
        name: newMethodName.trim(),
        note: newMethodDesc.trim() || undefined,
      })
      
      message.success('Đã thêm phương pháp BIAS')
      setNewMethodName('')
      setNewMethodDesc('')
      loadBiasMethods()
    } catch (error) {
      console.error('Error creating bias method:', error)
      message.error('Không thể thêm phương pháp BIAS')
    }
  }

  // Update bias method
  const handleUpdate = async () => {
    if (!editing || !editing.name.trim()) {
      message.warning('Nhập tên phương pháp BIAS')
      return
    }

    try {
      await biasMethodService.update(editing.id, {
        id: editing.id,
        name: editing.name.trim(),
        code: editing.name.trim().toUpperCase().replace(/\s+/g, '_'),
        description: editing.description?.trim() || undefined,
      })
      
      message.success('Đã cập nhật phương pháp BIAS')
      setEditing(null)
      loadBiasMethods()
    } catch (error) {
      console.error('Error updating bias method:', error)
      message.error('Không thể cập nhật phương pháp BIAS')
    }
  }

  // Delete bias method
  const handleDelete = async (id: string) => {
    try {
      await biasMethodService.delete(id)
      message.success('Đã xóa phương pháp BIAS')
      loadBiasMethods()
    } catch (error: any) {
      console.error('Error deleting bias method:', error)
      message.error(error.message || 'Không thể xóa phương pháp BIAS')
    }
  }

  return (
    <div style={style}>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%' }}
        loading={loading}
        dropdownRender={(menu) => (
          <div>
            {menu}
            <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
                style={{ width: '100%' }}
              >
                Thêm phương pháp mới
              </Button>
            </div>
          </div>
        )}
      >
        {biasMethods.length > 0 ? biasMethods.map(method => (
          <Option key={method.id} value={method.id}>
            {method.name}
          </Option>
        )) : (
          <Option disabled value="empty">
            Trống
          </Option>
        )}
      </Select>

      {/* Management Modal */}
      <Modal
        title="Quản lý phương pháp BIAS"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
          setNewMethodName('')
          setNewMethodDesc('')
        }}
        footer={null}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Add new method */}
          <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 6 }}>
            <Text strong>Thêm phương pháp mới</Text>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input
                placeholder="Tên phương pháp BIAS"
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
              />
              <TextArea
                placeholder="Mô tả (tùy chọn)"
                value={newMethodDesc}
                onChange={(e) => setNewMethodDesc(e.target.value)}
                rows={2}
              />
              <Button type="primary" onClick={handleCreate} icon={<PlusOutlined />}>
                Thêm
              </Button>
            </div>
          </div>

          {/* List existing methods */}
          <div>
            <Text strong>Danh sách phương pháp hiện có</Text>
            <List
              dataSource={biasMethods}
              renderItem={(method) => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => setEditing(method)}
                    />,
                    <Popconfirm
                      title="Xóa phương pháp này?"
                      onConfirm={() => handleDelete(method.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={method.name}
                    description={method.description}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa phương pháp BIAS"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={handleUpdate}
        okText="Lưu"
        cancelText="Hủy"
      >
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              placeholder="Tên phương pháp BIAS"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <TextArea
              placeholder="Mô tả (tùy chọn)"
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}












