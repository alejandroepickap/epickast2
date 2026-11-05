const fs = require('fs');

// 1. package.json
const pkgPath = 'C:/Users/puma1/OneDrive/Documentos/Proyecto Comunicacion EpicKap/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '1.9.2';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json -> 1.9.2');

// 2. game-config.js
const cfgPath = 'C:/Users/puma1/OneDrive/Documentos/Proyecto Comunicacion EpicKap/app/game-config.js';
let cfgCode = fs.readFileSync(cfgPath, 'utf8');
cfgCode = cfgCode.replace("const APP_VERSION = '1.9.1';", "const APP_VERSION = '1.9.2';");
fs.writeFileSync(cfgPath, cfgCode);
console.log('game-config.js -> 1.9.2');

// 3. card-game.js
const cgPath = 'C:/Users/puma1/OneDrive/Documentos/Proyecto Comunicacion EpicKap/app/card-game.js';
let cgCode = fs.readFileSync(cgPath, 'utf8');
cgCode = cgCode.replace('EpicKast v1.9.1', 'EpicKast v1.9.2');
fs.writeFileSync(cgPath, cgCode);
console.log('card-game.js -> 1.9.2');

// 4. racer-game.js
const rgPath = 'C:/Users/puma1/OneDrive/Documentos/Proyecto Comunicacion EpicKap/app/racer-game.js';
let rgCode = fs.readFileSync(rgPath, 'utf8');
rgCode = rgCode.replace('(v1.9.1)', '(v1.9.2)');
rgCode = rgCode.replace("CFG().APP_VERSION || '1.9.1'", "CFG().APP_VERSION || '1.9.2'");
fs.writeFileSync(rgPath, rgCode);
console.log('racer-game.js -> 1.9.2');
