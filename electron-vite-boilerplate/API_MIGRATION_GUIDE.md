# Hướng Dẫn Migration Pages sang API - Chi Tiết

## 📋 Tổng quan

Tài liệu này hướng dẫn chi tiết cách migration từng page từ IPC sang REST API, dựa trên pattern đã implement thành công ở **AnalytesPage**.

## ✅ Pattern Migration Chuẩn

### Bước 1: Import Services & Hooks

```typescript
// Thêm vào đầu file
import { useApi, usePagination } from '../hooks'
import { [resource]Service, [Resource] } from '../services'

// Ví dụ cho LotsPage:
import { lotService, Lot, machineService, qcLevelService } from '../services'
```

### Bước 2: Replace State Management

```typescript
// ❌ CŨ (IPC):
const [data, setData] = useState<Lot[]>([])
const [loading, setLoading] = useState(true)

// ✅ MỚI (API):
const { data: apiData, loading, execute: loadData } = useApi(lotService.list)
const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
const data = apiData && 'items' in apiData ? apiData.items : (apiData as Lot[] || [])
```

### Bước 3: Data Loading với useEffect

```typescript
// ✅ MỚI: Debounced search + pagination
const [searchText, setSearchText] = useState('')
const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
  return () => clearTimeout(timer)
}, [searchText])

useEffect(() => {
  loadData({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: debouncedSearchText || undefined
  })
}, [pagination.page, pagination.pageSize, debouncedSearchText])

useEffect(() => {
  if (apiData && 'total' in apiData) {
    pagination.setTotal(apiData.total)
  }
}, [apiData])
```

### Bước 4: Replace CRUD Operations

```typescript
// ❌ CŨ (IPC):
const onDelete = async (id: string) => {
  await (window as any).iqc?.lots?.delete?.(id)
  setData(prev => prev.filter(x => x.id !== id))
}

const onOk = async () => {
  const values = await form.validateFields()
  if (editing) {
    await (window as any).iqc?.lots?.update?.(values)
    setData(prev => prev.map(x => x.id === editing.id ? { ...values } : x))
  } else {
    const created = await (window as any).iqc?.lots?.create?.(values)
    setData(prev => [created, ...prev])
  }
  setOpen(false)
}

// ✅ MỚI (API):
const onDelete = async (id: string) => {
  try {
    await lotService.delete(id)
    message.success('Xóa thành công')
    loadData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined
    })
  } catch (error) {
    message.error('Có lỗi xảy ra khi xóa')
  }
}

const onOk = async () => {
  try {
    const values = await form.validateFields()
    if (editing) {
      await lotService.update(editing.id, values)
      message.success('Cập nhật thành công')
    } else {
      await lotService.create(values)
      message.success('Tạo mới thành công')
    }
    setOpen(false)
    loadData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined
    })
  } catch (error) {
    message.error('Có lỗi xảy ra')
  }
}
```

### Bước 5: Update Table Component

```typescript
<Table
  rowKey="id"
  columns={columns}
  dataSource={data}
  loading={loading}
  pagination={{
    current: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
    onChange: pagination.setPage,
    onShowSizeChange: (_, size) => pagination.setPageSize(size)
  }}
  scroll={{ x: 1000 }}
/>
```

## 📝 Migration Checklist cho từng Page

### LotsPage
- [ ] Import `lotService, machineService, qcLevelService`
- [ ] Replace state với `useApi` và `usePagination`
- [ ] Add debounced search
- [ ] Replace CRUD operations
- [ ] Load machines & QC levels cho dropdown (use `lookupService.getInitData()`)
- [ ] Update Table pagination
- [ ] Test all operations

### MachinesPage  
- [ ] Import `machineService, lotService`
- [ ] Replace state
- [ ] Add lot filter: `?lotId=xxx`
- [ ] Replace CRUD
- [ ] Update Table

### QcSetupPage (QC Levels)
- [ ] Import `qcLevelService, lotService`
- [ ] Replace state
- [ ] Replace CRUD
- [ ] Handle lot linking logic

### LimitsPage
- [ ] Import `limitService, lotService, machineService, qcLevelService, analyteService`
- [ ] Multi-filter: lot + machine + qcLevel + analyte
- [ ] Complex data loading
- [ ] Update import/export

