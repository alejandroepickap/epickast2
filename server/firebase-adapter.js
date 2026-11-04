'use strict';
/**
 * Firebase Cloud Storage & Database Snapshot Adapter para EpicKast.
 * 
 * Soporta dos modalidades:
 * 1. Archivo de Cuenta de Servicio oficial de Firebase (serviceAccountKey.json) con OAuth2 JWT nativo.
 * 2. Configuración simple REST (firebase.config.json / FIREBASE_CONFIG).
 * 
 * Permite:
 * - Respaldo y restauración automática de la base SQLite (epickast.db).
 * - Persistencia de adjuntos en Google Cloud Storage / Firebase Storage.
 * - Cero dependencias nativas externas (utiliza crypto y https nativos de Node.js).
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
 * Busca configuración en variables de entorno o archivos locales.
 */
function loadConfig(dataDir) {
  if (config) return config;

  // 1. Variable de entorno FIREBASE_SERVICE_ACCOUNT
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

  // 3. Búsqueda de archivos locales en server/ y dataDir
  const searchDirs = [__dirname, dataDir, path.join(__dirname, '..')].filter(Boolean);
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    // Buscar serviceAccountKey.json o archivos descargados de Firebase console (*firebase-adminsdk*.json)
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
 * Obtiene un token de acceso OAuth2 para la Cuenta de Servicio de Google/Firebase.
 */
async function getAccessToken(cfg) {
  if (!cfg.private_key || !cfg.client_email) return null;
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({
      iss: cfg.client_email,
      scope: 'https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/firebase.database',
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
    console.error('[firebase] Excepción al generar token OAuth2:', e.message);
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

  const token = await getAccessToken(cfg);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (cfg.apiKey) {
    // Si no hay token de cuenta de servicio, usar apiKey
  }

  const res = await request({
    hostname: host,
    port: 443,
    path: pathUrl + (cfg.apiKey && !token ? `&key=${cfg.apiKey}` : ''),
    method: 'POST',
    headers,
  }, fileBuffer);

  if (res.statusCode >= 200 && res.statusCode < 300) {
    return { ok: true, downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media` };
  } else {
    // Si el bucket .firebasestorage.app dio error, intentar con .appspot.com como fallback
    if (bucket.endsWith('.firebasestorage.app')) {
      const altBucket = bucket.replace('.firebasestorage.app', '.appspot.com');
      const altRes = await request({
        hostname: host,
        port: 443,
        path: `/v0/b/${altBucket}/o?name=${encodedPath}&uploadType=media` + (cfg.apiKey && !token ? `&key=${cfg.apiKey}` : ''),
        method: 'POST',
        headers,
      }, fileBuffer);
      if (altRes.statusCode >= 200 && altRes.statusCode < 300) {
        return { ok: true, downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${altBucket}/o/${encodedPath}?alt=media` };
      }
    }
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

  const headers = {};
  const token = await getAccessToken(cfg);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await request({
    hostname: host,
    port: 443,
    path: pathUrl,
    method: 'GET',
    headers
  });

  if (res.statusCode === 200) {
    return res.data;
  }
  // Fallback con .appspot.com
  if (bucket.endsWith('.firebasestorage.app')) {
    const altBucket = bucket.replace('.firebasestorage.app', '.appspot.com');
    const altRes = await request({
      hostname: host,
      port: 443,
      path: `/v0/b/${altBucket}/o/${encodedPath}?alt=media`,
      method: 'GET',
      headers
    });
    if (altRes.statusCode === 200) return altRes.data;
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
    const dbUrl = cfg.databaseURL || (cfg.project_id ? `https://${cfg.project_id}-default-rtdb.firebaseio.com` : null);
    if (cfg.databaseURL) {
      const u = new URL(cfg.databaseURL);
      const token = await getAccessToken(cfg);
      const pathUrl = `/epickast_backup.json` + (token ? `?access_token=${token}` : (cfg.databaseSecret ? `?auth=${cfg.databaseSecret}` : ''));

      await request({
        hostname: u.hostname,
        port: 443,
        path: pathUrl,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Content-Length': jsonBuf.length }
      }, jsonBuf);
      console.log('[firebase] Base de datos sincronizada con Firebase Realtime Database.');
      return true;
    }

    // 2. Si hay Cloud Storage Bucket
    if (getStorageBucket(cfg)) {
      await uploadToStorage(cfg, 'backups/backup-state.json', jsonBuf, 'application/json');
      console.log('[firebase] Base de datos sincronizada con Firebase Storage.');
      return true;
    }
  } catch (e) {
    console.warn('[firebase] Advertencia al sincronizar con Firebase:', e.message);
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
      const token = await getAccessToken(cfg);
      const pathUrl = `/epickast_backup.json` + (token ? `?access_token=${token}` : (cfg.databaseSecret ? `?auth=${cfg.databaseSecret}` : ''));

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
    console.log(`[firebase] Adjunto respaldado en Firebase Storage: ${dest}`);
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
