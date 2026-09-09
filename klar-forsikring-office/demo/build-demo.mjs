// Bygger demo/demo.html — en telefonvenlig demo af klarforsikrings agentkontor.
// Læser roster, rutiner og færdigheder fra brain'et, og lægger skærmbillederne ind i filen,
// så siden er én fil uden eksterne kald.  Kør:  node demo/build-demo.mjs
import fs from 'node:fs';
import path from 'node:path';

const PACK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BRAIN = path.join(PACK, 'brain', 'Agents Office');
const read = p => fs.readFileSync(p, 'utf8');
const agents = JSON.parse(read(path.join(BRAIN, 'agents.json'))).agents;
const routines = JSON.parse(read(path.join(BRAIN, 'routines.json'))).routines;
const img = n => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(PACK, 'demo', 'billeder', n)).toString('base64');
const notes = fs.readdirSync(path.join(PACK, 'brain'), { recursive: true }).filter(f => String(f).endsWith('.md') && !String(f).includes('Agents Office')).length;

const DEPTS = [
  { key: 'emails', navn: 'Kundepost', under: 'Post ind og ud — kunder, selskaber, partnere' },
  { key: 'sales', navn: 'Salg og rådgivning', under: 'Fra henvendelse til police' },
  { key: 'delivery', navn: 'Skade og kundeservice', under: 'Sager, policer, dokumenter, klager' },
  { key: 'fin', navn: 'Økonomi', under: 'Provision, udgifter, afstemning' },
  { key: 'ops', navn: 'Drift', under: 'Compliance, aftaler, rapportering' },
  { key: 'marketing', navn: 'Marketing', under: 'Indhold, annoncer, markedsovervågning' },
];

const NAAR = {
  weekdays: w => `hverdage ${w.at}`,
  daily: w => `hver dag ${w.at}`,
  weekly: w => `${['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'][w.days[0]]} ${w.at}`,
};
const DEPT_NAVN = { emails: 'Kundepost', sales: 'Salg', fin: 'Økonomi' };

const SKILLS = [
  { navn: 'house-style', hvem: 'alle 35', hvad: 'Sådan skriver vi.', regler: ['Aldrig "det er dækket" om en skade, selskabet ikke har afgjort.', 'Ingen CPR-numre, helbredsoplysninger eller kontonumre i noter.', 'Tal uden kilde skrives "(antaget)".'] },
  { navn: 'client-reply', hvem: 'Kundepost', hvad: 'Svar til en kunde.', regler: ['Svaret på spørgsmålet i de to første linjer.', 'Betingelser citeres fra selskabets afsnit, aldrig fra hukommelsen.', 'Pris, afslag eller dækningsændring: skriv udkastet, send det ikke.'] },
  { navn: 'proposal', hvem: 'TILBUD', hvad: 'Tilbud med dækningsoversigt.', regler: ['Ingen behovsafdækning på sagen = intet tilbud.', 'Hvert produkt siger også, hvad det ikke dækker.', 'Opsigelsesfristen læses i kundens nuværende police.'] },
  { navn: 'skadesag', hvem: 'SAGSKOORDINATOR, SERVICECHEF', hvad: 'Tag imod en skade, anmeld, følg sagen.', regler: ['Sagens hoved: police, selskab, skadedato, selskabets sagsnr., næste rykkerdato.', 'Frister læses i selskabets eget brev.', 'Vi hjælper aldrig med at formulere en anmeldelse anderledes, end det skete.'] },
  { navn: 'klagesvar', hvem: 'SERVICECHEF, DRIFTSCHEF', hvad: 'Klager.', regler: ['Kvittering samme dag, sagen til ledelsen med det samme.', 'Ingen agent besvarer en klage selv.', 'Klagemulighed oplyses altid.'] },
];

