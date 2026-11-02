'use strict';
/**
 * Hook afterPack de electron-builder:
 *  1) Estampa el icono multi-resolución (build/icon.ico) y metadatos PE en EpicKast.exe usando rcedit.exe,
 *     para que el acceso directo del Escritorio, menú Inicio y Barra de tareas muestren siempre el logo EK.
 *  2) Endurece los Electron Fuses en el ejecutable empaquetado (EpicKast.exe) para producción,
 *     siguiendo el reporte de REA `inspect-electron-fuses`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SENTINEL = Buffer.from('dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX', 'utf8');

exports.default = async function afterPack(context) {
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  if (!fs.existsSync(exe)) return;

  // 1) Estampar icono EK y metadatos en el ejecutable de Windows (.exe)
  const rcedit = path.join(__dirname, '..', 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe');
  const ico = path.join(__dirname, '..', 'build', 'icon.ico');
  if (fs.existsSync(rcedit) && fs.existsSync(ico)) {
    const ver = context.packager.appInfo.version || '1.3.0';
    execFileSync(rcedit, [
      exe,
      '--set-icon', ico,
      '--set-version-string', 'FileDescription', 'EpicKast',
      '--set-version-string', 'ProductName', 'EpicKast',
      '--set-version-string', 'CompanyName', 'EpicKap',
      '--set-version-string', 'InternalName', 'EpicKast',
      '--set-version-string', 'OriginalFilename', 'EpicKast.exe',
      '--set-file-version', ver,
      '--set-product-version', ver,
    ]);
    console.log('[Icono EK] Estampado build/icon.ico en:', exe);
  }

  // 2) Endurecer Electron Fuses
  const buf = fs.readFileSync(exe);
  const idx = buf.indexOf(SENTINEL);
  if (idx < 0) return;
  const fuseStart = idx + SENTINEL.length + 2; // wire_version (1B) + fuse_length (1B)
  buf[fuseStart + 0] = 48; // RunAsNode = disabled
  buf[fuseStart + 1] = 49; // EnableCookieEncryption = enabled
  buf[fuseStart + 2] = 48; // EnableNodeOptionsEnvironmentVariable = disabled
  buf[fuseStart + 3] = 48; // EnableNodeCliInspectArguments = disabled
  buf[fuseStart + 4] = 48; // EnableEmbeddedAsarIntegrityValidation = disabled
  buf[fuseStart + 5] = 49; // OnlyLoadAppFromAsar = enabled
  fs.writeFileSync(exe, buf);
  console.log('[REA Fuses] Endurecidos los fuses de seguridad en:', exe);
};
