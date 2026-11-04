'use strict';
/**
 * Firebase Cloud Storage & Database Snapshot Adapter para EpicKast.
 * 
 * Utiliza la API oficial Google Cloud Storage JSON API (storage.googleapis.com) con
 * autenticación nativa OAuth2 Service Account JWT (RS256).
 * 
 * Ventajas:
 * 1. Acceso administrativo completo y seguro a Firebase Storage (epickast.firebasestorage.app).
 * 2. Cero problemas con las reglas de seguridad de Storage (IAM Admin bypass).
 * 3. Persistencia permanente de epickast.db y archivos adjuntos del chat en la nube de Firebase.
 * 4. Cero dependencias externas pesadas o nativas (100% Node.js https y crypto).
 */
const https = require('node:https');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

let config = null;
let cachedToken = null;
let tokenExpiresAt = 0;

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Carga la configuración desde variable de entorno o archivo de cuenta de servicio.
 */
function loadConfig(dataDir) {
  if (config) return config;

  // 1. Variable de entorno FIREBASE_SERVICE_ACCOUNT (Render producción)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      config = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('[firebase] Cuenta de servicio cargada desde FIREBASE_SERVICE_ACCOUNT env.');
      return config;
    } catch (e) {
      console.error('[firebase] Error al parsear FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  // 2. Variable de entorno FIREBASE_CONFIG
  if (process.env.FIREBASE_CONFIG) {
    try {
      config = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log('[firebase] Configuración cargada desde FIREBASE_CONFIG env.');
      return config;
    } catch (e) {
      console.error('[firebase] Error al parsear FIREBASE_CONFIG:', e.message);
    }
  }

  // 3. Archivos locales en server/
  const searchDirs = [__dirname, dataDir, path.join(__dirname, '..')].filter(Boolean);
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const saFile = files.find(f => /serviceAccountKey\.json$/i.test(f) || /firebase.*adminsdk.*\.json$/i.test(f));
    if (saFile) {
      try {
        const fullP = path.join(dir, saFile);
        config = JSON.parse(fs.readFileSync(fullP, 'utf8'));
        console.log(`[firebase] Cuenta de servicio oficial cargada desde: ${saFile}`);
        return config;
      } catch (e) {
        console.error(`[firebase] Error al leer ${saFile}:`, e.message);
      }
    }

    const cfgFile = files.find(f => /firebase\.config\.json$/i.test(f));
    if (cfgFile) {
      try {
        const fullP = path.join(dir, cfgFile);
        config = JSON.parse(fs.readFileSync(fullP, 'utf8'));
        console.log(`[firebase] Configuración cargada desde: ${cfgFile}`);
        return config;
      } catch (e) {
        console.error(`[firebase] Error al leer ${cfgFile}:`, e.message);
      }
    }
  }

  return null;
}

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
 * Obtiene o renueva el token de acceso OAuth2 para la cuenta de servicio.
 */
