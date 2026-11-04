'use strict';
/**
 * Firebase Cloud Storage & Database Snapshot Adapter para EpicKast.
 * 
 * Permite persistencia real en la nube sin costo adicional:
 * 1. Respaldo y restauración automática de epickast.db hacia Firebase Storage / Realtime DB.
 * 2. Almacenamiento persistente de adjuntos de archivos (evita pérdida por disco efímero de Render).
 * 3. Cero dependencias nativas complejas (utiliza la API REST HTTPS nativa de Node.js).
 */
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

let config = null;

// Busca configuración en variables de entorno o archivo firebase.config.json
function loadConfig(dataDir) {
  if (config) return config;

  if (process.env.FIREBASE_CONFIG) {
    try {
      config = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log('[firebase] Configuración cargada desde FIREBASE_CONFIG env.');
      return config;
    } catch (e) {
      console.error('[firebase] Error al parsear FIREBASE_CONFIG:', e.message);
    }
  }

  const candidatePaths = [
    path.join(__dirname, 'firebase.config.json'),
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(dataDir || __dirname, 'firebase.config.json'),
  ];

  for (const cp of candidatePaths) {
    if (fs.existsSync(cp)) {
      try {
        config = JSON.parse(fs.readFileSync(cp, 'utf8'));
        console.log(`[firebase] Configuración cargada desde ${path.basename(cp)}.`);
        return config;
      } catch (e) {
        console.error(`[firebase] Error al leer ${cp}:`, e.message);
      }
    }
  }

  return null;
}

/**
 * Realiza una petición HTTPS con promesas (sin dependencias externas).
 */
