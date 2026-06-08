@echo off
chcp 65001 >nul
title Me Thien Ha - Server
cd /d "%~dp0"

echo ========================================
echo    Me Thien Ha - Quan ly tai chinh
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js tren may.
  echo Tai va cai dat tai: https://nodejs.org
  echo Sau do chay lai file nay.
  echo.
  pause
  exit /b
)

echo Dang khoi dong server tai http://127.0.0.1:8080 ...
echo (De DUNG server: dong cua so server vua mo ra, hoac nhan Ctrl+C trong do)
echo.

start "Me Thien Ha Server" cmd /k npx --yes http-server "%~dp0" -p 8080 -c-1

echo Dang cho server san sang...
timeout /t 4 /nobreak >nul

start "" "http://127.0.0.1:8080"

echo.
echo Da mo app trong trinh duyet!
echo Cua so nay se tu dong dong sau 3 giay...
timeout /t 3 /nobreak >nul
exit
