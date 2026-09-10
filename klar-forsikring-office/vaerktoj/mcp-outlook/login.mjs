// Logger ind i Microsoft 365, så kontoret kan læse postkassen og lave udkast.
//   node vaerktoj/mcp-outlook/login.mjs
import { login, TOKEN_FIL, CLIENT_ID, TENANT, Fejl } from './graf.mjs';

if (!CLIENT_ID) {
  console.error('\nKLAR_MS_CLIENT_ID er ikke sat.\n\nSæt den først — se README.md i denne mappe:\n  Windows:  $env:KLAR_MS_CLIENT_ID = "..."\n  Mac:      export KLAR_MS_CLIENT_ID="..."\n');
  process.exit(1);
}
console.log(`\nLogger ind i Microsoft 365 (tenant: ${TENANT})\n`);
try {
  await login(({ kode, adresse, minutter }) => {
    console.log('  1. Åbn denne side i en browser:  ' + adresse);
    console.log('  2. Skriv koden:                  ' + kode);
    console.log('  3. Log ind med den konto, postkassen hører til.');
    console.log(`\n  Koden gælder i ${minutter} minutter. Jeg venter…\n`);
  });
  console.log(`Logget ind. Tokenet ligger i ${TOKEN_FIL} — den mappe er gitignoreret.\n`);
} catch (e) {
  console.error(`\nFejl: ${e instanceof Fejl ? e.message : e.message}\n`);
  process.exit(1);
}
