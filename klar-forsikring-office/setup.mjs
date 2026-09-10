// Klar Forsikring — sætter agents-office op med vores roster, brain, færdigheder og rutiner.
// Virker ens på Mac, Windows og Linux. Kræver kun Node 20+ og git.
//
//   node setup.mjs [målmappe]      standard: <hjemmemappe>/agents-office
//
// Henter agents-office fra GitHub (den bliver ikke kopieret ind i dette repo), installerer den,
// og peger den på brain'et her i mappen. Alt, der er vores, bliver liggende her og er
// versionsstyret; agents-office-klonen kan altid smides væk og hentes igen.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const OFFICE = path.resolve(process.argv[2] || path.join(os.homedir(), 'agents-office'));
const REPO = 'https://github.com/ajsahni/agents-office.git';

const ESC = '\u001b';
const fed = s => `${ESC}[1m${s}${ESC}[0m`;
const rod = s => `${ESC}[31m${s}${ESC}[0m`;
const gul = s => `${ESC}[33m${s}${ESC}[0m`;
const sig = s => console.log('\n' + fed(s));
const dø = s => { console.error(`\n${rod('Fejl:')} ${s}\n`); process.exit(1); };
const win = process.platform === 'win32';
// npm hedder npm.cmd på Windows og skal gennem en shell. Node må IKKE: stien til node.exe
// indeholder "Program Files", og en shell knækker den ved mellemrummet.
const kør = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: win });
const kørNode = (args, cwd) => spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
const findes = cmd => spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: win }).status === 0;

if (+process.versions.node.split('.')[0] < 20) dø(`Node 20 eller nyere kræves (du har ${process.version}). Hent den på https://nodejs.org`);
if (!findes('git')) dø('git er ikke installeret. Hent den på https://git-scm.com');
if (!findes('npm')) dø('npm blev ikke fundet. Det følger med Node — installér Node igen fra https://nodejs.org');
if (!findes('claude')) console.log(`\n${gul('Bemærk:')} Claude Code (kommandoen "claude") blev ikke fundet. Kontoret starter, men agenterne kan ikke arbejde uden et Claude Code-login eller en ANTHROPIC_API_KEY.`);

sig(`1/5  Henter agents-office → ${OFFICE}`);
const hentet = fs.existsSync(path.join(OFFICE, '.git'))
  ? kør('git', ['pull', '--ff-only'], OFFICE)
  : kør('git', ['clone', REPO, OFFICE]);
if (hentet.status !== 0) dø('kunne ikke hente agents-office. Tjek netforbindelsen og prøv igen.');

sig('2/5  Installerer');
if (kør('npm', ['install'], OFFICE).status !== 0) dø('npm install fejlede.');

sig('3/5  Peger kontoret på vores brain');
const skabelon = fs.readFileSync(path.join(PACK, 'office.config.local.json.skabelon'), 'utf8');
const config = skabelon.replace('BRAIN_PATH', path.join(PACK, 'brain').split(path.sep).join('/'));
fs.writeFileSync(path.join(OFFICE, 'office.config.local.json'), config);
fs.writeFileSync(path.join(PACK, '.office-path'), OFFICE + '\n');
console.log(config);

sig('4/5  Bygger');
if (kørNode(['build.mjs'], OFFICE).status !== 0) dø('byggeriet fejlede.');

sig('5/5  Tjekker roster, færdigheder og rutiner');
if (kørNode([path.join(PACK, 'validate.mjs'), OFFICE], PACK).status !== 0)
  dø("der er problemer i brain/Agents Office/. Ret dem og kør opsætningen igen.");

if (process.env.FULL_CHECK === '1') {
  sig("Ekstra: agents-office' egen testpakke (npm run check)");
  if (kør('npm', ['run', 'check'], OFFICE).status !== 0)
    console.log(`\n${gul('Bemærk:')} npm run check meldte fejl. Testen "smoke: browser" kræver Chrome og kan ignoreres — se efter andre linjer med ✗.`);
}

let port = 4520;
try { port = JSON.parse(config).port || 4520; } catch { /* skabelonen er ikke gyldig JSON — validate.mjs har allerede sagt det */ }

sig('Færdig.');
console.log(`Start kontoret:      node "${path.join(PACK, 'start.mjs')}"
Eller:               cd "${OFFICE}" og så: npm start
Åbn derefter:        http://localhost:${port}

Vores ting ligger her og redigeres her:
  brain/                             notaterne agenterne læser
  brain/Agents Office/agents.json    de 35 pladser
  brain/Agents Office/skills/        sådan gør vi tingene
  brain/Agents Office/routines.json  det kontoret gør af sig selv

Færdigheder og briefs virker fra næste opgave. Ændringer i agents.json kræver genstart.
Tjek vores filer igen når som helst:  node validate.mjs
`);
