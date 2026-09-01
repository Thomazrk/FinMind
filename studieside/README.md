# Studiets forside

Astro-projekt, bygget til Cloudflare Pages — samme stak som kundesiderne.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # statisk build i dist/
npm run check    # typetjek af .astro-filerne
```

## Ret det her, før den går live

**Alt der identificerer dig står i `src/data/studio.ts`.** Det var hele pointen
med at flytte den fra én HTML-fil: navn, mail, telefon og CVR lå spredt over
seks steder. Nu er der ét.

| Hvad | Nu | Hvor |
| --- | --- | --- |
| Navn | Studiet | `src/data/studio.ts` |
| Domæne | https://studiet.dk | `src/data/studio.ts` — bruges til kanoniske adresser og sitemap |
| E-mail, telefon, CVR, by | pladsholdere | `src/data/studio.ts` |
| Priser | 1.200 / 2.400 / 3.600 kr. og fra 18.000 kr. | `src/data/plans.ts` |
| Hvad der ikke er dækket | syv punkter | `src/data/plans.ts` |
| Demoens beskeder | tre opdigtede kunder | `src/data/demo.ts` |

**Priserne er de vigtigste.** De stammer fra kontrolpanelets testdata og er ikke
et forslag til, hvad du skal tage. Kunderne i demoen — Bageriet på Torvet,
Vestergaard VVS, Nordhavn Tandklinik — er opdigtede. Byt dem ud med rigtige, når
du har fået lov til at nævne dem.

## Deploy på Cloudflare Pages

| Indstilling | Værdi |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | `studieside` |

`public/_headers` sætter sikkerhedsheadere og cache på de byggede filer;
Cloudflare Pages læser den automatisk. Husk at rette `url` i
`src/data/studio.ts`, når domænet er sat op — ellers peger de kanoniske adresser
og sitemappet på pladsholderen.

## Sådan hænger den sammen

```
src/
  data/         alt indhold der skal rettes uden at røre markup
    studio.ts     navn, kontakt, domæne
    plans.ts      pakker, priser, hvad der ikke er dækket
    demo.ts       forsidens tre beskeder
    steps.ts      de fire trin i "Sådan virker det"
  layouts/
    Base.astro    html-skal, meta, skrifter, kanonisk adresse
  components/     ét afsnit pr. fil
  styles/
    global.css    hele designet, ét sted
  pages/
    index.astro   rækkefølgen af afsnit
```

Kun ét afsnit har JavaScript: `LoopDemo.astro`. Scriptet importerer det samme
`demo.ts`, som markuppen bliver bygget af, så der er én kilde til de tre
beskeder. Første trin står tændt allerede i HTML'en, så demoen ikke er tom, hvis
scriptet er langsomt eller slået fra.

## Hvorfor siden ser sådan ud

Argumentet er sløjfen, ikke ordene om sløjfen. Derfor er heroen en levende demo
af præcis det, kunden køber: en besked lander, den bliver vurderet, rettelsen
bygges, **et menneske godkender**, og den går live. Det er de samme trin som i
kontrolpanelet i `../kontrolpanel`.

Den tredje demo-besked ender med et tilbud i stedet for en rettelse. Det er med
vilje: en side, der kun viser lykkelige udfald, lyver om, hvordan det er at være
kunde. Af samme grund har siden et afsnit om, hvad abonnementet **ikke** dækker.

Afsnittet om AI er det, der adskiller dig fra dem, der bare siger "vi bruger AI":
maskinen skriver koden, et menneske godkender hver ændring, og der er ingen
indstilling, der slår det fra.

## Design

- Dansk hele vejen. Ingen versaler som etiketter, ingen gradienter, ingen
  tre-kolonne feature-grid, ingen priskort med "mest populær".
- Pakkerne står som en prisliste med rå tal i monospace, ikke som salgskort.
- Skrifter: Familjen Grotesk til overskrifter, Source Serif 4 til brødtekst,
  JetBrains Mono til tal — alle fra Google Fonts med rigtige reservestakke.
- Lys og mørk tilstand, med tokens sat så et bevidst temavalg vinder over
  styresystemets.
- `prefers-reduced-motion` slår demoens optrapning fra uden at fjerne indholdet.

## Når den skal vokse

Cases og blog er en indholdssamling i Astro: læg `src/content.config.ts` og
`src/content/cases/*.md` ind, og lav `src/pages/cases/[...slug].astro`. Data
ligger allerede adskilt fra markup, så det bliver en tilføjelse — ikke en
ombygning.