async function getAccessToken(cfg) {
  if (!cfg || !cfg.private_key || !cfg.client_email) return null;
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({
      iss: cfg.client_email,
      scope: 'https://www.googleapis.com/auth/devstorage.full_control https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }));

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(cfg.private_key, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const assertion = `${header}.${payload}.${signature}`;
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${assertion}`;

    const res = await request({
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, Buffer.from(postData));

    if (res.statusCode === 200) {
      const data = res.json();
      cachedToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in * 1000);
      return cachedToken;
    } else {
      console.error('[firebase] Error al obtener token OAuth2:', res.statusCode, res.text());
    }
  } catch (e) {
    console.error('[firebase] Error generando token OAuth2:', e.message);
  }
  return null;
}

function getStorageBucket(cfg) {
  if (cfg.storageBucket) return cfg.storageBucket.replace(/^gs:\/\//, '');
  const proj = cfg.project_id || cfg.projectId;
  if (proj) return `${proj}.firebasestorage.app`;
  return null;
}

/**
 * Sube un archivo a Google Cloud Storage / Firebase Storage vía JSON API.
 */
async function uploadToStorage(cfg, destinationPath, fileBuffer, mimeType = 'application/octet-stream') {
  const bucket = getStorageBucket(cfg);
  if (!bucket) throw new Error('No se definió storageBucket ni project_id');

  const token = await getAccessToken(cfg);
  const encodedName = encodeURIComponent(destinationPath);
  const headers = {
    'Content-Type': mimeType,
    'Content-Length': fileBuffer.length,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await request({
    hostname: 'storage.googleapis.com',
    port: 443,
    path: `/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodedName}`,
    method: 'POST',
    headers,
  }, fileBuffer);

  if (res.statusCode >= 200 && res.statusCode < 300) {
    return { ok: true, name: destinationPath };
  } else {
    // Si da 404, intentar con bucket alternativo .appspot.com
    if (bucket.endsWith('.firebasestorage.app')) {
      const altBucket = bucket.replace('.firebasestorage.app', '.appspot.com');
      const altRes = await request({
        hostname: 'storage.googleapis.com',
        port: 443,
        path: `/upload/storage/v1/b/${altBucket}/o?uploadType=media&name=${encodedName}`,
        method: 'POST',
        headers,
      }, fileBuffer);
      if (altRes.statusCode >= 200 && altRes.statusCode < 300) {
        return { ok: true, name: destinationPath };
      }
    }
    throw new Error(`Cloud Storage HTTP ${res.statusCode}: ${res.text()}`);
  }
}

/**
 * Descarga un archivo de Google Cloud Storage / Firebase Storage vía JSON API.
 */
async function downloadFromStorage(cfg, destinationPath) {
  const bucket = getStorageBucket(cfg);
  if (!bucket) return null;

  const token = await getAccessToken(cfg);
  const encodedName = encodeURIComponent(destinationPath);
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await request({
    hostname: 'storage.googleapis.com',
    port: 443,
    path: `/storage/v1/b/${bucket}/o/${encodedName}?alt=media`,
    method: 'GET',
    headers
  });

  if (res.statusCode === 200) {
    return res.data;
  }
  // Fallback con .appspot.com si no se encontró en .firebasestorage.app
  if (bucket.endsWith('.firebasestorage.app')) {
    const altBucket = bucket.replace('.firebasestorage.app', '.appspot.com');
    const altRes = await request({
      hostname: 'storage.googleapis.com',
      port: 443,
      path: `/storage/v1/b/${altBucket}/o/${encodedName}?alt=media`,
      method: 'GET',
      headers
    });
    if (altRes.statusCode === 200) return altRes.data;
  }
  return null;
}

/**
 * Guarda el respaldo completo de la base de datos o JSON en Firebase Storage.
 */
async function syncDatabaseToFirebase(dataDir, backupStateObj) {
  const cfg = loadConfig(dataDir);
  if (!cfg) return false;

  try {
    const jsonBuf = Buffer.from(JSON.stringify(backupStateObj, null, 2), 'utf8');
    await uploadToStorage(cfg, 'backups/backup-state.json', jsonBuf, 'application/json');
    console.log('[firebase] Base de datos sincronizada exitosamente con Firebase Storage.');
    return true;
  } catch (e) {
    console.warn('[firebase] Advertencia al sincronizar con Firebase:', e.message);
  }
  return false;
}

/**
 * Restaura la base de datos desde Firebase Storage al arrancar el contenedor.
 */
async function restoreDatabaseFromFirebase(dataDir) {
  const cfg = loadConfig(dataDir);
  if (!cfg) return null;

  try {
    const buf = await downloadFromStorage(cfg, 'backups/backup-state.json');
    if (buf && buf.length > 0) {
      const state = JSON.parse(buf.toString('utf8'));
      if (state && Array.isArray(state.users) && state.users.length > 0) {
        console.log(`[firebase] Respaldo restaurado desde Firebase Storage (${state.users.length} usuarios).`);
        return state;
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
  if (!cfg) return null;

  try {
    const fileBuf = fs.readFileSync(localFilePath);
    const dest = `uploads/${diskFileName}`;
    await uploadToStorage(cfg, dest, fileBuf, mimeType);
    console.log(`[firebase] Adjunto respaldado en Firebase Storage: ${dest}`);
    return { ok: true, dest };
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
  if (!cfg) return false;

  try {
    const buf = await downloadFromStorage(cfg, `uploads/${diskFileName}`);
    if (buf && buf.length > 0) {
      fs.writeFileSync(localDestPath, buf);
      console.log(`[firebase] Adjunto restaurado desde Firebase Storage a ${localDestPath}`);
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
