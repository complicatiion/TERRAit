@echo off
setlocal
cd /d "%~dp0"

echo Starting TERRAit Static Web V1.1.4 on http://127.0.0.1:8080/
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  start "TERRAit" http://127.0.0.1:8080/
  python -m http.server 8080 --bind 127.0.0.1
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "TERRAit" http://127.0.0.1:8080/
  py -m http.server 8080 --bind 127.0.0.1
  goto :eof
)

echo Python was not found. Open this folder with any static web server, for example VS Code Live Server.
pause
REM sksdesign © 2026
