// Klar Forsikring — tjekker vores egne filer (roster, færdigheder, rutiner) mod en
// agents-office-installation. Kør:  node validate.mjs [sti til agents-office]
// Standard er stien i .office-path, som setup.sh skrev.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const arg = process.argv[2];
const pathFile = path.join(PACK, '.office-path');
const OFFICE = arg || (fs.existsSync(pathFile) ? fs.readFileSync(pathFile, 'utf8').trim() : '');
if (!OFFICE || !fs.existsSync(path.join(OFFICE, 'roster.mjs'))) {
  console.error('Kunne ikke finde agents-office. Kør ./setup.sh, eller giv stien: node validate.mjs ~/agents-office');
  process.exit(2);
}
const load = f => import(pathToFileURL(path.join(OFFICE, f)).href);
const brainPath = path.join(PACK, 'brain');

// 0) konfigurationen — den fejler tavst, hvis den ikke er gyldig JSON
const cfgFile = path.join(OFFICE, 'office.config.local.json');
console.log(`\nKonfiguration: ${cfgFile}`);
let cfgProblem = false;
if (!fs.existsSync(cfgFile)) {
  cfgProblem = true;
  console.log('  ✗ filen findes ikke — kør ./setup.sh');
} else {
  const raw = fs.readFileSync(cfgFile, 'utf8');
  try {
    const c = JSON.parse(raw);
    const resolved = path.resolve(OFFICE, c.brain || './brain');
    console.log(`  navn: ${JSON.stringify(c.name)}`);
    console.log(`  brain: ${resolved}`);
    if (path.resolve(resolved) !== path.resolve(PACK, 'brain')) {
      cfgProblem = true;
      console.log(`  ✗ brain peger ikke på ${path.join(PACK, 'brain')} — kontoret kører på agents-office' egne eksempelnoter. Kør ./setup.sh igen.`);
    }
    if (c.model && !['sonnet', 'opus', 'fable'].includes(c.model)) {
      cfgProblem = true;
      console.log(`  ✗ model skal være sonnet, opus eller fable — eller "" for kontorets standard (Sonnet).`);
    }
  } catch (e) {
    cfgProblem = true;
    console.log(`  ✗ ikke gyldig JSON (${e.message.split('\n')[0]})`);
    if (/[\u201c\u201d\u2018\u2019]/.test(raw)) console.log('  \u2717 filen indeholder kr\u00f8llede anf\u00f8rselstegn (\u201c \u201d \u2018 \u2019). JSON kr\u00e6ver lige: ". Kontoret ignorerer hele filen i tavshed og starter som "Northgate Studio" p\u00e5 eksempelnoterne.');
  }
}
if (cfgProblem) process.exitCode = 1;

const { loadRoster } = await load('roster.mjs');
const { loadSkills } = await load('skills.mjs');
const routines = await load('routines.mjs');

let problems = 0;
const fail = m => { problems++; console.log('  ✗ ' + m); };

console.log(`\nVores filer: ${brainPath}`);

const r = loadRoster(brainPath);
console.log(`\nRoster — ${r.agents.length} pladser, ${r.customised} tilpasset, ${r.briefed} med brief`);
console.log(`  kilder: ${r.files.join(', ')}`);
r.problems.forEach(fail);

const s = loadSkills(brainPath, r.agents);
const sum = s.summary();
const ours = sum.skills.filter(k => k.source !== 'shipped');
console.log(`\nFærdigheder — ${ours.length} af vores (${sum.skills.length} i alt)`);
const bind = k => k.everyone ? 'alle agenter' : [...k.agents, ...k.departments].join(', ') || 'ingen binding';
for (const k of sum.skills) console.log(`  · ${k.name} → ${bind(k)} (${k.source === 'brain' ? 'vores' : 'medfølgende eksempel'})`);
(sum.problems || []).forEach(fail);

const doc = JSON.parse(fs.readFileSync(path.join(brainPath, 'Agents Office', 'routines.json'), 'utf8'));
console.log(`\nRutiner — ${doc.routines.length}`);
const seen = [];
for (const one of doc.routines) {
  const v = routines.validate(one, r.agents, seen);
  const ok = v.routine || v.ok || (!v.problems || !v.problems.length);
  console.log(`  · ${one.id} — ${routines.NAMES[one.dept] || one.dept}/${one.agent}${one.needsOk === false ? '' : ' · afventer godkendelse'}`);
  (v.problems || []).forEach(p => fail(`${one.id}: ${p}`));
  if (ok) seen.push(one);
}

if (problems) console.log(`\n${problems} problem(er) i brain/Agents Office/`);
if (cfgProblem) console.log('\nKonfigurationen skal rettes i ' + cfgFile + ' — eller kør ./setup.sh igen.');
console.log(problems || cfgProblem ? '' : '\nAlt validerer.\n');
process.exit(problems || cfgProblem ? 1 : 0);
