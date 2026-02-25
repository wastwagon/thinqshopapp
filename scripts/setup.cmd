@echo off
REM ThinQShop setup for Windows Command Prompt
cd /d "%~dp0\.."
echo ==^> ThinQShop setup
echo.

echo ==^> Installing dependencies (root)...
call npm install
echo.

echo ==^> Installing backend dependencies...
call npm install -w backend 2>nul || (cd backend && call npm install)
echo.

echo ==^> Installing web dependencies...
call npm install -w web 2>nul || (cd web && call npm install)
echo.

echo ==^> Prisma generate...
call npx prisma generate --schema=database/schema.prisma
echo.

echo ==^> Prisma migrate deploy...
call npx prisma migrate deploy --schema=database/schema.prisma
echo.

echo ==^> Setup complete.
echo     Backend:  npm run dev:backend
echo     Web:      npm run dev:web
echo     Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env and backend\.env
echo.
pause
