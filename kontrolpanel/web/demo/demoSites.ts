/**
 * Small stand-in customer sites for the demo, so the Sider screen shows real
 * rendered pages instead of the blocked-frame fallback. Each one is served to
 * the iframe as a blob URL; the cards still show and link the real domain.
 *
 * The bakery page deliberately says "Lørdag 07.00–14.00" — that is the line the
 * pending proposal on the approval screen changes to 16.00.
 */

const shared = `
  :root { color-scheme: light }
  * { box-sizing: border-box }
  body { margin: 0; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; color: #222; background: #fff }
  header { padding: 1.1rem 1.4rem; border-bottom: 1px solid #e6e2da; display: flex;
           align-items: baseline; justify-content: space-between; gap: 1rem }
  header b { font-size: 1.05rem; letter-spacing: 0.01em }
  nav { font-size: 0.82rem; color: #6b665d; display: flex; gap: 0.9rem }
  main { padding: 1.4rem }
  h1 { font-size: 1.5rem; margin: 0 0 0.5rem; line-height: 1.2 }
  p { margin: 0 0 0.9rem; max-width: 34rem }
  .hero { height: 7rem; border-radius: 3px; margin-bottom: 1.1rem }
  ul { list-style: none; margin: 0; padding: 0; max-width: 20rem; font-size: 0.9rem }
  li { display: flex; justify-content: space-between; padding: 0.28rem 0; border-bottom: 1px dotted #e6e2da }
  footer { padding: 0.9rem 1.4rem; border-top: 1px solid #e6e2da; font-size: 0.8rem; color: #6b665d }
`;

function page(body: string, accent: string) {
  return `<!doctype html><html lang="da"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${shared} .hero { background: ${accent} } a { color: inherit }</style>
</head><body>${body}</body></html>`;
}

export const demoSitePages: Record<string, string> = {
  "bageriet-forside": page(
    `<header><b>Bageriet på Torvet</b><nav><span>Brød</span><span>Kager</span><span>Kontakt</span></nav></header>
     <main>
       <div class="hero"></div>
       <h1>Surdej hver morgen kl. 6</h1>
       <p>Vi bager alt på stedet på Torvegade 14. Rugbrødet står klar når vi åbner,
          og kagerne kommer ud af ovnen ved tretiden.</p>
       <h2 style="font-size:0.95rem;margin:0 0 0.4rem">Åbningstider</h2>
       <ul>
         <li><span>Mandag–fredag</span><span>06.00–17.30</span></li>
         <li><span>Lørdag</span><span>07.00–14.00</span></li>
         <li><span>Søndag</span><span>Lukket</span></li>
       </ul>
     </main>
     <footer>Torvegade 14 · 8000 Aarhus C · 86 12 44 90</footer>`,
    "#e8dcc6",
  ),

  "tandklinik-forside": page(
    `<header><b>Nordhavn Tandklinik</b><nav><span>Behandlinger</span><span>Priser</span><span>Book tid</span></nav></header>
     <main>
       <div class="hero"></div>
       <h1>Tandlæge i Nordhavn siden 2011</h1>
       <p>Vi tager os af hele familien — fra det første eftersyn til implantater.
          Akutte tider samme dag, hvis du ringer inden kl. 10.</p>
       <ul>
         <li><span>Undersøgelse</span><span>fra 395 kr.</span></li>
         <li><span>Tandrensning</span><span>fra 450 kr.</span></li>
         <li><span>Akut tid</span><span>ring 35 55 12 08</span></li>
       </ul>
     </main>
     <footer>Sundkaj 9 · 2150 Nordhavn · Man–tor 8–17, fre 8–14</footer>`,
    "#cfdde4",
  ),

  "vvs-forside": page(
    `<header><b>Vestergaard VVS</b><nav><span>Opgaver</span><span>Vagt</span><span>Kontakt</span></nav></header>
     <main>
       <div class="hero"></div>
       <h1>VVS i Vestjylland — også når det haster</h1>
       <p>Autoriseret VVS-installatør med døgnvagt. Vi laver alt fra dryppende
          haner til komplette badeværelser og varmepumper.</p>
       <ul>
         <li><span>Vagttelefon</span><span>40 11 77 22</span></li>
         <li><span>Kontor</span><span>97 22 18 40</span></li>
         <li><span>Udkald aften/nat</span><span>tillæg 650 kr.</span></li>
       </ul>
     </main>
     <footer>Industrivej 3 · 7500 Holstebro · CVR 28 41 90 22</footer>`,
    "#dbe0d4",
  ),
};

/** Blob URLs survive for the life of the tab, which is all the demo needs. */
export function demoPreviewUrl(siteId: string): string | null {
  const html = demoSitePages[siteId];
  if (!html) return null;
  return URL.createObjectURL(new Blob([html], { type: "text/html" }));
}
