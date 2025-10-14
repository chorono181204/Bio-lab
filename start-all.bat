@echo off
echo ========================================
echo    KHOI DONG HE THONG QC
echo ========================================
echo.

echo [1/2] Khoi dong Server (ngam)...
cd server
start /B npm run dev
echo Server da chay tai http://localhost:4000

echo.
echo [2/2] Khoi dong Client...
cd ..\electron-vite-boilerplate
start /B npm run dev
echo Client da chay tai http://localhost:5173

echo.
echo ========================================
echo    HE THONG DANG CHAY NGAN!
echo ========================================
echo.
echo Server: http://localhost:4000
echo Client: http://localhost:5173
echo.
echo Nhan phim bat ky de dong...
pause >nul

