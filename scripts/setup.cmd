@echo off
REM ThinQShop setup for Windows Command Prompt
cd /d "%~dp0\.."
echo ==^> ThinQShop setup
echo.

if not exist .env (
  echo ==^> No .env found. Copying .env.example to .env...
  copy .env.example .env
  echo    Edit .env and set DATABASE_URL, JWT_SECRET, and Paystack keys.
  echo.
)

echo ==^> Installing dependencies (root)...
call npm install
echo.

echo ==^> Prisma generate...
call npx prisma generate --schema=database/schema.prisma
echo.

echo ==^> Prisma migrate deploy...
call npx prisma migrate deploy --schema=database/schema.prisma
if errorlevel 1 echo Warning: Migrate failed. Is PostgreSQL running? Run "npx prisma migrate deploy --schema=database/schema.prisma" after starting the DB.
echo.

echo ==^> Setup complete.
echo     Backend:  npm run dev:backend
echo     Web:      npm run dev:web
echo     Test:     npm run test:local
echo.
pause
