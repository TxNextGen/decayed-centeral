@echo off
set "INFO=[INFO]"
set "ERROR=[ERROR]"
set "WARNING=[WARNING]"
set "HEADER================================"

echo %HEADER%
echo Caddy + Next.js Setup Script for Windows
echo %HEADER%

where choco >nul 2>nul
if %errorlevel% neq 0 (
    echo %INFO% Installing Chocolatey...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    refreshenv
) else (
    echo %INFO% Chocolatey already installed
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %INFO% Installing Node.js...
    choco install nodejs -y
    refreshenv
) else (
    echo %INFO% Node.js already installed: 
    node --version
)

where caddy >nul 2>nul
if %errorlevel% neq 0 (
    echo %INFO% Installing Caddy...
    choco install caddy -y
    refreshenv
) else (
    echo %INFO% Caddy already installed:
    caddy version
)

if exist package.json (
    echo %INFO% Installing project dependencies...
    npm install
) else (
    echo %ERROR% package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo %INFO% Building Next.js project...
npm run build
if %errorlevel% neq 0 (
    echo %ERROR% Build failed
    pause
    exit /b 1
)

if not exist "caddy" mkdir caddy

if exist Caddyfile (
    copy Caddyfile caddy\Caddyfile >nul
    echo %INFO% Caddyfile copied to caddy\Caddyfile
) else (
    echo %WARNING% Caddyfile not found. Creating basic configuration...
    (
        echo {
        echo     admin off
        echo     auto_https off
        echo }
        echo.
        echo :80 {
        echo     root * ./public
        echo     try_files {path} {path}.html {path}/index.html /index.html
        echo     
        echo     handle /api/* {
        echo         reverse_proxy localhost:3000
        echo     }
        echo     
        echo     handle /* {
        echo         reverse_proxy localhost:3000
        echo     }
        echo }
    ) > caddy\Caddyfile
)

echo %INFO% Creating startup script...
(
    echo @echo off
    echo echo Starting Next.js application...
    echo start /B npm start
    echo timeout /t 5 /nobreak ^>nul
    echo echo Starting Caddy server...
    echo cd caddy
    echo caddy run --config Caddyfile
) > start.bat

echo %INFO% Creating stop script...
(
    echo @echo off
    echo echo Stopping services...
    echo taskkill /f /im node.exe ^>nul 2^>^&1
    echo taskkill /f /im caddy.exe ^>nul 2^>^&1
    echo echo Services stopped
) > stop.bat

echo.
echo %HEADER%
echo Setup Complete!
echo %HEADER%
echo.
echo %INFO% To start your application, run: start.bat
echo %INFO% To stop your application, run: stop.bat
echo.
echo %INFO% Your site will be available at: http://localhost
echo.
echo %INFO% BYOD Configuration:
echo %INFO% 1. Edit caddy\Caddyfile to add your domain
echo %INFO% 2. Uncomment and modify the BYOD template section
echo %INFO% 3. Restart using start.bat
echo.
pause
