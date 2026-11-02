@echo off
rem Inicia el servidor EpicKast (usa el Node integrado de Electron: no necesitas instalar Node)
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=1
echo Servidor EpicKast en puerto 7777 (Ctrl+C para detener)
"node_modules\electron\dist\electron.exe" server\server.js
pause
