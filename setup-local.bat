@echo off
REM Local Setup Script for Windows
REM Run this to set up and validate the project locally

echo.
echo MS Studio Build - Local Setup
echo ==============================
echo.

REM Check prerequisites
echo [1/6] Checking prerequisites...

where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: pnpm not found. Install it with: npm install -g pnpm
  exit /b 1
)
echo   OK: pnpm found

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js not found
  exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   OK: Node.js %NODE_VERSION%

REM Check .env file
echo.
echo [2/6] Checking environment configuration...

if not exist .env (
  echo ERROR: .env file not found at repo root.
  echo        Create one with the required variables - see .github/instructions/project-configuration.instructions.md
  exit /b 1
)

findstr /C:"DATABASE_URL" .env >nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: DATABASE_URL not set in .env
  exit /b 1
)
echo   OK: DATABASE_URL configured

findstr /C:"VITE_CLERK_PUBLISHABLE_KEY" .env >nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: VITE_CLERK_PUBLISHABLE_KEY not set in .env
  exit /b 1
)
echo   OK: VITE_CLERK_PUBLISHABLE_KEY configured

findstr /C:"CLERK_SECRET_KEY" .env >nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: CLERK_SECRET_KEY not set in .env
  exit /b 1
)
echo   OK: CLERK_SECRET_KEY configured

REM Install dependencies
echo.
echo [3/6] Installing dependencies...
call pnpm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: pnpm install failed
  exit /b 1
)
echo   OK: Dependencies installed

REM Generate Prisma client
echo.
echo [4/6] Generating Prisma client...
call pnpm prisma:generate
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Prisma client generation failed
  exit /b 1
)
echo   OK: Prisma client generated

REM Apply database migrations
echo.
echo [5/6] Applying database migrations...
echo       This will sync your schema to the configured DATABASE_URL...
call pnpm prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Database migration failed - check your DATABASE_URL and network connectivity
  exit /b 1
)
echo   OK: Database migrations applied

REM Run type check
echo.
echo [6/6] Running TypeScript validation...
call pnpm check
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: TypeScript check failed - review the errors above
  exit /b 1
)
echo   OK: TypeScript validation passed

REM Success
echo.
echo Setup complete!
echo.
echo To start developing:
echo   pnpm dev:full    ^(recommended - starts API + main app + customer portal^)
echo   pnpm dev         ^(Vite only, no API server^)
echo   pnpm dev:api     ^(API server only, port 3010^)
echo.
echo Ports: main app :3003  ^|  customer portal :3004  ^|  API :3010
echo.
echo See .github/instructions/ for full setup documentation.
