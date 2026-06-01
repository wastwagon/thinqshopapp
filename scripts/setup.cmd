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
if errorlevel 1 echo Warning: Migrate failed. Is PostgreSQL running? Run "docker compose -f docker-compose.yml up -d db" then retry.
echo.

echo ==^> Seed database...
call npm run db:seed
if errorlevel 1 echo Warning: Seed failed. Run "npm run db:seed" after DB is up.
echo.

echo ==^> Setup complete.
echo     Storefront: http://localhost:7001
echo     API:        http://localhost:7000
echo     Start both: scripts\dev-start.cmd
echo     Or:         npm run dev:backend  ^&  npm run dev:web
echo.
pause
