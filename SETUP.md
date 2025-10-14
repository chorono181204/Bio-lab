# Hướng dẫn cài đặt và chạy hệ thống QC

## Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- Git

## Cài đặt

### 1. Clone repository
```bash
git clone https://github.com/chorono181204/Bio-lab.git
cd Bio-lab
```

### 2. Cài đặt Server
```bash
cd server
npm install
```

### 3. Cài đặt Database
```bash
# Tạo database
npx prisma generate
npx prisma migrate dev --name init

# Seed data (tạo dữ liệu mẫu)
npx ts-node scripts/seed-data.ts
```

### 4. Chạy Server
```bash
npm run dev
# Server sẽ chạy tại http://localhost:4000
```

### 5. Cài đặt Client (Terminal mới)
```bash
cd electron-vite-boilerplate
npm install
```

### 6. Chạy Client
```bash
npm run dev
# Client sẽ chạy tại http://localhost:5173
```

## Tài khoản mặc định

### Admin
- Username: `admin`
- Password: `123456`

### Manager (Trưởng khoa)
- Username: `manager-hem` (Huyết học)
- Username: `manager-bio` (Hóa sinh)  
- Username: `manager-mic` (Vi sinh)
- Password: `123456`

## Build ứng dụng

### Build Client (Electron)
```bash
cd electron-vite-boilerplate
npm run build
# File exe sẽ được tạo trong thư mục release/
```

### Build Server
```bash
cd server
npm run build
# File build sẽ được tạo trong thư mục dist/
```

## Cấu hình

### Thay đổi URL Server
1. Mở ứng dụng
2. Vào trang "Cấu hình kết nối"
3. Nhập URL server mới
4. Lưu cấu hình

### Thay đổi Port Server
Sửa file `server/src/server.ts`:
```typescript
const PORT = process.env.PORT || 4000
```

## Troubleshooting

### Lỗi database
```bash
# Xóa database cũ
rm -rf prisma/data/
# Tạo lại
npx prisma migrate dev --name init
npx ts-node scripts/seed-data.ts
```

### Lỗi port đã sử dụng
```bash
# Tìm process đang dùng port
netstat -ano | findstr :4000
# Kill process
taskkill /PID <PID> /F
```

### Lỗi build Electron
```bash
# Xóa cache
npm run clean
# Cài lại dependencies
rm -rf node_modules package-lock.json
npm install
```

## Cấu trúc thư mục
```
Bio-lab/
├── server/                 # Backend API
│   ├── src/
│   ├── prisma/            # Database schema
│   └── scripts/           # Seed data
├── electron-vite-boilerplate/  # Frontend Electron
│   ├── src/
│   ├── electron/
│   └── public/
└── SETUP.md              # File này
```

## Liên hệ hỗ trợ
Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.



