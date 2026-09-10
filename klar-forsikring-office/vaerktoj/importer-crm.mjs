// Klar Forsikring — læser et udtræk fra CRM'et ind i brain'et, pseudonymiseret.
//
//   node vaerktoj/importer-crm.mjs <udtræk.csv> [--se] [--dage 60] [--maks 200]
//
//   --se     vis hvad der ville blive skrevet, skriv ingenting
//   --dage   hvor langt frem fornyelseslisten går (standard 60)
//   --maks   højst så mange rækker i fornyelseslisten (standard 200)
//
// Navne, CVR-numre og kontaktoplysninger kommer ALDRIG i brain'et. De bliver i CRM'et.
// Kunder får et kundenummer, og opslaget kundenummer → navn ligger i privat/, som er
// gitignoreret og uden for brain'et. Agenterne ser kundenummeret; I slår op i CRM'et.
// Kolonnenavne rettes i vaerktoj/kolonner.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAIN = path.join(PACK, 'brain');
const PRIVAT = path.join(PACK, 'privat');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const kun_se = args.includes('--se');
const DAGE = +flag('--dage', 60);
const MAKS = +flag('--maks', 200);
const kilde = args.find(a => !a.startsWith('--') && a !== flag('--dage', null) && a !== flag('--maks', null));

const dø = m => { console.error(`\nFejl: ${m}\n`); process.exit(1); };
if (!kilde) dø('giv stien til udtrækket: node vaerktoj/importer-crm.mjs udtraek.csv');
if (!fs.existsSync(kilde)) dø(`${kilde} findes ikke.`);

// ── CSV ────────────────────────────────────────────────────────────────────────
function parseCSV(tekst) {
  if (tekst.charCodeAt(0) === 0xfeff) tekst = tekst.slice(1); // Excels BOM
  const førsteLinje = tekst.slice(0, tekst.indexOf('\n') === -1 ? tekst.length : tekst.indexOf('\n'));
  const tæl = t => (førsteLinje.split(t).length - 1);
  const sep = tæl(';') > tæl(',') ? ';' : tæl(',') >= tæl('\t') ? ',' : '\t';
  const rækker = []; let felt = '', række = [], iCitat = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (iCitat) {
      if (c === '"') { if (tekst[i + 1] === '"') { felt += '"'; i++; } else iCitat = false; }
      else felt += c;
    } else if (c === '"') iCitat = true;
    else if (c === sep) { række.push(felt); felt = ''; }
    else if (c === '\n') { række.push(felt); rækker.push(række); række = []; felt = ''; }
    else if (c !== '\r') felt += c;
  }
  if (felt || række.length) { række.push(felt); rækker.push(række); }
  return { rækker: rækker.filter(r => r.some(f => f.trim() !== '')), sep };
}

// ── kolonner ───────────────────────────────────────────────────────────────────
const KOL_FIL = path.join(PACK, 'vaerktoj', 'kolonner.json');
const KOL = JSON.parse(fs.readFileSync(KOL_FIL, 'utf8'));
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9æøå]/g, '');
const FORBUDT = /cpr|personnr|personnummer|helbred|diagnose|kontonr|kontonummer|reg\.?nr/i;

function findKolonner(hoved) {
  const kort = {}, brugt = new Set(), advarsler = [];
  hoved.forEach((h, i) => { if (FORBUDT.test(h)) advarsler.push(`kolonnen "${h.trim()}" er droppet — den slags hører ikke i brain'et`); });
  for (const [felt, aliaser] of Object.entries(KOL)) {
    if (felt.startsWith('_') || !Array.isArray(aliaser)) continue;
    const i = hoved.findIndex((h, idx) => !brugt.has(idx) && !FORBUDT.test(h) && aliaser.some(a => norm(a) === norm(h)));
    if (i !== -1) { kort[felt] = i; brugt.add(i); }
  }
  return { kort, advarsler };
}

// ── datoer ─────────────────────────────────────────────────────────────────────
function dato(s) {
  const t = String(s || '').trim(); if (!t) return null;
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);              // 2026-09-14
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = t.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})/);    // 14-09-2026 · 14.09.26
  if (m) { const år = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(år, +m[2] - 1, +m[1]); }
  return null;
}
const MDR = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const visDato = d => d ? `${d.getDate()}. ${MDR[d.getMonth()]}. ${d.getFullYear()}` : '—';
const iDag = new Date(); iDag.setHours(0, 0, 0, 0);
const dageTil = d => d ? Math.round((d - iDag) / 86400000) : null;

