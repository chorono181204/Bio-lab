@echo off
echo ========================================
echo    HUONG DAN CAI DAT HE THONG QC
echo ========================================
echo.

echo [1/6] Clone repository...
git clone https://github.com/chorono181204/Bio-lab.git
cd Bio-lab

echo.
echo [2/6] Cai dat Server...
cd server
call npm install

echo.
echo [3/6] Cai dat Database...
call npx prisma generate
call npx prisma migrate dev --name init

echo.
echo [4/6] Seed data...
call npx ts-node scripts/seed-data.ts

echo.
echo [5/6] Cai dat Client...
cd ..\electron-vite-boilerplate
call npm install

echo.
echo [6/6] Hoan thanh!
echo.
echo ========================================
echo    CAC LENH DE CHAY HE THONG
echo ========================================
echo.
echo 1. Chay Server (Terminal 1):
echo    cd server
echo    npm run dev
echo.
echo 2. Chay Client (Terminal 2):
echo    cd electron-vite-boilerplate
echo    npm run dev
echo.
echo ========================================
echo    TAI KHOAN MAC DINH
echo ========================================
echo Admin: admin / 123456
echo Manager HEM: manager-hem / 123456
echo Manager BIO: manager-bio / 123456
echo Manager MIC: manager-mic / 123456
echo.
pause



