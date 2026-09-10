// Outlook som connector for kontoret. Læser postkassen og laver udkast.
//
// Der er MED VILJE ingen send-funktion. Agenterne kan skrive et svar, men et menneske
// trykker send i Outlook. Det er den samme grænse, der står i agenternes briefs.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { graf, tekst, dato, Fejl } from './graf.mjs';

const server = new McpServer({ name: 'klar-outlook', version: '1.0.0' });

const svar = t => ({ content: [{ type: 'text', text: t }] });
const fejlsvar = e => ({ isError: true, content: [{ type: 'text', text: e instanceof Fejl ? e.message : `Outlook svarede ikke som forventet: ${e.message}` }] });
const kort = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };
const afsender = m => m?.from?.emailAddress ? `${m.from.emailAddress.name || ''} <${m.from.emailAddress.address}>`.trim() : '(ukendt afsender)';

// ── mapper ─────────────────────────────────────────────────────────────────────
server.registerTool('outlook_mapper', {
  title: 'Postkassens mapper',
  description: 'Viser mapperne i postkassen med antal ulæste. Brug id\'et herfra i outlook_mails, når du vil se en anden mappe end indbakken.',
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async () => {
  try {
    const d = await graf('/me/mailFolders?$top=50&$select=id,displayName,unreadItemCount,totalItemCount');
    const linjer = (d.value || []).map(f => `${f.displayName}  ·  ${f.unreadItemCount} ulæste af ${f.totalItemCount}  ·  id: ${f.id}`);
    return svar(linjer.length ? linjer.join('\n') : 'Ingen mapper fundet.');
  } catch (e) { return fejlsvar(e); }
});

// ── liste ──────────────────────────────────────────────────────────────────────
server.registerTool('outlook_mails', {
  title: 'Læs listen over mails',
  description: 'Viser mails i en mappe: afsender, emne, tidspunkt, om den er læst, og de første linjer. Brug det til triage. Hele teksten hentes med outlook_mail.',
  inputSchema: {
    mappe: z.string().optional().describe('Mappens id fra outlook_mapper, eller et velkendt navn som "inbox", "sentitems", "drafts". Standard: inbox.'),
    antal: z.number().int().min(1).max(50).optional().describe('Hvor mange mails, 1-50. Standard 20.'),
    kun_ulaeste: z.boolean().optional().describe('Kun ulæste mails. Standard false.'),
    soeg: z.string().optional().describe('Fritekstsøgning i emne, afsender og indhold. Kan ikke kombineres med kun_ulaeste.'),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ mappe = 'inbox', antal = 20, kun_ulaeste = false, soeg }) => {
  try {
    const felter = '$select=id,subject,from,receivedDateTime,isRead,hasAttachments,bodyPreview';
    const q = [felter, `$top=${antal}`];
    if (soeg) q.push(`$search=${encodeURIComponent('"' + soeg.replace(/"/g, '') + '"')}`);
    else { q.push('$orderby=receivedDateTime desc'); if (kun_ulaeste) q.push('$filter=isRead eq false'); }
    const d = await graf(`/me/mailFolders/${encodeURIComponent(mappe)}/messages?${q.join('&')}`);
    const mails = d.value || [];
    if (!mails.length) return svar(kun_ulaeste ? 'Ingen ulæste mails i den mappe.' : 'Ingen mails fundet.');
    return svar(mails.map(m =>
      `${m.isRead ? '  ' : '● '}${dato(m.receivedDateTime)}  ${afsender(m)}\n` +
      `   ${m.subject || '(intet emne)'}${m.hasAttachments ? '  [vedhæftning]' : ''}\n` +
      `   ${kort(m.bodyPreview, 160)}\n   id: ${m.id}`
    ).join('\n\n'));
  } catch (e) { return fejlsvar(e); }
});

// ── én mail ────────────────────────────────────────────────────────────────────
server.registerTool('outlook_mail', {
  title: 'Læs én mail',
  description: 'Henter hele teksten i en mail, plus modtagere og navnene på vedhæftninger.',
  inputSchema: { id: z.string().describe('Mailens id fra outlook_mails.') },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ id }) => {
  try {
    const m = await graf(`/me/messages/${encodeURIComponent(id)}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments,conversationId`);
    const folk = liste => (liste || []).map(r => r.emailAddress?.address).filter(Boolean).join(', ') || '—';
    let vedhæft = '';
    if (m.hasAttachments) {
      const a = await graf(`/me/messages/${encodeURIComponent(id)}/attachments?$select=name,size`);
      vedhæft = '\nVedhæftet: ' + ((a.value || []).map(x => `${x.name} (${Math.round((x.size || 0) / 1024)} kB)`).join(', ') || '—');
    }
    return svar(
      `Fra:      ${afsender(m)}\nTil:      ${folk(m.toRecipients)}\n` +
      (m.ccRecipients?.length ? `Cc:       ${folk(m.ccRecipients)}\n` : '') +
      `Modtaget: ${dato(m.receivedDateTime)}\nEmne:     ${m.subject || '(intet emne)'}${vedhæft}\n` +
      `\n${tekst(m.body?.content)}`
    );
  } catch (e) { return fejlsvar(e); }
});

// ── udkast ─────────────────────────────────────────────────────────────────────
server.registerTool('outlook_udkast', {
  title: 'Lav et udkast',
  description: 'Lægger et udkast i Kladder. Det bliver IKKE sendt — et menneske læser det og trykker send i Outlook. Svar på en mail ved at give svar_paa; ellers skal til og emne udfyldes.',
  inputSchema: {
    tekst: z.string().min(1).describe('Selve brevteksten, ren tekst. Linjeskift bevares.'),
    svar_paa: z.string().optional().describe('Id på den mail, der svares på. Så bliver emne og modtager sat automatisk.'),
    til: z.array(z.string().email()).optional().describe('Modtagere. Kræves når svar_paa ikke er givet.'),
    emne: z.string().optional().describe('Emnelinje. Kræves når svar_paa ikke er givet.'),
    svar_alle: z.boolean().optional().describe('Svar til alle på tråden i stedet for kun afsenderen. Standard false.'),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
}, async ({ tekst: brev, svar_paa, til, emne, svar_alle = false }) => {
  try {
    const html = brev.split('\n').map(l => l.trim() === '' ? '<p></p>' : `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
    let udkast;
    if (svar_paa) {
      udkast = await graf(`/me/messages/${encodeURIComponent(svar_paa)}/${svar_alle ? 'createReplyAll' : 'createReply'}`, { metode: 'POST', krop: {} });
      await graf(`/me/messages/${encodeURIComponent(udkast.id)}`, { metode: 'PATCH', krop: { body: { contentType: 'HTML', content: html } } });
    } else {
      if (!til?.length || !emne) return fejlsvar(new Fejl('Uden svar_paa skal både til og emne udfyldes.'));
      udkast = await graf('/me/messages', {
        metode: 'POST',
        krop: { subject: emne, body: { contentType: 'HTML', content: html }, toRecipients: til.map(a => ({ emailAddress: { address: a } })) },
      });
    }
    return svar(`Udkastet ligger i Kladder. Det er ikke sendt.\nEmne: ${udkast.subject || emne || '(fra tråden)'}\nid: ${udkast.id}\n\nEt menneske skal læse det og trykke send i Outlook.`);
  } catch (e) { return fejlsvar(e); }
});

await server.connect(new StdioServerTransport());
