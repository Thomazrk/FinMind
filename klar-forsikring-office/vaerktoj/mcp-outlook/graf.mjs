// Login mod Microsoft 365 og kald til Microsoft Graph.
// Bruger device code flow: I logger ind i browseren, og der ligger ingen hemmelighed på maskinen
// ud over den token, Microsoft giver tilbage. Den ligger i privat/ og er gitignoreret.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HER = path.dirname(fileURLToPath(import.meta.url));
export const PACK = path.resolve(HER, '..', '..');
export const TOKEN_FIL = path.join(PACK, 'privat', 'outlook-token.json');

export const CLIENT_ID = process.env.KLAR_MS_CLIENT_ID || '';
export const TENANT = process.env.KLAR_MS_TENANT || 'organizations';
export const SCOPES = 'offline_access Mail.Read Mail.ReadWrite';
const AUTH = t => `https://login.microsoftonline.com/${encodeURIComponent(t)}/oauth2/v2.0`;
const GRAPH = 'https://graph.microsoft.com/v1.0';

export class Fejl extends Error {}

const læs = () => { try { return JSON.parse(fs.readFileSync(TOKEN_FIL, 'utf8')); } catch { return null; } };
const skriv = t => {
  fs.mkdirSync(path.dirname(TOKEN_FIL), { recursive: true });
  fs.writeFileSync(TOKEN_FIL, JSON.stringify(t, null, 2), { mode: 0o600 });
};

async function form(url, felter) {
  const svar = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(felter).toString(),
  });
  const krop = await svar.json().catch(() => ({}));
  return { ok: svar.ok, status: svar.status, krop };
}

/** Starter et device code-login. Kalder visKode med det, brugeren skal gøre, og venter. */
export async function login(visKode) {
  if (!CLIENT_ID) throw new Fejl('KLAR_MS_CLIENT_ID er ikke sat. Se README.md i denne mappe.');
  const start = await form(`${AUTH(TENANT)}/devicecode`, { client_id: CLIENT_ID, scope: SCOPES });
  if (!start.ok) throw new Fejl(`Microsoft afviste starten på login: ${start.krop.error_description || start.status}`);
  const { device_code, user_code, verification_uri, expires_in, interval } = start.krop;
  visKode({ kode: user_code, adresse: verification_uri, minutter: Math.round((expires_in || 900) / 60) });

  const slut = Date.now() + (expires_in || 900) * 1000;
  let vent = (interval || 5) * 1000;
  while (Date.now() < slut) {
    await new Promise(r => setTimeout(r, vent));
    const svar = await form(`${AUTH(TENANT)}/token`, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID, device_code,
    });
    if (svar.ok) { skriv({ ...svar.krop, udloeber: Date.now() + (svar.krop.expires_in - 60) * 1000 }); return true; }
    const fejl = svar.krop.error;
    if (fejl === 'authorization_pending') continue;
    if (fejl === 'slow_down') { vent += 5000; continue; }
    if (fejl === 'authorization_declined') throw new Fejl('Login blev afvist i browseren.');
    if (fejl === 'expired_token') throw new Fejl('Koden nåede at udløbe. Prøv igen.');
    throw new Fejl(svar.krop.error_description || fejl || 'ukendt fejl under login');
  }
  throw new Fejl('Der kom aldrig svar på login inden for tidsfristen.');
}

async function token() {
  const t = læs();
  if (!t) throw new Fejl('Ikke logget ind i Microsoft 365 endnu. Kør:  node vaerktoj/mcp-outlook/login.mjs');
  if (t.udloeber && Date.now() < t.udloeber) return t.access_token;
  if (!t.refresh_token) throw new Fejl('Loginnet er udløbet. Kør:  node vaerktoj/mcp-outlook/login.mjs');
  const ny = await form(`${AUTH(TENANT)}/token`, {
    grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: t.refresh_token, scope: SCOPES,
  });
  if (!ny.ok) throw new Fejl(`Kunne ikke forny loginnet (${ny.krop.error || ny.status}). Kør:  node vaerktoj/mcp-outlook/login.mjs`);
  skriv({ ...t, ...ny.krop, udloeber: Date.now() + (ny.krop.expires_in - 60) * 1000 });
  return ny.krop.access_token;
}

/** Kalder Graph. sti starter med "/". */
export async function graf(sti, { metode = 'GET', krop = null } = {}) {
  const svar = await fetch(GRAPH + sti, {
    method: metode,
    headers: {
      authorization: `Bearer ${await token()}`,
      ...(krop ? { 'content-type': 'application/json' } : {}),
    },
    body: krop ? JSON.stringify(krop) : undefined,
  });
  if (svar.status === 204) return null;
  const data = await svar.json().catch(() => ({}));
  if (!svar.ok) {
    const besked = data?.error?.message || `HTTP ${svar.status}`;
    if (svar.status === 401) throw new Fejl(`Microsoft afviste adgangen (${besked}). Kør:  node vaerktoj/mcp-outlook/login.mjs`);
    if (svar.status === 403) throw new Fejl(`Ingen tilladelse til det (${besked}). Appregistreringen mangler Mail.Read eller Mail.ReadWrite — se README.md.`);
    if (svar.status === 429) throw new Fejl('Microsoft beder os vente lidt (for mange kald). Prøv igen om et øjeblik.');
    throw new Fejl(besked);
  }
  return data;
}

/** HTML → læselig tekst. Graph kan give ren tekst, men svarer ofte med HTML. */
export function tekst(html = '', maks = 4000) {
  const t = String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t.length > maks ? t.slice(0, maks) + `\n\n[…afkortet, ${t.length - maks} tegn mere]` : t;
}

export const dato = s => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? String(s) : d.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' });
};
