@echo off
REM Free ports 7000/7001 and start backend (7000) and web (7001).
cd /d "%~dp0\.."

echo ==^> Freeing ports 7000 and 7001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo.

echo ==^> Starting backend on http://localhost:7000 ...
start "ThinQShop Backend" cmd /k "set PORT=7000 && npm run dev:backend"
timeout /t 12 /nobreak >nul

echo ==^> Starting web storefront on http://localhost:7001 ...
start "ThinQShop Web" cmd /k "npm run dev:web"
timeout /t 3 /nobreak >nul

echo.
echo ==^> Ready
echo     API:        http://localhost:7000
echo     Storefront: http://localhost:7001  ^<- open this in your browser
echo.
pause
