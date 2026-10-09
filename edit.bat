@echo off
rem Opens the site editor locally (works even when github.io is filtered).
cd /d "%~dp0"
git pull --ff-only >nul 2>&1
start "site-editor" /min python -m http.server 8770 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" http://localhost:8770/admin.html
