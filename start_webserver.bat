@echo off
setlocal
cd /d "%~dp0"

set TERRAIT_PORT=8080
set TERRAIT_URL=http://127.0.0.1:%TERRAIT_PORT%/

echo Starting TERRAit Static Web V1.1.8 on %TERRAIT_URL%
echo.

where node >nul 2>nul
if %errorlevel%==0 (
  start "TERRAit Local Server" /min cmd /c "node tools\local_server.js %TERRAIT_PORT%"
  timeout /t 1 /nobreak >nul
  start "" "%TERRAIT_URL%"
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "TERRAit Local Server" /min cmd /c "python -m http.server %TERRAIT_PORT% --bind 127.0.0.1"
  timeout /t 1 /nobreak >nul
  start "" "%TERRAIT_URL%"
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "TERRAit Local Server" /min cmd /c "py -m http.server %TERRAIT_PORT% --bind 127.0.0.1"
  timeout /t 1 /nobreak >nul
  start "" "%TERRAIT_URL%"
  goto :eof
)

echo Node.js or Python was not found.
echo Use any static local web server and open %TERRAIT_URL%
pause
REM sksdesign © 2026
