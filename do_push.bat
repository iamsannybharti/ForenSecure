@echo off
cd /d "%~dp0"

echo Updating remote to ForenSecure...
git remote set-url origin https://github.com/iamsannybharti/ForenSecure.git

echo Fetching remote...
git fetch origin

echo Checking out Dev branch (or creating it)...
git checkout Dev 2>nul || git checkout -b Dev

echo Staging all changes...
git add .

echo Committing...
git commit -m "ForenSecure UI update - Figma workspace sync" --allow-empty

echo Pushing to origin/Dev...
git push -u origin Dev

echo Done!
pause