// ── kundenumre: CRM'ets eget, ellers et vi tildeler og husker i privat/ ─────────
const OPSLAG = path.join(PRIVAT, 'kundeopslag.csv');
function indlæsOpslag() {
  const kort = new Map(); let næste = 1;
  if (fs.existsSync(OPSLAG)) for (const r of parseCSV(fs.readFileSync(OPSLAG, 'utf8')).rækker.slice(1)) {
    kort.set(r[1], r[0]); const n = +String(r[0]).replace(/\D/g, ''); if (n >= næste) næste = n + 1;
  }
  return { kort, næste };
}

// ── kør ────────────────────────────────────────────────────────────────────────
const { rækker, sep } = parseCSV(fs.readFileSync(kilde, 'utf8'));
if (rækker.length < 2) dø('udtrækket har ingen rækker under overskriften.');
const hoved = rækker[0];
const { kort, advarsler } = findKolonner(hoved);
const felt = (r, n) => kort[n] === undefined ? '' : String(r[kort[n]] ?? '').trim();

console.log(`\nUdtræk: ${kilde}`);
console.log(`  ${rækker.length - 1} rækker · skilletegn "${sep === '\t' ? 'tab' : sep}"`);
console.log(`  genkendte kolonner: ${Object.keys(kort).join(', ') || 'ingen'}`);
const mangler = Object.keys(KOL).filter(k => !k.startsWith('_') && kort[k] === undefined);
if (mangler.length) console.log(`  ikke fundet: ${mangler.join(', ')} — ret vaerktoj/kolonner.json, hvis de findes hos jer`);
advarsler.forEach(a => console.log(`  · ${a}`));
if (!kort.police && !kort.kundenr) dø('hverken policenummer eller kundenummer blev fundet. Ret vaerktoj/kolonner.json.');

const { kort: opslag, næste } = indlæsOpslag();
let løbenr = næste;
const kunder = new Map();
const nyeOpslag = [];

for (const r of rækker.slice(1)) {
  const navn = felt(r, 'navn'), cvr = felt(r, 'cvr').replace(/\D/g, '');
  const nøgle = felt(r, 'kundenr') || `${navn}|${cvr}`;
  if (!nøgle.replace('|', '').trim()) continue;
  let knr = felt(r, 'kundenr') || opslag.get(nøgle);
  if (!knr) { knr = `K-${String(løbenr++).padStart(5, '0')}`; opslag.set(nøgle, knr); nyeOpslag.push([knr, nøgle, navn, cvr]); }
  if (!kunder.has(knr)) kunder.set(knr, { knr, type: cvr ? 'erhverv' : 'privat', policer: [] });
  const k = kunder.get(knr);
  if (cvr) k.type = 'erhverv';
  k.policer.push({
    police: felt(r, 'police') || '—',
    produkt: felt(r, 'produkt') || 'ukendt',
    selskab: felt(r, 'selskab') || 'ukendt',
    forfald: dato(felt(r, 'hovedforfald')),
    status: felt(r, 'status') || '',
  });
}

const alle = [...kunder.values()];
const policer = alle.flatMap(k => k.policer);
const tæl = (liste, f) => liste.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});
const tabel = (o, navn) => Object.entries(o).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`).join('\n') || `| (ingen) | 0 |`;

const fornyelser = alle.flatMap(k => k.policer.map(p => ({ ...p, knr: k.knr, type: k.type })))
  .filter(p => { const d = dageTil(p.forfald); return d !== null && d >= 0 && d <= DAGE; })
  .sort((a, b) => a.forfald - b.forfald).slice(0, MAKS);

const stempel = visDato(iDag);
const kildeNavn = path.basename(kilde);
const HOVED = `> Genereret af \`vaerktoj/importer-crm.mjs\` fra ${kildeNavn} den ${stempel}.\n> Ret den ikke i hånden — den bliver overskrevet ved næste import. Navne og CVR står i CRM'et,\n> ikke her: slå kundenummeret op der.\n`;

const bestand = `# Bestand

${HOVED}
| Tal | Værdi |
|---|---|
| Kunder | ${alle.length} |
| Policer | ${policer.length} |
| Policer pr. kunde | ${alle.length ? (policer.length / alle.length).toFixed(2) : '0'} |
| Privatkunder | ${alle.filter(k => k.type === 'privat').length} |
| Erhvervskunder | ${alle.filter(k => k.type === 'erhverv').length} |

## Policer pr. produkt
| Produkt | Antal |
|---|---|
${tabel(tæl(policer, p => p.produkt))}

## Policer pr. selskab
| Selskab | Antal |
|---|---|
${tabel(tæl(policer, p => p.selskab))}

## Kunder med kun én police
${alle.filter(k => k.policer.length === 1).length} kunder. Det er dem, [[behovsafdaekning]] og
[[pipeline-regler]] peger på til en forsikringsgennemgang.

Se også [[fornyelser]] · [[tal-og-kilder]] · [[kundesegmenter]]
`;

