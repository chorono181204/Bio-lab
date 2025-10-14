@echo off
echo ========================================
echo    RESET DATABASE
echo ========================================
echo.

echo [1/3] Dang reset database...
cd server
call npx prisma migrate reset --force

echo.
echo [2/3] Dang seed data...
call npx ts-node scripts/seed-data.ts

echo.
echo [3/3] Hoan thanh!
echo.
echo ========================================
echo    DATABASE DA DUOC RESET VA SEED
echo ========================================
echo.
echo Tai khoan mac dinh:
echo - Admin: admin / 123456
echo - Manager HEM: manager-hem / 123456
echo - Manager BIO: manager-bio / 123456
echo - Manager MIC: manager-mic / 123456
echo.
pause

