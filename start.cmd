@echo off
cd /d "%~dp0"
where /q node
if errorlevel 1 (
  echo Install Node.js 24 or newer from https://nodejs.org first.
  pause
  exit /b 2
)
node cli.mjs --web
pause
