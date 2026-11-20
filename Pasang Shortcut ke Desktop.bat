@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ============================================================
echo   Memasang Shortcut Kasir Philokophi Street ke Desktop...
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR:\=/%"
set "APP_URL=file:///%APP_DIR%index.html"
set "ICON_FILE=%SCRIPT_DIR%app.ico"
set "SHORTCUT_NAME=Kasir Philokophi.lnk"

:: Cari executable browser (utamakan Chrome, lalu Edge)
set "BROWSER_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

:: Jika browser ketemu, buat shortcut langsung ke browser --app=... (tanpa CMD popup)
:: Jika tidak, buat shortcut ke Buka Kasir.bat
if defined BROWSER_EXE (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$ws = New-Object -ComObject WScript.Shell; " ^
      "$desktopPaths = @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:USERPROFILE 'Desktop'), (Join-Path $env:USERPROFILE 'OneDrive\Desktop')); " ^
      "$created = $false; " ^
      "foreach ($d in $desktopPaths) { " ^
      "  if ($d -and (Test-Path $d)) { " ^
      "    $lnkPath = Join-Path $d '%SHORTCUT_NAME%'; " ^
      "    $s = $ws.CreateShortcut($lnkPath); " ^
      "    $s.TargetPath = '%BROWSER_EXE%'; " ^
      "    $s.Arguments = '--app=\"%APP_URL%\"'; " ^
      "    $s.WorkingDirectory = '%SCRIPT_DIR%'; " ^
      "    $s.Description = 'Aplikasi Kasir Philokophi Street'; " ^
      "    if (Test-Path '%ICON_FILE%') { $s.IconLocation = '%ICON_FILE%'; } " ^
      "    $s.Save(); " ^
      "    Write-Host ('[OK] Shortcut berhasil dibuat di: ' + $lnkPath) -ForegroundColor Green; " ^
      "    $created = $true; " ^
      "  } " ^
      "}; " ^
      "if (-not $created) { Write-Host '[!] Tidak dapat mendeteksi folder Desktop.' -ForegroundColor Yellow; }"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$ws = New-Object -ComObject WScript.Shell; " ^
      "$desktopPaths = @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:USERPROFILE 'Desktop'), (Join-Path $env:USERPROFILE 'OneDrive\Desktop')); " ^
      "$created = $false; " ^
      "foreach ($d in $desktopPaths) { " ^
      "  if ($d -and (Test-Path $d)) { " ^
      "    $lnkPath = Join-Path $d '%SHORTCUT_NAME%'; " ^
      "    $s = $ws.CreateShortcut($lnkPath); " ^
      "    $s.TargetPath = '%SCRIPT_DIR%Buka Kasir.bat'; " ^
      "    $s.WorkingDirectory = '%SCRIPT_DIR%'; " ^
      "    $s.Description = 'Aplikasi Kasir Philokophi Street'; " ^
      "    if (Test-Path '%ICON_FILE%') { $s.IconLocation = '%ICON_FILE%'; } " ^
      "    $s.Save(); " ^
      "    Write-Host ('[OK] Shortcut berhasil dibuat di: ' + $lnkPath) -ForegroundColor Green; " ^
      "    $created = $true; " ^
      "  } " ^
      "}; " ^
      "if (-not $created) { Write-Host '[!] Tidak dapat mendeteksi folder Desktop.' -ForegroundColor Yellow; }"
)

echo.
echo ============================================================
echo   Selesai! Sekarang ikon 'Kasir Philokophi' sudah ada di
echo   Desktop komputer Anda.
echo ============================================================
echo.
pause
