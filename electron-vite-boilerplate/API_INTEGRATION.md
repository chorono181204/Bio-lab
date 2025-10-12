# Hướng dẫn tích hợp API Frontend-Backend

## Cấu trúc dự án

### Frontend (`electron-vite-boilerplate/src/`)
```
src/
├── services/              # API services
│   ├── auth.service.ts
│   ├── analyte.service.ts
│   ├── lot.service.ts
│   ├── machine.service.ts
│   ├── qcLevel.service.ts
│   ├── entry.service.ts
│   ├── limit.service.ts
│   ├── violation.service.ts
│   ├── westgard.service.ts
│   ├── biasMethod.service.ts
│   ├── department.service.ts
│   ├── user.service.ts
│   ├── lookup.service.ts
│   └── index.ts
├── hooks/                 # React hooks
│   ├── useAuth.tsx       # Authentication hook
│   ├── useApi.ts         # API call hook với loading states
│   ├── usePagination.ts  # Pagination hook
│   └── index.ts
├── utils/
│   └── api.ts            # Axios configuration
└── config/
    └── env.ts            # Environment config
```

### Backend (`server/src/`)
```
server/src/
├── routes/               # API routes
├── controllers/          # Request handlers
├── services/            # Business logic
├── middleware/          # Express middleware
├── libs/
│   ├── auth/           # JWT auth strategies
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── config/
│   ├── db.ts           # Prisma client
│   └── env.ts          # Environment config
├── app.ts              # Express app
└── server.ts           # Entry point
```

## Cách sử dụng API trong Frontend

### 1. Authentication
```typescript
import { useAuth } from '../hooks'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  const handleLogin = async () => {
    const success = await login('username', 'password')
    if (success) {
      // Login thành công
    }
  }
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Xin chào {user?.fullName}</p>
      ) : (
        <button onClick={handleLogin}>Đăng nhập</button>
      )}
    </div>
  )
}
```

### 2. CRUD Operations với useApi hook
```typescript
import { useApi } from '../hooks'
import { analyteService } from '../services'

function AnalytesPage() {
  const { data, loading, error, execute } = useApi(analyteService.list)
  
  useEffect(() => {
    execute({ page: 1, pageSize: 20 })
  }, [])
  
  if (loading) return <Spin />
  if (error) return <div>Error: {error}</div>
  
  return (
    <Table dataSource={data?.items} loading={loading} />
  )
}
```

### 3. Pagination
```typescript
import { usePagination } from '../hooks'

function MyTable() {
  const pagination = usePagination({ initialPage: 1, initialPageSize: 20 })
  
  return (
    <Table
      pagination={{
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: pagination.setPage,
      }}
    />
  )
}
```

### 4. Direct API Calls
```typescript
import { analyteService } from '../services'

// Create
const newAnalyte = await analyteService.create({
  code: 'GLU',
  name: 'Glucose',
  unit: 'mg/dL'
})

// Update
await analyteService.update('id', { name: 'New Name' })

// Delete
await analyteService.delete('id')

// List với options mode (cho dropdowns)
const options = await analyteService.list({ options: true })
```

## Cấu hình

### Frontend Environment
Tạo file `.env.local`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend Environment
File `server/src/config/env.ts` đã cấu hình sẵn với các giá trị mặc định:
- PORT: 3000
- JWT_SECRET: (sẽ đổi khi deploy)
- DATABASE_URL: file:./prisma/data/iqc.db

## API Endpoints

### Auth
- POST `/api/auth/login` - Đăng nhập
- GET `/api/auth/me` - Lấy thông tin user hiện tại

### Lookups
- GET `/api/lookups/init` - Lấy tất cả data init (lots, machines, qcLevels, analytes)
- GET `/api/lots/:id/machines` - Lấy machines theo lot
- GET `/api/lots/:id/qc-levels` - Lấy QC levels theo lot

### Resources (CRUD đầy đủ)
- `/api/analytes`
- `/api/lots`
- `/api/machines`
- `/api/qc-levels`
- `/api/limits`
- `/api/entries`
- `/api/violations`
- `/api/westgard-rules`
- `/api/bias-methods`
- `/api/departments` (admin only)
- `/api/users` (admin only)

Mỗi resource hỗ trợ:
- GET `/` - List (với pagination, search, filters)
- GET `/:id` - Get by ID
- POST `/` - Create
- PUT `/:id` - Update
- DELETE `/:id` - Delete

### Query Parameters
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `search` - Search term
- `options=true` - Trả về slim array cho dropdowns (không pagination)
- Resource-specific filters (lotId, machineId, qcLevelId, etc.)

## Khởi chạy

### Backend
```bash
cd server
npm run dev
# Server sẽ chạy ở http://localhost:3000
```

### Frontend
```bash
cd electron-vite-boilerplate
npm run dev
# Frontend sẽ chạy ở http://localhost:9999
```

## Lưu ý quan trọng

1. **Authentication**: Token tự động lưu vào localStorage và attach vào mọi request
2. **Token expiration**: Khi token hết hạn (401), tự động redirect về login
3. **Department scoping**: Data tự động filter theo department của user
4. **Error handling**: Tất cả error đều được handle và hiển thị message tiếng Việt
5. **Loading states**: useApi hook tự động quản lý loading states
6. **Pagination**: usePagination hook tự động quản lý pagination logic

## Migration từ IPC sang API

### Trước (IPC):
```typescript
const result = await window.iqc.analytes.list()
```

### Sau (API):
```typescript
import { analyteService } from '../services'
const result = await analyteService.list()
```

Cấu trúc response giống nhau, chỉ thay đổi cách gọi!






