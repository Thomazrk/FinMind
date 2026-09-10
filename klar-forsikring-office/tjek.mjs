// Klar Forsikring — finder ud af, hvorfor kontoret ikke starter.
//
//   node tjek.mjs
//
// Ændrer ingenting. Den kigger hele vejen igennem og skriver en rapport til sidst.
// Er noget markeret FEJL, står der også, hvad der skal gøres ved det.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const linjer = [];
const OK = 'OK  ', FEJL = 'FEJL', OBS = 'OBS ';
let fejl = 0, obs = 0;

function sig(status, hvad, detalje = '', raad = '') {
  if (status === FEJL) fejl++;
  if (status === OBS) obs++;
  linjer.push({ status, hvad, detalje });
  console.log(`  ${status}  ${hvad}${detalje ? '  —  ' + detalje : ''}`);
  if (raad) console.log(`        ${raad}`);
}

const version = cmd => {
  try {
    const r = spawnSync(cmd, ['--version'], { shell: win, encoding: 'utf8', timeout: 15000 });
    return r.status === 0 ? String(r.stdout || r.stderr).trim().split('\n')[0] : null;
  } catch { return null; }
};

console.log('\nTjekker opsætningen\n');

// 1 — maskinen og værktøjerne
const styresystem = { darwin: 'Mac', win32: 'Windows', linux: 'Linux' }[process.platform] || process.platform;
sig(OK, 'Styresystem', `${styresystem} (${os.release()}, ${process.arch})`);

if (+process.versions.node.split('.')[0] < 20)
  sig(FEJL, 'Node', process.version, 'Node 20 eller nyere kræves. Hent den nyeste LTS på https://nodejs.org, luk terminalen, åbn den igen og prøv forfra.');
else sig(OK, 'Node', process.version);

const npmV = version('npm');
npmV ? sig(OK, 'npm', npmV)
     : sig(FEJL, 'npm', 'blev ikke fundet', 'npm følger med Node. Installér Node igen fra https://nodejs.org.');

const gitV = version('git');
gitV ? sig(OK, 'git', gitV.replace('git version ', ''))
     : sig(FEJL, 'git', 'blev ikke fundet', win
        ? 'Hent Git for Windows på https://git-scm.com. Luk terminalen og åbn en ny bagefter.'
        : 'Mac: skriv  xcode-select --install  og prøv igen.');

const claudeV = version('claude');
claudeV ? sig(OK, 'Claude Code', claudeV)
        : sig(OBS, 'Claude Code', 'kommandoen "claude" blev ikke fundet',
              'Kontoret starter alligevel, men agenterne kan ikke arbejde, før Claude Code er installeret og logget ind.');

// 2 — står vi i den rigtige mappe
fs.existsSync(path.join(PACK, 'brain', 'Agents Office', 'agents.json'))
  ? sig(OK, 'Opsætningens filer', PACK)
  : sig(FEJL, 'Opsætningens filer', 'brain-mappen blev ikke fundet',
        'Kør kommandoen fra mappen klar-forsikring-office.');

// 3 — er motoren hentet og installeret
const stiFil = path.join(PACK, '.office-path');
let OFFICE = null;
if (!fs.existsSync(stiFil)) {
  sig(FEJL, 'agents-office', 'opsætningen er ikke kørt endnu', 'Kør:  node setup.mjs');
} else {
  OFFICE = fs.readFileSync(stiFil, 'utf8').trim();
  if (!fs.existsSync(path.join(OFFICE, 'serve.mjs')))
    sig(FEJL, 'agents-office', `mangler i ${OFFICE}`, 'Kør:  node setup.mjs');
  else if (!fs.existsSync(path.join(OFFICE, 'node_modules')))
    sig(FEJL, 'agents-office', 'hentet, men ikke installeret', 'Kør:  node setup.mjs');
  else sig(OK, 'agents-office', OFFICE);
}

// 4 — configfilen
let port = 4520;
const cfgSti = OFFICE ? path.join(OFFICE, 'office.config.local.json') : null;
if (cfgSti && fs.existsSync(cfgSti)) {
  const raa = fs.readFileSync(cfgSti, 'utf8');
  try {
    const c = JSON.parse(raa);
    port = c.port || 4520;
    const brain = path.resolve(OFFICE, c.brain || './brain');
    if (path.resolve(brain) !== path.resolve(PACK, 'brain'))
      sig(FEJL, 'Configfilen', 'peger ikke på vores noter', 'Kør:  node setup.mjs');
    else sig(OK, 'Configfilen', `navn "${c.name}", port ${port}`);
  } catch {
    sig(FEJL, 'Configfilen', 'er ikke gyldig JSON' + (/[“”‘’]/.test(raa) ? ' (krøllede anførselstegn)' : ''),
        'Kør:  node setup.mjs — den skriver filen korrekt.');
  }
} else if (OFFICE) sig(FEJL, 'Configfilen', 'findes ikke', 'Kør:  node setup.mjs');

// 5 — er porten fri
await new Promise(klar => {
  const s = net.createServer();
  s.once('error', e => {
    if (e.code === 'EADDRINUSE')
      sig(FEJL, `Port ${port}`, 'er optaget',
          `Enten kører kontoret allerede — prøv http://localhost:${port} — eller start på en anden port:  PORT=4530 node start.mjs`);
    else sig(OBS, `Port ${port}`, e.code);
    klar();
  });
  s.once('listening', () => { sig(OK, `Port ${port}`, 'er fri'); s.close(() => klar()); });
  s.listen(port, '127.0.0.1');
});

// 6 — kan maskinen nå GitHub
await new Promise(klar => {
  const sok = net.connect({ host: 'github.com', port: 443, timeout: 8000 });
  const slut = (status, detalje, raad) => { sig(status, 'Netforbindelse', detalje, raad); sok.destroy(); klar(); };
  sok.once('connect', () => slut(OK, 'github.com svarer'));
  sok.once('timeout', () => slut(OBS, 'github.com svarede ikke inden for 8 sekunder',
        'Sidder I bag en firmafirewall eller proxy, kan opsætningen ikke hente motoren.'));
  sok.once('error', e => slut(OBS, `kunne ikke nå github.com (${e.code})`,
        'Tjek netforbindelsen. Er der en proxy, skal git og npm kende den.'));
});

// rapport
console.log('\n' + '-'.repeat(58) + '\n');
if (!fejl && !obs) console.log('Alt ser rigtigt ud. Start kontoret med:  node start.mjs\n');
else if (!fejl) console.log(`${obs} ting at være opmærksom på, men intet der forhindrer start.\nStart kontoret med:  node start.mjs\n`);
else console.log(`${fejl} ting skal rettes. Tag den øverste FEJL først — de andre følger tit med.\n`);

console.log('Kopiér linjerne herunder og send dem, hvis du har brug for hjælp:\n');
console.log(`klarforsikring-tjek | ${styresystem} | Node ${process.version} | ${new Date().toISOString().slice(0, 10)}`);
for (const l of linjer) console.log(`${l.status} ${l.hvad}${l.detalje ? ': ' + l.detalje : ''}`);
console.log('');
process.exit(fejl ? 1 : 0);
