@echo off
REM Local Testing Script for Windows
REM Run this to set up and test the project locally

echo.
echo 🧪 MS Studio Build - Local Testing Setup
echo ========================================
echo.

REM Check prerequisites
echo 1️⃣  Checking prerequisites...

where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ pnpm not found. Install it with: npm install -g pnpm
  exit /b 1
)
echo ✅ pnpm found

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js not found
  exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check .env file
echo.
echo 2️⃣  Checking environment configuration...

if not exist .env (
  echo ❌ .env file not found
  exit /b 1
)

findstr /M "DATABASE_URL" .env >nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ DATABASE_URL not set in .env
  exit /b 1
)
echo ✅ .env configured with DATABASE_URL

findstr /M "CLERK_SECRET_KEY" .env >nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ CLERK_SECRET_KEY not set in .env
  exit /b 1
)
echo ✅ CLERK_SECRET_KEY configured

REM Install dependencies
echo.
echo 3️⃣  Installing dependencies...
call pnpm install
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ Dependencies installed

REM Generate Prisma client
echo.
echo 4️⃣  Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ Prisma client generated

REM Apply database schema
echo.
echo 5️⃣  Applying database schema...
echo    This will create tables in your Railway database...
call npx prisma db push --skip-generate
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ Database schema applied

REM Run type check
echo.
echo 6️⃣  Running TypeScript validation...
call pnpm check
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ TypeScript validation passed

REM Success
echo.
echo ✨ Setup complete!
echo.
echo 🚀 To start developing:
echo    pnpm dev
echo.
echo 📚 For testing guide, see: LOCAL-TESTING.md
echo 📊 For validation report, see: SETUP-VALIDATION-REPORT.md
