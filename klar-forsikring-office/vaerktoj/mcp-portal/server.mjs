// Portalens Firestore som connector for kontoret. Kun læsning.
//
// Der er ingen skrive- eller slettefunktioner. Agenterne kan slå op i portalens data,
// men de kan ikke ændre en eneste linje. Hvad de må læse, står i samlinger.json.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Firestore } from '@google-cloud/firestore';
import { z } from 'zod';
import { lavRens } from './rens.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HER = path.dirname(fileURLToPath(import.meta.url));
const KONFIG = JSON.parse(fs.readFileSync(path.join(HER, 'samlinger.json'), 'utf8'));
const TILLADT = (KONFIG.tilladte_samlinger || []).filter(s => typeof s === 'string');
const MAKS = KONFIG.maks_dokumenter || 50;
const MAKS_TEGN = KONFIG.maks_tegn_pr_felt || 500;

class Fejl extends Error {}
const svar = t => ({ content: [{ type: 'text', text: t }] });
const fejlsvar = e => ({ isError: true, content: [{ type: 'text', text: e instanceof Fejl ? e.message : `Portalen svarede ikke som forventet: ${e.message}` }] });

let db = null;
function firestore() {
  if (db) return db;
  const nøgle = process.env.KLAR_FIREBASE_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!nøgle) throw new Fejl('KLAR_FIREBASE_KEY er ikke sat — den skal pege på service-konto-filen fra Firebase. Se README.md i denne mappe.');
  if (!fs.existsSync(nøgle)) throw new Fejl(`Service-konto-filen blev ikke fundet: ${nøgle}`);
  let konto;
  try { konto = JSON.parse(fs.readFileSync(nøgle, 'utf8')); }
  catch { throw new Fejl(`${nøgle} er ikke gyldig JSON. Hent filen igen fra Firebase-konsollen.`); }
  db = new Firestore({
    projectId: process.env.KLAR_FIREBASE_PROJECT || konto.project_id,
    credentials: { client_email: konto.client_email, private_key: konto.private_key },
  });
  return db;
}

function tjekSamling(navn) {
  if (!TILLADT.length) throw new Fejl('Ingen samlinger er givet fri endnu. Kør portal_samlinger for at se, hvad der findes, og skriv dem ind i vaerktoj/mcp-portal/samlinger.json.');
  if (!TILLADT.includes(navn)) throw new Fejl(`"${navn}" er ikke givet fri. Tilladte samlinger: ${TILLADT.join(', ')}`);
  return navn;
}

const rens = lavRens({ skjulte_felter: KONFIG.skjulte_felter, maks_tegn_pr_felt: MAKS_TEGN });
const vis = (id, data) => `${id}\n${JSON.stringify(rens(data), null, 2)}`;

const server = new McpServer({ name: 'klar-portal', version: '1.0.0' });

// ── hvilke samlinger findes ────────────────────────────────────────────────────

server.registerTool('portal_samlinger', {
  title: 'Hvilke samlinger findes i portalen',
  description: 'Viser samlingerne i portalens database, og hvilke af dem agenterne har fået lov at læse. Brug den, når du skal finde ud af, hvor noget ligger.',
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async () => {
  try {
    const alle = (await firestore().listCollections()).map(c => c.id).sort();
    if (!alle.length) return svar('Databasen har ingen samlinger — eller service-kontoen må ikke se dem.');
    const linjer = alle.map(n => `${TILLADT.includes(n) ? '✓' : '·'} ${n}`);
    return svar(
      `✓ = agenterne må læse den, · = spærret\n\n${linjer.join('\n')}\n\n` +
      (TILLADT.length ? `Tilladt: ${TILLADT.join(', ')}` : 'Ingen er givet fri endnu. Skriv dem ind i vaerktoj/mcp-portal/samlinger.json.')
    );
  } catch (e) { return fejlsvar(e); }
});

// ── søg ────────────────────────────────────────────────────────────────────────
const OPERATORER = ['==', '!=', '<', '<=', '>', '>=', 'array-contains', 'in', 'not-in'];

server.registerTool('portal_find', {
  title: 'Find dokumenter i portalen',
  description: 'Søger i en samling. Uden filter kommer de nyeste eller de første dokumenter. Følsomme felter vises som [skjult], og lange tekster klippes.',
  inputSchema: {
    samling: z.string().describe('Navnet på samlingen, fra portal_samlinger.'),
    hvor: z.array(z.object({
      felt: z.string(),
      operator: z.enum(OPERATORER).describe('== != < <= > >= array-contains in not-in'),
      vaerdi: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
    })).optional().describe('Filtre, der alle skal passe. Fx [{"felt":"status","operator":"==","vaerdi":"aktiv"}].'),
    sorter_efter: z.string().optional().describe('Felt der sorteres på.'),
    faldende: z.boolean().optional().describe('Nyeste først. Standard false.'),
    antal: z.number().int().min(1).max(MAKS).optional().describe(`Hvor mange dokumenter, højst ${MAKS}. Standard 10.`),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ samling, hvor = [], sorter_efter, faldende = false, antal = 10 }) => {
  try {
    const navn = tjekSamling(samling);
    let q = firestore().collection(navn);
    for (const f of hvor) q = q.where(f.felt, f.operator, f.vaerdi);
    if (sorter_efter) q = q.orderBy(sorter_efter, faldende ? 'desc' : 'asc');
    const snap = await q.limit(Math.min(antal, MAKS)).get();
    if (snap.empty) return svar('Ingen dokumenter passer på det.');
    return svar(`${snap.size} dokument(er) i ${samling}:\n\n` + snap.docs.map(d => vis(d.id, d.data())).join('\n\n'));
  } catch (e) {
    if (/index/i.test(e.message)) return fejlsvar(new Fejl(`Firestore mangler et indeks til den søgning. Enten forenkler du søgningen, eller også laves indekset i Firebase-konsollen. Firestores egen besked: ${e.message}`));
    return fejlsvar(e);
  }
});

// ── ét dokument ────────────────────────────────────────────────────────────────
server.registerTool('portal_dokument', {
  title: 'Hent ét dokument',
  description: 'Henter et enkelt dokument, når du kender dets id.',
  inputSchema: {
    samling: z.string().describe('Navnet på samlingen.'),
    id: z.string().describe('Dokumentets id.'),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ samling, id }) => {
  try {
    const navn = tjekSamling(samling);
    const d = await firestore().collection(navn).doc(id).get();
    if (!d.exists) return svar(`Der er ikke noget dokument med id "${id}" i ${samling}.`);
    return svar(vis(d.id, d.data()));
  } catch (e) { return fejlsvar(e); }
});

await server.connect(new StdioServerTransport());
