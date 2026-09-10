// Starter kontoret. Kør setup.mjs først. Virker ens på Mac, Windows og Linux.
//   node start.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const stiFil = path.join(PACK, '.office-path');
if (!fs.existsSync(stiFil)) { console.error('\nKør opsætningen først:  node setup.mjs\n'); process.exit(1); }
const OFFICE = fs.readFileSync(stiFil, 'utf8').trim();
if (!fs.existsSync(OFFICE)) { console.error(`\n${OFFICE} findes ikke. Kør opsætningen igen:  node setup.mjs\n`); process.exit(1); }

let port = process.env.PORT || 4520;
if (!process.env.PORT) {
  try { port = JSON.parse(fs.readFileSync(path.join(OFFICE, 'office.config.local.json'), 'utf8')).port || 4520; } catch { /* falder tilbage på 4520 */ }
}

console.log(`Kontoret starter fra ${OFFICE} — åbn http://localhost:${port}`);
console.log('Luk det med Ctrl+C. Rutinerne fyrer kun, så længe det her kører.\n');
process.exit(spawnSync('npm', ['start'], { cwd: OFFICE, stdio: 'inherit', shell: process.platform === 'win32' }).status ?? 1);
