@echo off
echo ===================================================
echo   ForenSecure - Startup Launcher
echo ===================================================
echo.

echo [1/2] Launching Backend Server (Installing, Seeding and Running)...
start cmd /k "echo Starting Backend... && cd backend && npm install && npm run seed && npm run dev"

echo.
echo [2/2] Launching Frontend Server (Installing and Running)...
start cmd /k "echo Starting Frontend... && cd frontend && npm install && npm run dev"

echo.
echo ===================================================
echo   Startup initiated. Separated windows opened.
echo ===================================================
pause
