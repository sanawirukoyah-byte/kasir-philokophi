@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "APP_DIR=%~dp0"
set "APP_DIR=%APP_DIR:\=/%"
set "APP_URL=file:///%APP_DIR%index.html"

:: 1. Prioritaskan Google Chrome jika ada
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit /b
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit /b
)

:: 2. Gunakan Microsoft Edge
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%"
    exit /b
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%"
    exit /b
)

:: 3. Cek di PATH sistem
where chrome >nul 2>nul && ( start "" chrome --app="%APP_URL%" & exit /b )
where msedge >nul 2>nul && ( start "" msedge --app="%APP_URL%" & exit /b )

:: 4. Fallback ke browser default
start "" "%~dp0index.html"
exit /b