### EntryPageSimple
- [ ] Import `entryService, limitService, westgardService`
- [ ] Month filter: `?month=YYYY-MM`
- [ ] Westgard validation
- [ ] Import/export với date handling

### UsersPage
- [ ] Import `userService, departmentService`
- [ ] Password change API
- [ ] Admin-only operations

### HomePage
- [ ] Stats từ multiple services
- [ ] Dashboard data aggregation

### LJPage
- [ ] Chart data từ `entryService`
- [ ] Date range filtering

### WestgardPage
- [ ] Import `westgardService`
- [ ] Rules management
- [ ] Active/inactive toggle

### ProfilePage
- [ ] User profile update
- [ ] Password change

## 🔧 Helper Patterns

### Load Dropdown Options
```typescript
// Cách 1: Init data (recommended for page load)
useEffect(() => {
  const loadInitData = async () => {
    const { data } = await lookupService.getInitData()
    setLotOptions(data.lots)
    setMachineOptions(data.machines)
    setQcLevelOptions(data.qcLevels)
    setAnalyteOptions(data.analytes)
  }
  loadInitData()
}, [])

// Cách 2: Options mode
const loadLots = async () => {
  const { data } = await lotService.list({ options: true })
  setLotOptions(data)
}

// Cách 3: Dependent lookup
const loadMachinesByLot = async (lotId: string) => {
  const { data } = await lotService.getMachines(lotId)
  setMachineOptions(data)
}
```

### Handle Import/Export
```typescript
// Import vẫn giữ nguyên logic, chỉ thay reload data
const handleImport = async (file: File) => {
  try {
    const results = await importFromXlsx(file, currentUser)
    // Reload from API instead of IPC
    loadData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchText || undefined
    })
    message.success(`Import thành công: ${results.created} tạo mới, ${results.updated} cập nhật`)
  } catch (error) {
    message.error('Lỗi khi import file')
  }
}

// Export vẫn giữ nguyên
const handleExport = async () => {
  try {
    await exportToXlsx()
    message.success('Xuất file thành công')
  } catch (error) {
    message.error('Lỗi khi xuất file')
  }
}
```

## ⚠️ Common Issues & Solutions

### Issue 1: Type conflicts
```typescript
// Problem: Analyte type khác giữa IPC và API
// Solution: Sử dụng type từ services
import { Analyte } from '../services'

// Hoặc map data nếu cần
const mappedData = data.map(item => ({
  ...item,
  qualityRequirement: item.qualityRequirement ?? item.quality_requirement
}))
```

### Issue 2: Pagination không update
```typescript
// Problem: Total không cập nhật
// Solution: Thêm useEffect để sync total
useEffect(() => {
  if (apiData && 'total' in apiData) {
    pagination.setTotal(apiData.total)
  }
}, [apiData])
```

### Issue 3: Search spam API
```typescript
// Problem: Mỗi keystroke gọi API
// Solution: Debounce search
const [debouncedSearchText, setDebouncedSearchText] = useState(searchText)
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearchText(searchText), 500)
  return () => clearTimeout(timer)
}, [searchText])
```

## 🎯 Priority Order (đã optimize)

1. **AnalytesPage** ✅ - HOÀN THÀNH
2. **LotsPage** - Cơ bản, có linked data
3. **MachinesPage** - Đơn giản, có filtering
4. **QcSetupPage** - Đơn giản
5. **UsersPage** - Đơn giản
6. **LimitsPage** - Phức tạp, nhiều filters
7. **EntryPageSimple** - Phức tạp, Westgard + import/export
8. **HomePage** - Stats aggregation
9. **LJPage** - Chart data
10. **WestgardPage** - Rules management
11. **ProfilePage** - User profile

## 📊 Progress Tracking

- [x] AnalytesPage
- [ ] LotsPage
- [ ] MachinesPage
- [ ] QcSetupPage
- [ ] UsersPage
- [ ] LimitsPage
- [ ] EntryPageSimple
- [ ] HomePage
- [ ] LJPage
- [ ] WestgardPage
- [ ] ProfilePage

Sau khi migration xong, test kỹ từng page để đảm bảo:
- ✅ CRUD operations hoạt động
- ✅ Pagination chính xác
- ✅ Search hoạt động
- ✅ Loading states hiển thị đúng
- ✅ Error handling user-friendly
- ✅ Import/Export vẫn hoạt động







