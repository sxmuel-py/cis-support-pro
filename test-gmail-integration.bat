@echo off
echo ============================================
echo Gmail Integration Test Script
echo ============================================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please create .env.local with your Gmail credentials.
    exit /b 1
)

echo [1/3] Checking environment variables...
findstr /C:"GOOGLE_SERVICE_ACCOUNT_EMAIL" .env.local >nul
if errorlevel 1 (
    echo ERROR: GOOGLE_SERVICE_ACCOUNT_EMAIL not found in .env.local
    exit /b 1
)

findstr /C:"GOOGLE_PRIVATE_KEY" .env.local >nul
if errorlevel 1 (
    echo ERROR: GOOGLE_PRIVATE_KEY not found in .env.local
    exit /b 1
)

findstr /C:"CRON_SECRET" .env.local >nul
if errorlevel 1 (
    echo ERROR: CRON_SECRET not found in .env.local
    exit /b 1
)

echo ✓ Environment variables found
echo.

echo [2/3] Starting dev server...
echo Please wait for "Ready" message, then press Ctrl+C to continue testing
echo.
call npm run dev

echo.
echo [3/3] To test the cron job manually:
echo.
echo Run this command in a new terminal:
echo curl http://localhost:3000/api/cron/process-emails -H "Authorization: Bearer YOUR_CRON_SECRET"
echo.
echo (Replace YOUR_CRON_SECRET with the value from .env.local)
echo.
pause
