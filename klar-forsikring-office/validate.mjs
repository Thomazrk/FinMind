// Klar Forsikring — tjekker vores egne filer (roster, færdigheder, rutiner) mod en
// agents-office-installation. Kør:  node validate.mjs [sti til agents-office]
// Standard er stien i .office-path, som setup.sh skrev.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PACK = path.dirname(new URL(import.meta.url).pathname);
const arg = process.argv[2];
const pathFile = path.join(PACK, '.office-path');
const OFFICE = arg || (fs.existsSync(pathFile) ? fs.readFileSync(pathFile, 'utf8').trim() : '');
if (!OFFICE || !fs.existsSync(path.join(OFFICE, 'roster.mjs'))) {
  console.error('Kunne ikke finde agents-office. Kør ./setup.sh, eller giv stien: node validate.mjs ~/agents-office');
  process.exit(2);
}
const load = f => import(pathToFileURL(path.join(OFFICE, f)).href);
const brainPath = path.join(PACK, 'brain');

const { loadRoster } = await load('roster.mjs');
const { loadSkills } = await load('skills.mjs');
const routines = await load('routines.mjs');

let problems = 0;
const fail = m => { problems++; console.log('  ✗ ' + m); };

console.log(`\nBrain: ${brainPath}`);

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

console.log(problems ? `\n${problems} problem(er) — ret dem i brain/Agents Office/\n` : '\nAlt validerer.\n');
process.exit(problems ? 1 : 0);
