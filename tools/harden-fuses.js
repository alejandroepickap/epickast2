'use strict';
/**
 * Endurece los Electron Fuses en el ejecutable empaquetado (EpicKast.exe) para producción,
 * siguiendo el reporte de REA `inspect-electron-fuses`:
 *  - RunAsNode (0): disabled ('0')
 *  - EnableCookieEncryption (1): enabled ('1')
 *  - EnableNodeOptionsEnvironmentVariable (2): disabled ('0')
 *  - EnableNodeCliInspectArguments (3): disabled ('0')
 *  - EnableEmbeddedAsarIntegrityValidation (4): disabled ('0' en Windows sin código firmado EV)
 *  - OnlyLoadAppFromAsar (5): enabled ('1')
 */
const fs = require('node:fs');
const path = require('node:path');

const SENTINEL = Buffer.from('dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX', 'utf8');

exports.default = async function afterPack(context) {
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  if (!fs.existsSync(exe)) return;
  const buf = fs.readFileSync(exe);
  const idx = buf.indexOf(SENTINEL);
  if (idx < 0) return;
  const fuseStart = idx + SENTINEL.length + 2; // wire_version (1B) + fuse_length (1B)
  // '0' = 48 (disabled), '1' = 49 (enabled)
  buf[fuseStart + 0] = 48; // RunAsNode = disabled
  buf[fuseStart + 1] = 49; // EnableCookieEncryption = enabled
  buf[fuseStart + 2] = 48; // EnableNodeOptionsEnvironmentVariable = disabled
  buf[fuseStart + 3] = 48; // EnableNodeCliInspectArguments = disabled
  buf[fuseStart + 4] = 48; // EnableEmbeddedAsarIntegrityValidation = disabled
  buf[fuseStart + 5] = 49; // OnlyLoadAppFromAsar = enabled
  fs.writeFileSync(exe, buf);
  console.log('[REA Fuses] Endurecidos los fuses de seguridad en:', exe);
};
