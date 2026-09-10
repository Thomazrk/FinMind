// Klar Forsikring — tager det nyeste CRM-udtræk og lægger det ind i brain'et.
// Beregnet til at køre af sig selv på en tidsplan, så bestanden er frisk, når rutinerne fyrer.
//
//   node vaerktoj/importer-vagt.mjs [mappe] [--altid] [--dage 60]
//
//   mappe    hvor udtrækkene lægges. Standard: privat/udtraek/
//   --altid  importér også, hvis filen allerede er importeret
//
// Den tager den nyeste .csv i mappen. Er det den samme fil som sidst, og er den ikke ændret,
// laver den ingenting — så en daglig kørsel er gratis, når der ikke er kommet nyt udtræk.
// Alt, hvad den gør, skrives i privat/import-log.txt.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIVAT = path.join(PACK, 'privat');
const LOG = path.join(PRIVAT, 'import-log.txt');
const MÆRKE = path.join(PRIVAT, '.sidste-import.json');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const altid = args.includes('--altid');
const dage = flag('--dage', '60');
const MAPPE = path.resolve(args.find(a => !a.startsWith('--') && a !== dage) || path.join(PRIVAT, 'udtraek'));

const nu = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
function log(linje) {
  console.log(linje);
  try { fs.mkdirSync(PRIVAT, { recursive: true }); fs.appendFileSync(LOG, `${nu()}  ${linje}\n`); } catch {}
}
const slut = (kode, linje) => { log(linje); process.exit(kode); };

if (!fs.existsSync(MAPPE)) {
  fs.mkdirSync(MAPPE, { recursive: true });
  slut(0, `Mappen ${MAPPE} fandtes ikke — den er oprettet. Læg CRM-udtrækket der, så tager jeg det næste gang.`);
}

const filer = fs.readdirSync(MAPPE)
  .filter(f => f.toLowerCase().endsWith('.csv'))
  .map(f => { const p = path.join(MAPPE, f); return { p, f, t: fs.statSync(p).mtimeMs, størrelse: fs.statSync(p).size }; })
  .sort((a, b) => b.t - a.t);

if (!filer.length) slut(0, `Ingen .csv i ${MAPPE} — intet at gøre.`);

const nyeste = filer[0];
if (nyeste.størrelse === 0) slut(1, `${nyeste.f} er tom. Importen er ikke kørt.`);

let sidste = null;
try { sidste = JSON.parse(fs.readFileSync(MÆRKE, 'utf8')); } catch {}
if (!altid && sidste && sidste.fil === nyeste.p && sidste.aendret === nyeste.t) {
  slut(0, `${nyeste.f} er allerede importeret (${new Date(sidste.tid).toLocaleString('da-DK')}). Intet nyt.`);
}

log(`Importerer ${nyeste.f} (${(nyeste.størrelse / 1024).toFixed(0)} kB, ændret ${new Date(nyeste.t).toLocaleString('da-DK')})`);

const r = spawnSync(process.execPath, [path.join(PACK, 'vaerktoj', 'importer-crm.mjs'), nyeste.p, '--dage', String(dage)],
  { cwd: PACK, encoding: 'utf8' });

const udskrift = `${r.stdout || ''}${r.stderr || ''}`.trim();
if (udskrift) console.log(udskrift);

if (r.status !== 0) {
  const grund = (r.stderr || r.stdout || '').split('\n').filter(Boolean).slice(-3).join(' | ');
  slut(1, `Importen fejlede: ${grund || 'ukendt fejl'}`);
}

const tal = (udskrift.match(/(\d+) kunder · (\d+) policer · (\d+) fornyelser/) || []).slice(1);
fs.writeFileSync(MÆRKE, JSON.stringify({ fil: nyeste.p, aendret: nyeste.t, tid: Date.now() }, null, 2));
slut(0, tal.length
  ? `Importen er kørt: ${tal[0]} kunder, ${tal[1]} policer, ${tal[2]} fornyelser inden for ${dage} dage.`
  : 'Importen er kørt.');
