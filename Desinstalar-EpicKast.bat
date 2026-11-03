@echo off
chcp 65001 >nul
title Desinstalador Limpio de EpicKast

echo ==========================================================
echo               DESINSTALADOR DE EPICKAST
echo ==========================================================
echo.
echo [1/4] Cerrando procesos de EpicKast...
taskkill /f /im "EpicKast.exe" >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] Eliminando archivos de la aplicacion...
if exist "%LOCALAPPDATA%\Programs\epickast" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\epickast" >nul 2>&1
)

echo [3/4] Eliminando accesos directos de Windows y OneDrive...
del /f /q /a "%USERPROFILE%\OneDrive\Escritorio\*EpicKast*.lnk" >nul 2>&1
del /f /q /a "%USERPROFILE%\Desktop\*EpicKast*.lnk" >nul 2>&1
del /f /q /a "%USERPROFILE%\OneDrive\Desktop\*EpicKast*.lnk" >nul 2>&1
del /f /q /a "%PUBLIC%\Desktop\*EpicKast*.lnk" >nul 2>&1
del /f /q /a "%APPDATA%\Microsoft\Windows\Start Menu\Programs\*EpicKast*.lnk" >nul 2>&1
powershell -NoProfile -Command "Get-ChildItem -Path ([Environment]::GetFolderPath('Desktop')), ([Environment]::GetFolderPath('CommonDesktopDirectory')), '$env:USERPROFILE\Desktop', '$env:USERPROFILE\OneDrive\Desktop', '$env:USERPROFILE\OneDrive\Escritorio', '$env:PUBLIC\Desktop' -Filter '*EpicKast*.lnk' -ErrorAction SilentlyContinue | Remove-Item -Force" >nul 2>&1

echo [4/4] Limpiando registro de desinstalacion de Windows...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\com.epickap.epickast" /f >nul 2>&1
reg delete "HKCU\Software\com.epickap.epickast" /f >nul 2>&1

echo.
echo ==========================================================
echo    EPICKAST HA SIDO DESINSTALADO CON EXITO DE TU EQUIPO
echo ==========================================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
exit
