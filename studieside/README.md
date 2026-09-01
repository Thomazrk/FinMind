# Studiets forside

Én statisk HTML-fil. Åbn `index.html`, eller læg mappen på Cloudflare Pages.

## Ret det her, før den går live

Alt herunder er pladsholdere. Listen står også som kommentar øverst i
`index.html`.

| Hvad | Nu | Står |
| --- | --- | --- |
| Navn | Studiet | 6 steder — søg og erstat |
| E-mail | hej@studiet.dk | kontaktafsnit + `mailto:` |
| Telefon | 20 00 00 00 | kontaktafsnit + `tel:` |
| CVR | 00 00 00 00 | sidefod |
| By | Aarhus | sidefod |
| Priser | 1.200 / 2.400 / 3.600 kr. og fra 18.000 kr. | pakkeafsnittet |

**Priserne er de vigtigste.** De er hentet fra kontrolpanelets testdata og er
ikke et forslag til, hvad du skal tage. Kunderne i demoen — Bageriet på Torvet,
Vestergaard VVS, Nordhavn Tandklinik — er opdigtede. Byt dem ud med rigtige, når
du har fået lov til at nævne dem.

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
  JetBrains Mono til tal. Alle fra Google Fonts med rigtige reservestakke.
- Lys og mørk tilstand, og tokens er sat så et bevidst temavalg vinder over
  styresystemets.
- `prefers-reduced-motion` slår demoens optrapning fra uden at fjerne indholdet.

## Når den skal i luften

Den er skrevet som én fil, så den er nem at læse og rette. Skal den vokse —
cases, blog, flere sider — så flyt den til et Astro-projekt som kundesiderne,
og læg den på Cloudflare Pages. Så er din egen side bygget på samme stak, som du
sælger.