const TRIN = [
  { t: 'Du skriver opgaven', b: 'I bjælken øverst: «Skriv et svar til kunden på police 99123 om selvrisikoen». Vælg afdeling, tryk Add.' },
  { t: 'Claude finder skrivebordet', b: 'Opgaven lander hos KUNDEMAILS i Kundepost — den plads, hvis beskrivelse passer på opgaven.' },
  { t: 'Agenten læser husets regler', b: 'Mailregler, policeservice og tone of voice fra brain’et, plus færdigheden client-reply og sin egen brief.' },
  { t: 'Leverancen kommer tilbage', b: 'I agentens chat og som dateret note i brain’et, med link til hver note den læste. Skal der sendes noget ud, venter den på dit ja.' },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const brief = a => (Array.isArray(a.brief) ? a.brief : a.brief ? [a.brief] : []);

const deskList = d => agents.filter(a => {
  const seat = a.id;
  return SEATS[seat] === d.key;
}).map(a => `
        <details class="desk">
          <summary>
            <span class="desk-navn">${esc(a.name)}</span>
            <span class="desk-rolle">${esc(a.role)}</span>
            <span class="chev" aria-hidden="true"></span>
          </summary>
          <div class="desk-krop">
            <p class="does">${esc(a.does)}</p>
            ${brief(a).length ? `<p class="brief-mrk">Stående instruks</p><ul class="brief">${brief(a).map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
            ${a.tools?.length ? `<p class="vaerktoj">Connectors: ${a.tools.map(esc).join(' · ')}</p>` : ''}
          </div>
        </details>`).join('');

// pladsernes afdeling kommer fra motorens faste opsætning
const SEATS = {
  elead: 'emails', cmail: 'emails', imail: 'emails', vmail: 'emails', kmail: 'emails',
  lexi: 'sales', enzo: 'sales', ilm: 'sales', pros: 'sales', piper: 'sales', folo: 'sales',
  mlead: 'marketing', riley: 'marketing', newt: 'marketing', gfx: 'marketing', ada: 'marketing', iggy: 'marketing', vid: 'marketing',
  olead: 'ops', scout: 'ops', legal: 'ops', comply: 'ops', report: 'ops', dash: 'ops',
  alead: 'fin', invo: 'fin', apay: 'fin', recon: 'fin',
  dlead: 'delivery', pco: 'delivery', qa: 'delivery', crep: 'delivery', cass: 'delivery', dasst: 'delivery', ona: 'delivery',
};

const html = `<title>Klarforsikrings agentkontor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root {
    --papir: #F4F2EC;
    --flade: #FCFBF8;
    --blaek: #1A1917;
    --blaek-2: #56534C;
    --streg: rgba(26,25,23,.13);
    --streg-2: rgba(26,25,23,.07);
    --accent: #14524B;
    --accent-flade: rgba(20,82,75,.09);
    --rav: #8A5B08;
    --rav-flade: rgba(138,91,8,.11);
    --d-kundepost: #3F8F7C; --d-salg: #B4883A; --d-skade: #4C7FA6;
    --d-oekonomi: #7C6DA8; --d-drift: #A2606C; --d-marketing: #9C6F8F;
    --ui: "Familjen Grotesk", "Helvetica Neue", Arial, sans-serif;
    --brod: "Newsreader", Georgia, "Times New Roman", serif;
    --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
    --maks: 34rem;
  }
  :root:not([data-theme="light"]) { color-scheme: light dark; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --papir: #131512; --flade: #1B1E1A; --blaek: #EAE8E0; --blaek-2: #9B978C;
      --streg: rgba(234,232,224,.17); --streg-2: rgba(234,232,224,.08);
      --accent: #6FC3AC; --accent-flade: rgba(111,195,172,.13);
      --rav: #DCA94E; --rav-flade: rgba(220,169,78,.14);
      --d-kundepost: #5FB89F; --d-salg: #D3A94F; --d-skade: #6EA2CC;
      --d-oekonomi: #A08FD0; --d-drift: #C9838F; --d-marketing: #C291B3;
    }
  }
  :root[data-theme="dark"] {
    --papir: #131512; --flade: #1B1E1A; --blaek: #EAE8E0; --blaek-2: #9B978C;
    --streg: rgba(234,232,224,.17); --streg-2: rgba(234,232,224,.08);
    --accent: #6FC3AC; --accent-flade: rgba(111,195,172,.13);
    --rav: #DCA94E; --rav-flade: rgba(220,169,78,.14);
    --d-kundepost: #5FB89F; --d-salg: #D3A94F; --d-skade: #6EA2CC;
    --d-oekonomi: #A08FD0; --d-drift: #C9838F; --d-marketing: #C291B3;
    color-scheme: dark;
  }

  body { background: var(--papir); color: var(--blaek); font-family: var(--brod); font-size: 16px; line-height: 1.55; -webkit-text-size-adjust: 100%; }
  .side { max-width: var(--maks); margin: 0 auto; padding: 0 20px 72px; }
  h1, h2, h3, .mrk, .ui { font-family: var(--ui); }
  h1 { font-size: clamp(1.85rem, 7vw, 2.4rem); line-height: 1.08; font-weight: 700; letter-spacing: -.02em; text-wrap: balance; }
  h2 { font-size: 1.28rem; font-weight: 600; letter-spacing: -.01em; text-wrap: balance; }
  h3 { font-size: 1rem; font-weight: 600; }
  p { text-wrap: pretty; }
  .mrk { font-size: .7rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; color: var(--blaek-2); }

  /* hoved */
  header { padding: 40px 0 26px; display: flex; flex-direction: column; gap: 14px; }
  .kicker { display: flex; align-items: center; gap: 9px; }
  .kicker .prik { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex: none; }
  .deck { font-size: 1.06rem; color: var(--blaek-2); }
  .deck b { color: var(--blaek); font-weight: 500; }

  /* nøgletal som et dokumenthoved, ikke kort */
  .fakta { border-top: 1px solid var(--blaek); border-bottom: 1px solid var(--streg); margin-top: 6px; }
  .fakta div { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 9px 0; border-bottom: 1px solid var(--streg-2); }
  .fakta div:last-child { border-bottom: 0; }
  .fakta dt { font-family: var(--ui); font-size: .82rem; color: var(--blaek-2); }
  .fakta dd { font-family: var(--mono); font-size: .95rem; font-variant-numeric: tabular-nums; }

  section { padding-top: 40px; }
  .sek-hoved { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
  .sek-hoved p { color: var(--blaek-2); font-size: .96rem; }

  /* skærmbilleder */
  .skud { display: flex; flex-direction: column; gap: 22px; }
  .skud figure { display: flex; flex-direction: column; gap: 8px; }
  .ramme { border: 1px solid var(--streg); border-radius: 3px; overflow: hidden; background: var(--flade); cursor: zoom-in; display: block; width: 100%; padding: 0; }
  .ramme img { display: block; width: 100%; height: auto; }
  .skud figcaption { font-size: .88rem; color: var(--blaek-2); }
  .skud figcaption b { color: var(--blaek); font-weight: 500; font-family: var(--ui); font-size: .84rem; }
  .zoom-hint { font-family: var(--ui); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }

  /* afdelinger og skriveborde */
  .afd { margin-bottom: 26px; }
  .afd-hoved { display: flex; align-items: baseline; gap: 9px; padding-bottom: 7px; border-bottom: 1px solid var(--blaek); }
  .afd-hoved .prik { width: 8px; height: 8px; border-radius: 50%; flex: none; align-self: center; }
  .afd-hoved h3 { flex: 1; }
  .afd-hoved .antal { font-family: var(--mono); font-size: .82rem; color: var(--blaek-2); font-variant-numeric: tabular-nums; }
  .afd-under { font-size: .86rem; color: var(--blaek-2); padding: 7px 0 2px; }
  details.desk { border-bottom: 1px solid var(--streg-2); }
  details.desk summary { display: flex; align-items: baseline; gap: 10px; padding: 11px 0; cursor: pointer; list-style: none; }
  details.desk summary::-webkit-details-marker { display: none; }
  .desk-navn { font-family: var(--ui); font-size: .87rem; font-weight: 600; letter-spacing: .04em; flex: none; }
  .desk-rolle { font-size: .87rem; color: var(--blaek-2); flex: 1; }
  .chev { width: 8px; height: 8px; border-right: 1.5px solid var(--blaek-2); border-bottom: 1.5px solid var(--blaek-2); transform: rotate(45deg) translate(-2px, -2px); flex: none; transition: transform .18s ease; }
  details[open] .chev { transform: rotate(-135deg) translate(-1px, -1px); }
  .desk-krop { padding: 2px 0 16px; display: flex; flex-direction: column; gap: 10px; }
  .does { font-size: .97rem; }
  .brief-mrk { font-family: var(--ui); font-size: .68rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; color: var(--accent); }
  ul.brief { list-style: none; display: flex; flex-direction: column; gap: 7px; border-left: 2px solid var(--accent-flade); padding-left: 13px; }
  ul.brief li { font-size: .93rem; color: var(--blaek-2); }
  .vaerktoj { font-family: var(--mono); font-size: .74rem; color: var(--blaek-2); }

  /* timeplan */
  .plan { border-top: 1px solid var(--blaek); }
  .plan-r { display: grid; grid-template-columns: 1fr auto; gap: 3px 14px; padding: 13px 0; border-bottom: 1px solid var(--streg-2); }
  .plan-r .titel { font-family: var(--ui); font-size: .95rem; font-weight: 500; }
  .plan-r .tid { font-family: var(--mono); font-size: .8rem; color: var(--blaek-2); white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
  .plan-r .hvem { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .plan-r .hvem span { font-family: var(--ui); font-size: .74rem; letter-spacing: .06em; text-transform: uppercase; color: var(--blaek-2); }
  .chip { font-family: var(--ui); font-size: .68rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; background: var(--rav-flade); color: var(--rav); }
  .chip.gron { background: var(--accent-flade); color: var(--accent); }

  /* færdigheder */
  .faerd { display: flex; flex-direction: column; gap: 4px; }
  .faerd article { padding: 15px 0; border-bottom: 1px solid var(--streg-2); display: flex; flex-direction: column; gap: 9px; }
  .faerd h3 { font-family: var(--mono); font-size: .92rem; font-weight: 500; }
  .faerd .hvem { font-family: var(--ui); font-size: .72rem; letter-spacing: .07em; text-transform: uppercase; color: var(--blaek-2); }
  .faerd ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .faerd li { font-size: .93rem; color: var(--blaek-2); padding-left: 15px; position: relative; }
  .faerd li::before { content: ""; position: absolute; left: 0; top: .62em; width: 6px; height: 1px; background: var(--blaek-2); }

  /* trin — en rigtig rækkefølge, derfor numre */
  ol.trin { list-style: none; counter-reset: t; display: flex; flex-direction: column; gap: 0; }
  ol.trin li { counter-increment: t; display: grid; grid-template-columns: 26px 1fr; gap: 4px 12px; padding: 14px 0; border-bottom: 1px solid var(--streg-2); }
  ol.trin li::before { content: counter(t); font-family: var(--mono); font-size: .78rem; color: var(--accent); padding-top: .18em; }
  ol.trin h3 { font-size: .96rem; }
  ol.trin p { grid-column: 2; font-size: .93rem; color: var(--blaek-2); }

  /* opgaver til jer */
  .liste { list-style: none; display: flex; flex-direction: column; }
  .liste li { padding: 12px 0; border-bottom: 1px solid var(--streg-2); display: flex; gap: 12px; align-items: baseline; font-size: .95rem; }
  .liste code { font-family: var(--mono); font-size: .78rem; color: var(--blaek-2); }
  .note { margin-top: 22px; padding: 16px 18px; background: var(--flade); border: 1px solid var(--streg); border-left: 2px solid var(--rav); border-radius: 2px; font-size: .93rem; }
  .note b { font-family: var(--ui); font-size: .82rem; letter-spacing: .04em; text-transform: uppercase; color: var(--rav); display: block; margin-bottom: 6px; }

  footer { margin-top: 46px; padding-top: 20px; border-top: 1px solid var(--streg); font-size: .86rem; color: var(--blaek-2); display: flex; flex-direction: column; gap: 9px; }
  footer a { color: var(--accent); }

  /* fuldskærm */
  #lys[hidden] { display: none; }
  #lys { position: fixed; inset: 0; z-index: 50; background: rgba(12,13,11,.94); display: flex; flex-direction: column; }
  #lys .top { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; color: #EAE8E0; font-family: var(--ui); font-size: .78rem; letter-spacing: .06em; text-transform: uppercase; }
  #lys button { font: inherit; letter-spacing: inherit; text-transform: inherit; background: none; border: 1px solid rgba(234,232,224,.4); color: #EAE8E0; padding: 6px 12px; border-radius: 2px; cursor: pointer; }
  #lys .rul { flex: 1; overflow: auto; -webkit-overflow-scrolling: touch; }
  #lys img { display: block; width: 1600px; max-width: none; height: auto; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>

<div class="side">
  <header>
    <div class="kicker"><span class="prik"></span><span class="mrk">klarforsikring · agents office</span></div>
    <h1>Kontoret er sat op</h1>
    <p class="deck">Seks afdelinger, <b>35 skriveborde</b> og en hjerne af jeres egne noter. Agenterne læser husets regler, laver arbejdet og lægger resultatet tilbage i noterne. Her er, hvad der står i opsætningen lige nu.</p>
    <dl class="fakta">
      <div><dt>Skriveborde</dt><dd>35</dd></div>
      <div><dt>Afdelinger</dt><dd>6</dd></div>
      <div><dt>Noter i brain'et</dt><dd>${notes}</dd></div>
      <div><dt>Færdigheder</dt><dd>${SKILLS.length}</dd></div>
      <div><dt>Faste rutiner</dt><dd>${routines.length}</dd></div>
    </dl>
  </header>

  <section>
    <div class="sek-hoved">
      <h2>Sådan ser det ud</h2>
      <p>Billeder fra kontoret, mens det kørte med vores opsætning. Tryk for at se dem i fuld bredde.</p>
    </div>
    <div class="skud">
      <figure>
        <button class="ramme" data-billede="kontor" aria-label="Se kontoret i fuld bredde"><img src="${img('shot-kontor.jpg')}" alt="Det isometriske kontor med seks afdelinger omkring hjernen i midten"></button>
        <figcaption><b>Kontoret.</b> Seks pods om hjernen. Skrivebordene bærer vores navne — POSTCHEF, SELSKABSPOST, SAGSKOORDINATOR, PROVISION, FORSIKRINGSGENNEMGANG. Opgavefeeden til højre er motorens indbyggede demo-data på engelsk; skriveborde, rutiner og noter er vores. <span class="zoom-hint">Tryk for fuld bredde</span></figcaption>
      </figure>
      <figure>
        <button class="ramme" data-billede="tavle" aria-label="Se tavlen i fuld bredde"><img src="${img('shot-tavle.jpg')}" alt="Dagens tavle med planlagte opgaver pr. afdeling"></button>
        <figcaption><b>Dagens tavle.</b> Yderst til venstre står vores syv rutiner og venter: Morgentriage af kundepost i morgen 08:00, Rykkere til selskaberne 09:30, Kontrollér provisionsopgørelserne mandag. <span class="zoom-hint">Tryk for fuld bredde</span></figcaption>
      </figure>
      <figure>
        <button class="ramme" data-billede="brain" aria-label="Se hjernen i fuld bredde"><img src="${img('shot-brain.jpg')}" alt="Hjernen som en graf af noter og forbindelser"></button>
        <figcaption><b>Hjernen.</b> ${notes} noter og 70 forbindelser, sorteret i jeres egne mapper: forretning, kunder, kundepost, salg, skade, økonomi, drift. Det er dem, agenterne læser før hver opgave. <span class="zoom-hint">Tryk for fuld bredde</span></figcaption>
      </figure>
    </div>
  </section>

  <section>
    <div class="sek-hoved">
      <h2>De 35 skriveborde</h2>
      <p>Tryk på et navn for at se, hvad pladsen laver, og den stående instruks den læser før hver opgave.</p>
    </div>
    ${DEPTS.map(d => `
    <div class="afd">
      <div class="afd-hoved">
        <span class="prik" style="background: var(--d-${{ emails: 'kundepost', sales: 'salg', delivery: 'skade', fin: 'oekonomi', ops: 'drift', marketing: 'marketing' }[d.key]})"></span>
        <h3>${d.navn}</h3>
        <span class="antal">${agents.filter(a => SEATS[a.id] === d.key).length} pladser</span>
      </div>
      <p class="afd-under">${d.under}</p>
      ${deskList(d)}
    </div>`).join('')}
  </section>

  <section>
    <div class="sek-hoved">
      <h2>Timeplanen</h2>
      <p>Det kontoret gør af sig selv. Motoren kører kun rutiner for Kundepost, Salg og Økonomi i denne udgivelse.</p>
    </div>
    <div class="plan">
      ${routines.map(r => `
      <div class="plan-r">
        <span class="titel">${esc(r.title)}</span>
        <span class="tid">${esc((NAAR[r.when.kind] || (() => r.when.at))(r.when))}</span>
        <span class="hvem">
          <span>${DEPT_NAVN[r.dept]} · ${esc((agents.find(a => a.id === r.agent) || {}).name || r.agent)}</span>
          ${r.needsOk === false ? '<span class="chip gron">læser og rapporterer</span>' : '<span class="chip">afventer godkendelse</span>'}
        </span>
      </div>`).join('')}
    </div>
  </section>

  <section>
    <div class="sek-hoved">
      <h2>Færdighederne</h2>
      <p>Sådan gør vi tingene. En færdighed slår igennem på næste opgave — ingen genstart.</p>
    </div>
    <div class="faerd">
      ${SKILLS.map(s => `
      <article>
        <h3>${esc(s.navn)}</h3>
        <span class="hvem">${esc(s.hvem)} — ${esc(s.hvad)}</span>
        <ul>${s.regler.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </article>`).join('')}
    </div>
  </section>

  <section>
    <div class="sek-hoved">
      <h2>Sådan går en opgave gennem huset</h2>
    </div>
    <ol class="trin">
      ${TRIN.map(t => `<li><h3>${esc(t.t)}</h3><p>${esc(t.b)}</p></li>`).join('')}
    </ol>
  </section>

  <section>
    <div class="sek-hoved">
      <h2>Før det bliver rigtigt</h2>
      <p>Brain'et er en skabelon. 37 steder er markeret UDFYLD — det er dem, kun I ved.</p>
    </div>
    <ul class="liste">
      <li><code>10-Forretning</code> Produktprogram og agenturaftaler: hvilke produkter, hvilke selskaber, hvilke døgnvagtnumre.</li>
      <li><code>80-Oekonomi</code> Provisionssatserne fra agenturaftalen.</li>
      <li><code>90-Drift</code> Compliance-noten — et udkast, der skal forbi jeres compliance-ansvarlige.</li>
      <li><code>00-Meta</code> Tal og kilder: det eneste sted agenterne må hente tal.</li>
      <li><code>agents.json</code> Feltet <code>tools</code> er gæt. Kør <code>claude mcp list</code> og skriv jeres egne connectors ind.</li>
    </ul>
    <div class="note">
      <b>Licensen først</b>
      Motoren, agents-office, er udgivet under PolyForm Noncommercial 1.0.0: kun ikke-kommercielle formål. At køre agenturets daglige drift på den er kommerciel brug og er efter licensens ordlyd ikke dækket. Skal det i drift, skal I have en skriftlig tilladelse fra ophavsmanden først.
    </div>
  </section>

  <footer>
    <p>Denne side er en statisk demo, bygget ud af opsætningens egne filer. Det rigtige kontor kører på jeres egen maskine på jeres eget Claude-login — <span class="ui">./setup.sh</span> og så <span class="ui">./start.sh</span>.</p>
    <p>Motor: <a href="https://github.com/ajsahni/agents-office">agents-office</a> (PolyForm Noncommercial 1.0.0, <a href="https://polyformproject.org/licenses/noncommercial/1.0.0">licensteksten</a>). Opsætningen er vores.</p>
  </footer>
</div>

<div id="lys" hidden>
  <div class="top"><span id="lys-navn"></span><button type="button" id="lys-luk">Luk</button></div>
  <div class="rul"><img id="lys-img" alt=""></div>
</div>

<script>
  (function () {
    var lys = document.getElementById('lys'), img = document.getElementById('lys-img'),
        navn = document.getElementById('lys-navn'), luk = document.getElementById('lys-luk'), sidst = null;
    var tekst = { kontor: 'Kontoret', tavle: 'Dagens tavle', brain: "Hjernen" };
    document.querySelectorAll('.ramme').forEach(function (b) {
      b.addEventListener('click', function () {
        sidst = b;
        img.src = b.querySelector('img').src;
        img.alt = b.querySelector('img').alt;
        navn.textContent = tekst[b.dataset.billede] + ' — træk for at se hele billedet';
        lys.hidden = false;
        document.body.style.overflow = 'hidden';
        luk.focus();
      });
    });
    function skjul() { lys.hidden = true; document.body.style.overflow = ''; if (sidst) sidst.focus(); }
    luk.addEventListener('click', skjul);
    lys.addEventListener('click', function (e) { if (e.target === lys || e.target.classList.contains('rul')) skjul(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lys.hidden) skjul(); });
  })();
</script>
`;

const out = path.join(PACK, 'demo', 'demo.html');
fs.writeFileSync(out, html);
console.log(`skrev ${path.relative(PACK, out)} (${(html.length / 1024).toFixed(0)} KB) · ${agents.length} pladser · ${routines.length} rutiner · ${notes} noter`);
