// Klar Forsikring — henter det nyeste, sætter op og starter kontoret. Én kommando.
//
//   node <fuld sti>/klar-forsikring-office/koer.mjs
//
// Kan køres fra hvor som helst: den regner selv ud, hvor den ligger, og arbejder derfra.
// Ingen cd, ingen relative stier.
//
//   --uden-opdatering   spring git pull over
//   --kun-tjek          sæt op og gennemgå maskinen, men start ikke
//   --connectors        installér Outlook- og portal-connectorne og stop
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const fed = s => `\u001b[1m${s}\u001b[0m`;
const gul = s => `\u001b[33m${s}\u001b[0m`;
const har = f => process.argv.includes(f);

// node og git er rigtige programmer og skal ikke gennem en shell — stien til dem kan indeholde
// mellemrum ("C:\\Program Files\\..."), og en shell knækker den der. npm hedder npm.cmd på
// Windows og skal omvendt gennem en shell for at blive fundet.
const kørNode = (fil, args = []) => spawnSync(process.execPath, [path.join(PACK, fil), ...args], { cwd: PACK, stdio: 'inherit' });
const kørGit = args => spawnSync('git', args, { cwd: PACK, stdio: 'inherit' });
const kørNpm = mappe => spawnSync('npm', ['install'], { cwd: path.join(PACK, mappe), stdio: 'inherit', shell: win });

console.log(fed(`\nKlar Forsikring — kontoret\n${PACK}\n`));

// 1 — det nyeste
if (!har('--uden-opdatering')) {
  console.log(fed('Henter det nyeste'));
  if (kørGit(['pull', '--ff-only']).status !== 0) {
    console.log(gul('\nKunne ikke hente det nyeste. Vi fortsætter med det, der ligger på maskinen.'));
    console.log(gul('Har du selv rettet i filerne, så gem dem først — "git status" viser hvad der er ændret.\n'));
  }
}

// 2 — connectorne, hvis det er dem, der skal installeres
if (har('--connectors')) {
  for (const [navn, mappe] of [['Outlook', 'vaerktoj/mcp-outlook'], ['portalen', 'vaerktoj/mcp-portal']]) {
    console.log(fed(`\nInstallerer connectoren til ${navn}`));
    if (kørNpm(mappe).status !== 0) { console.log(gul(`\nInstallationen af ${navn} fejlede.\n`)); process.exit(1); }
  }
  console.log(fed('\nBegge er installeret.'));
  console.log(`Næste skridt står i:\n  ${path.join(PACK, 'vaerktoj', 'mcp-outlook', 'README.md')}\n  ${path.join(PACK, 'vaerktoj', 'mcp-portal', 'README.md')}\n`);
  process.exit(0);
}

// 3 — opsætningen. Den henter og bygger motoren og validerer vores egne filer til sidst.
//     Den kører FØR tjek.mjs: på en frisk maskine er "ikke sat op endnu" ikke en fejl,
//     det er netop det, opsætningen er til for.
console.log(fed('\nSætter op'));
if (kørNode('setup.mjs').status !== 0) {
  console.log(gul('\nOpsætningen kunne ikke gøres færdig. Her er, hvad maskinen mangler:\n'));
  kørNode('tjek.mjs');
  console.log(gul('\nSend linjerne nederst, hvis du er i tvivl.\n'));
  process.exit(1);
}

// 4 — gennemgang, når der bedes om den
if (har('--kun-tjek')) {
  kørNode('tjek.mjs');
  console.log(fed('Start kontoret med:'));
  console.log(`  node "${path.join(PACK, 'koer.mjs')}" --uden-opdatering\n`);
  process.exit(0);
}

// 5 — i gang
console.log(fed('\nStarter kontoret'));
process.exit(kørNode('start.mjs').status ?? 1);
