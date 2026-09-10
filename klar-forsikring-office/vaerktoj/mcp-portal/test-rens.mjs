// Tjekker at maskeringen virker. Kør: node vaerktoj/mcp-portal/test-rens.mjs
import { lavRens } from './rens.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const K = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'samlinger.json'), 'utf8'));
const rens = lavRens({ skjulte_felter: K.skjulte_felter, maks_tegn_pr_felt: 20 });

let fejl = 0;
const skal = (navn, faktisk, forventet) => {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet);
  if (!ok) fejl++;
  console.log(`${ok ? 'OK  ' : 'FEJL'}  ${navn}${ok ? '' : `\n      fik:      ${JSON.stringify(faktisk)}\n      forventet: ${JSON.stringify(forventet)}`}`);
};

skal('CPR skjules', rens({ navn: 'Test', cpr: '010190-1234' }), { navn: 'Test', cpr: '[skjult]' });
skal('CPR skjules uanset skrivemåde', rens({ CPR_nr: 'x', personnummer: 'y' }), { CPR_nr: '[skjult]', personnummer: '[skjult]' });
skal('skjules også dybt nede', rens({ kunde: { kontonummer: '123', by: 'Silkeborg' } }), { kunde: { kontonummer: '[skjult]', by: 'Silkeborg' } });
skal('lange tekster klippes', rens({ note: 'a'.repeat(30) }), { note: 'a'.repeat(20) + '…' });
skal('lister klippes ikke unødigt', rens({ tags: ['bil', 'indbo'] }), { tags: ['bil', 'indbo'] });
skal('datoer bliver læselige', rens({ oprettet: new Date('2026-09-14T10:00:00Z') }), { oprettet: '2026-09-14' });
skal('Firestore-timestamps bliver læselige', rens({ d: { toDate: () => new Date('2026-01-02T00:00:00Z') } }), { d: '2026-01-02' });
skal('almindelige felter er urørte', rens({ policenr: 'BIL-99123', aktiv: true, antal: 3 }), { policenr: 'BIL-99123', aktiv: true, antal: 3 });

console.log(fejl ? `\n${fejl} fejl\n` : '\nAlt passer.\n');
process.exit(fejl ? 1 : 0);
