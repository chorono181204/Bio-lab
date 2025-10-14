@echo off
echo Starting QC Server...
cd server
start /B npm run dev
echo Server started in background
echo Check http://localhost:4000
pause

