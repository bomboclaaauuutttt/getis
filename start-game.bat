@echo off
cd /d "%~dp0"
start "Police Getaway Server" /min cmd /c "node server.js"
timeout /t 1 /nobreak >nul
start "" "http://localhost:5173"
