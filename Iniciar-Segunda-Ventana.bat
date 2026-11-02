@echo off
rem Abre una SEGUNDA instancia de EpicKast con un perfil separado (para probar llamadas contigo mismo)
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
start "" "node_modules\electron\dist\electron.exe" . --user-data-dir="%LOCALAPPDATA%\EpicKast-Perfil2"