function request(options, bodyBuffer = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: buf,
          text: () => buf.toString('utf8'),
          json: () => {
            try { return JSON.parse(buf.toString('utf8')); }
            catch { return null; }
          }
        });
      });
    });
    req.on('error', reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

/**
 * Obtiene el bucket de Firebase Storage o la URL de Realtime DB.
 */
function getStorageBucket(cfg) {
  return cfg?.storageBucket || cfg?.project_id ? `${cfg.project_id}.appspot.com` : null;
}

/**
 * Sube un archivo a Firebase Cloud Storage vía REST API.
 */
async function uploadToStorage(cfg, destinationPath, fileBuffer, mimeType = 'application/octet-stream') {
  const bucket = getStorageBucket(cfg);
  if (!bucket) throw new Error('No se definió storageBucket ni project_id');

  const encodedPath = encodeURIComponent(destinationPath);
  const host = 'firebasestorage.googleapis.com';
  const pathUrl = `/v0/b/${bucket}/o?name=${encodedPath}&uploadType=media`;

  const headers = {
    'Content-Type': mimeType,
    'Content-Length': fileBuffer.length,
  };

  // Si hay api_key o token
  if (cfg.apiKey) {
    // se puede añadir como query param o header
  }

  const res = await request({
    hostname: host,
    port: 443,
    path: pathUrl + (cfg.apiKey ? `&key=${cfg.apiKey}` : ''),
    method: 'POST',
    headers,
  }, fileBuffer);

  if (res.statusCode >= 200 && res.statusCode < 300) {
    const j = res.json();
    return { ok: true, downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media` };
  } else {
    throw new Error(`Firebase Storage HTTP ${res.statusCode}: ${res.text()}`);
  }
}

/**
 * Descarga un archivo de Firebase Cloud Storage vía REST API.
 */
async function downloadFromStorage(cfg, destinationPath) {
  const bucket = getStorageBucket(cfg);
  if (!bucket) return null;

  const encodedPath = encodeURIComponent(destinationPath);
  const host = 'firebasestorage.googleapis.com';
  const pathUrl = `/v0/b/${bucket}/o/${encodedPath}?alt=media` + (cfg.apiKey ? `&key=${cfg.apiKey}` : '');

  const res = await request({
    hostname: host,
    port: 443,
    path: pathUrl,
    method: 'GET',
  });

  if (res.statusCode === 200) {
    return res.data;
  }
  return null;
}

/**
 * Guarda el respaldo completo de la base de datos o JSON en Firebase.
 */
async function syncDatabaseToFirebase(dataDir, backupStateObj) {
  const cfg = loadConfig(dataDir);
  if (!cfg) return false;

  try {
    const jsonBuf = Buffer.from(JSON.stringify(backupStateObj, null, 2), 'utf8');

    // 1. Si hay Realtime Database URL
    if (cfg.databaseURL) {
      const u = new URL(cfg.databaseURL);
      const host = u.hostname;
      const secret = cfg.databaseAuthSecret || cfg.databaseSecret || '';
      const pathUrl = `/epickast_backup.json` + (secret ? `?auth=${secret}` : '');

      await request({
        hostname: host,
        port: 443,
        path: pathUrl,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Content-Length': jsonBuf.length }
      }, jsonBuf);
      console.log('[firebase] Base de datos sincronizada exitosamente con Firebase Realtime Database.');
      return true;
    }

    // 2. Si hay Cloud Storage Bucket
    if (getStorageBucket(cfg)) {
      await uploadToStorage(cfg, 'backups/backup-state.json', jsonBuf, 'application/json');
      console.log('[firebase] Base de datos sincronizada exitosamente con Firebase Storage.');
      return true;
    }
  } catch (e) {
    console.warn('[firebase] Advertencia al sincronizar base de datos con Firebase:', e.message);
  }
  return false;
}

/**
 * Restaura la base de datos desde Firebase al arrancar el contenedor.
 */
async function restoreDatabaseFromFirebase(dataDir) {
  const cfg = loadConfig(dataDir);
  if (!cfg) return null;

  try {
    // 1. Si hay Realtime Database
    if (cfg.databaseURL) {
      const u = new URL(cfg.databaseURL);
      const secret = cfg.databaseAuthSecret || cfg.databaseSecret || '';
      const pathUrl = `/epickast_backup.json` + (secret ? `?auth=${secret}` : '');

      const res = await request({
        hostname: u.hostname,
        port: 443,
        path: pathUrl,
        method: 'GET'
      });
      if (res.statusCode === 200) {
        const state = res.json();
        if (state && Array.isArray(state.users) && state.users.length > 0) {
          console.log(`[firebase] Respaldo restaurado desde Firebase Realtime DB (${state.users.length} usuarios).`);
          return state;
        }
      }
    }

    // 2. Si hay Storage Bucket
    if (getStorageBucket(cfg)) {
      const buf = await downloadFromStorage(cfg, 'backups/backup-state.json');
      if (buf) {
        const state = JSON.parse(buf.toString('utf8'));
        if (state && Array.isArray(state.users) && state.users.length > 0) {
          console.log(`[firebase] Respaldo restaurado desde Firebase Storage (${state.users.length} usuarios).`);
          return state;
        }
      }
    }
  } catch (e) {
    console.warn('[firebase] Advertencia al restaurar desde Firebase:', e.message);
  }
  return null;
}

/**
 * Respalda un archivo adjunto subido a Firebase Storage.
 */
async function syncAttachmentToFirebase(dataDir, diskFileName, localFilePath, mimeType) {
  const cfg = loadConfig(dataDir);
  if (!cfg || !getStorageBucket(cfg)) return null;

  try {
    const fileBuf = fs.readFileSync(localFilePath);
    const dest = `uploads/${diskFileName}`;
    const res = await uploadToStorage(cfg, dest, fileBuf, mimeType);
    console.log(`[firebase] Archivo adjunto respaldado en Firebase Storage: ${dest}`);
    return res;
  } catch (e) {
    console.warn('[firebase] Error al subir adjunto a Firebase Storage:', e.message);
    return null;
  }
}

/**
 * Recupera un adjunto desde Firebase Storage si no existe en disco local.
 */
async function fetchAttachmentFromFirebase(dataDir, diskFileName, localDestPath) {
  const cfg = loadConfig(dataDir);
  if (!cfg || !getStorageBucket(cfg)) return false;

  try {
    const buf = await downloadFromStorage(cfg, `uploads/${diskFileName}`);
    if (buf && buf.length > 0) {
      fs.writeFileSync(localDestPath, buf);
      console.log(`[firebase] Archivo adjunto restaurado desde Firebase Storage a ${localDestPath}`);
      return true;
    }
  } catch (e) {
    console.warn('[firebase] Error al descargar adjunto desde Firebase:', e.message);
  }
  return false;
}

module.exports = {
  loadConfig,
  syncDatabaseToFirebase,
  restoreDatabaseFromFirebase,
  syncAttachmentToFirebase,
  fetchAttachmentFromFirebase,
  isConfigured: (dataDir) => !!loadConfig(dataDir),
};
