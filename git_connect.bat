@echo off
cd /d "%~dp0"
echo ========================================================
echo   ForenSecure - Connect Local Workspace to GitHub Dev Branch
echo ========================================================
echo.

:: Clean up empty .git directory if it is causing issues
if exist .git (
    rmdir /s /q .git >nul 2>&1
)

echo 1. Initializing local Git repository...
git init

echo.
echo 2. Adding remote origin...
git remote add origin https://github.com/iamsannybharti/ForenSecure.git

echo.
echo 3. Fetching remote branches...
git fetch origin

echo.
echo 4. Creating and switching to local 'Dev' branch...
git checkout -b Dev

echo.
echo 5. Pulling from remote 'Dev' branch (merging with ours in case of conflicts)...
git pull origin Dev --allow-unrelated-histories -X ours

echo.
echo 6. Setting upstream tracking branch to origin/Dev...
git branch --set-upstream-to=origin/Dev Dev

echo.
echo 7. Staging local files...
git add .

echo.
echo 8. Committing files...
git commit -m "Connect local workspace to remote Dev branch"

echo.
echo 9. Pushing to GitHub Dev branch...
git push -u origin Dev

echo.
echo ========================================================
echo   Repository connected and pushed to 'Dev' successfully!
echo ========================================================
pause