const fornyelsesnote = `# Fornyelser

${HOVED}
Policer med hovedforfald inden for ${DAGE} dage. Rutinen \`fornyelser-45\` arbejder på denne liste.
**Datoen her er CRM'ets. Bekræft den i policen, før I skriver til kunden** — opsigelsesfristen
regnes fra policens egen dato, jf. [[pipeline-regler]].

| Kundenr. | Type | Police | Produkt | Selskab | Hovedforfald | Dage til |
|---|---|---|---|---|---|---|
${fornyelser.map(p => `| ${p.knr} | ${p.type} | ${p.police} | ${p.produkt} | ${p.selskab} | ${visDato(p.forfald)} | ${dageTil(p.forfald)} |`).join('\n') || '| (ingen inden for perioden) | | | | | | |'}

${fornyelser.length === MAKS ? `\n*Listen er skåret ved ${MAKS} rækker. Kør med \`--maks\` for flere.*\n` : ''}
Se også [[bestand]] · [[policeservice]]
`;

const tal = `# Bestandstal

${HOVED}
| Tal | Værdi | Kilde | Tjekket |
|---|---|---|---|
| Antal kunder i bestanden | ${alle.length} | CRM-udtræk ${kildeNavn} | ${stempel} |
| Antal policer | ${policer.length} | CRM-udtræk ${kildeNavn} | ${stempel} |
| Policer pr. kunde (snit) | ${alle.length ? (policer.length / alle.length).toFixed(2) : '0'} | Beregnet | ${stempel} |
| Fornyelser inden for ${DAGE} dage | ${fornyelser.length} | Beregnet | ${stempel} |

Disse tal må agenterne bruge. Alt andet kommer fra [[tal-og-kilder]].
`;

// ── vagt: intet navn og intet CVR må slippe ud i brain'et ──────────────────────
const udskrifter = [
  [path.join(BRAIN, '30-Kunder', 'bestand.md'), bestand],
  [path.join(BRAIN, '30-Kunder', 'fornyelser.md'), fornyelsesnote],
  [path.join(BRAIN, '00-Meta', 'bestandstal.md'), tal],
];
const hemmeligt = new Set();
for (const [, nøgle, navn, cvr] of nyeOpslag) { if (navn) hemmeligt.add(navn); if (cvr) hemmeligt.add(cvr); }
for (const r of rækker.slice(1)) { const n = felt(r, 'navn'), c = felt(r, 'cvr').replace(/\D/g, ''); if (n) hemmeligt.add(n); if (c) hemmeligt.add(c); }
const CPR = /\b\d{6}[- ]?\d{4}\b/;
for (const [fil, tekst] of udskrifter) {
  for (const h of hemmeligt) if (h.length > 2 && tekst.includes(h)) dø(`"${h}" ville havne i ${path.relative(PACK, fil)}. Importen er stoppet — intet er skrevet.`);
  if (CPR.test(tekst)) dø(`noget der ligner et CPR-nummer ville havne i ${path.relative(PACK, fil)}. Importen er stoppet — intet er skrevet.`);
}

console.log(`\n${alle.length} kunder · ${policer.length} policer · ${fornyelser.length} fornyelser inden for ${DAGE} dage`);
if (nyeOpslag.length) console.log(`${nyeOpslag.length} kunder fik et nyt kundenummer`);

if (kun_se) {
  console.log('\n--se: intet skrevet. Filerne ville være:');
  udskrifter.forEach(([f]) => console.log('  ' + path.relative(PACK, f)));
  if (nyeOpslag.length) console.log('  ' + path.relative(PACK, OPSLAG) + '  (uden for brain\'et, gitignoreret)');
  process.exit(0);
}

for (const [fil, tekst] of udskrifter) { fs.mkdirSync(path.dirname(fil), { recursive: true }); fs.writeFileSync(fil, tekst); }
if (nyeOpslag.length) {
  fs.mkdirSync(PRIVAT, { recursive: true });
  if (!fs.existsSync(OPSLAG)) fs.writeFileSync(OPSLAG, 'kundenr;noegle;navn;cvr\n');
  fs.appendFileSync(OPSLAG, nyeOpslag.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n') + '\n');
}
console.log('\nSkrevet:');
udskrifter.forEach(([f]) => console.log('  ' + path.relative(PACK, f)));
if (nyeOpslag.length) console.log('  ' + path.relative(PACK, OPSLAG) + '  (uden for brain\'et, gitignoreret)');
console.log('\nAgenterne læser det ved næste opgave. Ingen genstart.\n');
