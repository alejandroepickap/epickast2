@echo off
cd /d "%~dp0"
start "EpicKast Servidor" /min cmd /c Iniciar-Servidor.bat
timeout /t 2 >nul
call Iniciar-EpicKast.bat
