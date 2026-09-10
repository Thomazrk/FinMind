// Klar Forsikring — henter det nyeste, sætter op og starter kontoret. Én kommando.
//
//   node <fuld sti>/klar-forsikring-office/koer.mjs
//
// Den kan køres fra hvor som helst: den regner selv ud, hvor den ligger, og arbejder derfra.
// Ingen cd, ingen relative stier.
//
//   --uden-opdatering   spring git pull over
//   --kun-tjek          tjek kun, start ikke
//   --connectors        installér Outlook- og portal-connectorne og stop
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const fed = s => `\u001b[1m${s}\u001b[0m`;
const gul = s => `\u001b[33m${s}\u001b[0m`;

const node = (fil, args = []) => spawnSync(process.execPath, [path.join(PACK, fil), ...args], { cwd: PACK, stdio: 'inherit' });
const git = args => spawnSync('git', args, { cwd: PACK, stdio: 'inherit', shell: win });
// npm hedder npm.cmd på Windows og skal gennem en shell
const npm = mappe => spawnSync('npm', ['install'], { cwd: path.join(PACK, mappe), stdio: 'inherit', shell: win });

console.log(fed(`\nKlar Forsikring — kontoret\n${PACK}\n`));

if (!process.argv.includes('--uden-opdatering')) {
  console.log(fed('Henter det nyeste'));
  const r = git(['pull', '--ff-only']);
  if (r.status !== 0) {
    console.log(gul('\nKunne ikke hente det nyeste. Vi fortsætter med det, der ligger på maskinen.'));
    console.log(gul('Har du selv rettet i filerne, så gem dine ændringer først (git status viser hvad der er ændret).\n'));
  }
}

if (process.argv.includes('--connectors')) {
  for (const [navn, mappe] of [['Outlook', 'vaerktoj/mcp-outlook'], ['portalen', 'vaerktoj/mcp-portal']]) {
    console.log(fed(`\nInstallerer connectoren til ${navn}`));
    if (npm(mappe).status !== 0) { console.log(gul(`\nInstallationen af ${navn} fejlede.\n`)); process.exit(1); }
  }
  console.log(fed('\nBegge er installeret.'));
  console.log(`Næste skridt står i:\n  ${path.join(PACK, 'vaerktoj', 'mcp-outlook', 'README.md')}\n  ${path.join(PACK, 'vaerktoj', 'mcp-portal', 'README.md')}\n`);
  process.exit(0);
}

console.log(fed('\nTjekker'));
const tjek = node('tjek.mjs');
if (tjek.status !== 0) {
  console.log(gul('\nNoget skal rettes, før kontoret kan starte. Se linjerne med FEJL ovenfor.'));
  console.log(gul('Er du i tvivl, så send rapporten nederst.\n'));
  process.exit(1);
}

console.log(fed('\nSætter op'));
if (node('setup.mjs').status !== 0) process.exit(1);

if (process.argv.includes('--kun-tjek')) {
  console.log(fed('\n--kun-tjek: alt er klar. Start med:'));
  console.log(`  node "${path.join(PACK, 'koer.mjs')}" --uden-opdatering\n`);
  process.exit(0);
}

console.log(fed('\nStarter kontoret'));
process.exit(node('start.mjs').status ?? 1);
