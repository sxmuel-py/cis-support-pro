@echo off
setlocal
echo ===========================================
echo 🚀 Automated GitHub Push Script
echo ===========================================

:: Navigate to the script's directory (project root)
cd /d "%~dp0"

echo.
echo [1/6] Configuring Git Identity...
git config --global user.email "samuel.maps.helper@gmail.com"
git config --global user.name "sxmuel-py"

echo.
echo [2/6] Initializing Repository...
if not exist .git (
    git init
    git branch -M main
    echo    Initialized new repository.
) else (
    echo    Repository already initialized.
)

echo.
echo [3/6] Setting Remote Origin...
:: Remove existing origin to avoid conflicts/errors
git remote remove origin >nul 2>&1
git remote add origin https://github.com/sxmuel-py/cis-support-pro.git
echo    Remote set to: https://github.com/sxmuel-py/cis-support-pro.git

echo.
echo [4/6] Adding Files...
git add .

echo.
echo [5/6] Committing Changes...
git commit -m "Automated deployment commit"
if %errorlevel% equ 0 (
    echo    Changes committed.
) else (
    echo    No changes to commit (or commit failed).
)

echo.
echo [6/6] Pushing to GitHub...
echo    Please wait...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ===========================================
    echo ❌ PUSH FAILED!
    echo ===========================================
    echo.
    echo Possible reasons:
    echo 1. The repository 'cis-support-pro' does NOT exist on your GitHub account.
    echo    -> Go to https://github.com/new and create it first!
    echo.
    echo 2. You don't have internet access.
    echo.
    echo 3. Credentials issue (if prompted, sign in via browser).
    echo.
) else (
    echo.
    echo ===========================================
    echo ✅ SUCCESS! Code pushed to GitHub.
    echo ===========================================
    echo.
    echo You can now proceed to Vercel to import this project.
)

echo.
pause
