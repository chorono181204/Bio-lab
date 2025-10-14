@echo off
echo ========================================
echo    KHOI DONG HE THONG QC
echo ========================================
echo.

echo [1/2] Khoi dong Server...
start "QC Server" cmd /k "cd server && npm run dev"

echo.
echo [2/2] Khoi dong Client...
timeout /t 3 /nobreak >nul
start "QC Client" cmd /k "cd electron-vite-boilerplate && npm run dev"

echo.
echo ========================================
echo    HE THONG DANG KHOI DONG...
echo ========================================
echo.
echo Server: http://localhost:4000
echo Client: http://localhost:5173
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul



