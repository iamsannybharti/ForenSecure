@echo off
cd /d "%~dp0"
echo ========================================================
echo   ForenSecure - Git Commit & Push to All Branches
echo ========================================================
echo.
echo 1. Staging all workspace changes...
git add .

echo 2. Committing changes...
git commit -m "Update ForenSecure UI, Live Classes, Quizzes, 2FA, SMTP Mailer, and AWS CI/CD Pipeline"

echo 3. Pushing to GitHub repository branches...
git push origin --all

echo.
echo ========================================================
echo   ✅ All changes committed and pushed successfully!
echo ========================================================
pause
