@echo off
echo Starting QC Server with PM2...

cd server
pm2 start npm --name "qc-server" -- run dev
pm2 save
pm2 startup

echo.
echo ========================================
echo    SERVER DA CHAY VOI PM2
echo ========================================
echo.
echo Xem status: pm2 status
echo Xem logs: pm2 logs qc-server
echo Dung server: pm2 stop qc-server
echo Khoi dong lai: pm2 restart qc-server
echo.
pause

