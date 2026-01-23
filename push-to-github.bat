@echo off
echo ===========================================
echo 🚀 Automated GitHub Push Script (Simplified)
echo ===========================================
cd /d "%~dp0"

echo.
echo [1/5] Configuring Git...
git config --global user.email "samuel.maps.helper@gmail.com"
git config --global user.name "sxmuel-py"

echo.
echo [2/5] Initializing...
if not exist .git git init
git branch -M main

echo.
echo [3/5] Setting Remote...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/sxmuel-py/cis-support-pro.git

echo.
echo [4/5] Adding and Committing...
git add .
:: This might say "nothing to commit" if you already ran it, which is fine!
git commit -m "Automated deployment commit"

echo.
echo [5/5] Pushing to GitHub...
git push -u origin main

echo.
echo ===========================================
echo If you see a URL above, it worked!
echo ===========================================
pause
