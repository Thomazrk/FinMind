# Kontrolpanel

Internt kontrolpanel til et solo-webstudie. Ét sted hvor jeg ser alle kundesider,
læser hvad kunderne skriver, ser de ændringer AI'en foreslår, og godkender eller
afviser dem.

## Den ufravigelige regel

**Ingen ændring når en kundeside uden min manuelle godkendelse.**

Automatikken må læse, analysere, skrive kode og bygge et preview. Den må aldrig
merge, deploye eller svare kunden på egen hånd.

Sådan er reglen håndhævet i det der ligger her:

| Hvor | Hvad |
| --- | --- |
| `firestore.rules` | En opgave kan kun flyttes fra `afventer` til `godkendt`/`afvist`, og kun af min bruger. `diff`, `branch`, `prUrl`, `kundeId` og `beskedTekst` kan ikke ændres i samme skrivning. `afgjortAf` skal være min egen e-mail fra tokenet, og `afgjortTidspunkt` skal være servertid. |
| `firestore.rules` | Panelet har ingen skriveadgang til `kunder`, `sider` eller `forbrug`. Aktivitetsloggen kan kun få nye poster — aldrig rettelser eller sletninger. |
| `web/src/data/firestore.ts` | `decideTask()` er den eneste vej ud af `afventer`. Den merger ikke, deployer ikke og skriver ikke til Slack. Den nægter også at afgøre en opgave der allerede er afgjort. |
| `web/src/pages/Pending.tsx` | Godkend og Afvis er to adskilte knapper. En afvisning kan ikke sendes uden en årsag. |

Merge, deploy og Slack-kvittering hører til baggrundsjobs der reagerer på
`status === "godkendt"`. De findes ikke endnu — se byggerækkefølgen nedenfor.

## Nødstoppet — kontrakten arbejderne skal følge

`system/automatik` er bremsen. Panelet skriver den; **arbejderne skal læse den**,
og det er dér den bliver håndhævet. Firestore-regler kan ikke gøre det: en Cloud
Function kører på Admin SDK'et, som går uden om reglerne.

Hver baggrundsarbejder — klassificering, ændringsbygger, deploy, Slack-svar —
skal hente `system/automatik`, **før** den går i gang, og stoppe hvis:

| Felt | Betyder |
| --- | --- |
| `pauseret: true` | Alt står stille, for alle kunder. Gør ingenting. |
| `pausedeKunder` indeholder kundens id | Spring den kunde over. Resten kører videre. |
| `månedsbudgetKroner` er nået | Månedens forbrug i `forbrug/{måned}.totalKroner` har ramt loftet. Stop, og skriv en post i `aktivitet`. |

Et stop rører ikke ved forslag der allerede ligger og venter — dem kan du stadig
godkende. Det er kun det automatiske arbejde der holder op.

Det er den ene ting, der ikke kan bygges bagefter: når trin 4 først kører Claude
Code mod kundernes repos uden opsyn, skal bremsen være der i forvejen.

## Hvor langt er vi

Byggerækkefølgen fra projektbeskrivelsen:

- [x] **1. Skelettet** — Firestore-model, auth, og panelet der viser opgaver fra
      håndindtastede dokumenter. Ingen Slack, ingen AI.
- [x] **Forsiden "I dag"** — hvad venter, hvad er i stykker, hvad fornyer, hvem
      er over sine supportminutter, er budgetloftet nået.
- [x] **Kunden som rygrad** — kundeliste og kundeside med aftale, supportforbrug,
      dækning, sider og hele opgavehistorikken.
- [x] **Nødstop og budgetloft** — kontrolfladen står; håndhævelsen ligger hos
      arbejderne, se kontrakten ovenfor.
- [ ] 2. Slack ind — event-modtager, kanal-til-kunde-kobling.
- [ ] 3. Klassificering — Claude API udfylder `klassifikation`, logger tokens.
- [ ] 4. Kodeændringer — Claude Code mod kundens repo, branch, PR, preview-URL.
- [ ] 5. Preview og forbrug — iframe-preview er med allerede; forbrugssiden læser
      det backend'en skriver.
- [ ] 6. Svar tilbage til Slack.

Trin 1 er hele indholdet af denne mappe. Skærmbillederne til trin 4-5 (diff,
preview-URL, tokens og kroner) er bygget nu, så de er klar når data begynder at
komme fra automatikken i stedet for fra `seed/data.json`.

## Mapper

```
kontrolpanel/
  firebase.json            hosting, firestore, emulator-porte
  firestore.rules          adgang for én bruger + godkendelsesreglen
  firestore.indexes.json   indekser til opgave- og aktivitetslister
  .firebaserc.example      kopiér til .firebaserc med dit projekt-id
  seed/                    håndindtastede dokumenter til trin 1
  web/                     React-panelet
```

## Kom i gang

### 1. Firebase-projekt

```sh
cp .firebaserc.example .firebaserc     # skriv dit projekt-id ind
```

Opret én bruger i Firebase Auth (Authentication → Users → Add user). Kopiér
brugerens UID ind i `firestore.rules` i stedet for `ERSTAT_MED_DIT_UID`.

### 2. Panelet

```sh
cd web
cp .env.example .env.local             # udfyld fra Firebase-konsollen
npm install
npm run dev                            # http://localhost:5180
```

`VITE_TILLADT_EMAIL` gør at panelet afviser andre adresser allerede i
login-formularen. Den rigtige spærring er `firestore.rules` — feltet i `.env` er
kun for at få en forståelig fejl i stedet for et tomt panel.

### 3. Se panelet uden Firebase

Vil du bare se skærmbillederne, kører demoen panelet med testdataene fra
`seed/data.json` og hverken Firebase eller login:

```sh
cd web && npm run demo          # dev-server med demodata
cd web && npm run build:demo    # statisk build i web/demo-dist
```

Godkend og afvis virker i demoen, men skriver kun til hukommelsen i fanen.
Forhåndsvisningerne viser små stand-in-kundesider fra `demo/demoSites.ts`,
fordi demokundernes domæner ikke findes.

### 4. Data at kigge på

Mod emulatoren:

```sh
firebase emulators:start --only firestore,auth      # i kontrolpanel/
cd seed && npm install
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 GOOGLE_CLOUD_PROJECT=demo-kontrolpanel npm run seed
```

Mod det rigtige projekt:

```sh
cd seed
GOOGLE_APPLICATION_CREDENTIALS=/sti/til/serviceaccount.json \
GOOGLE_CLOUD_PROJECT=<projekt-id> npm run seed
```

Seedet skriver kun de dokument-id'er der står i `data.json`, og sletter intet.
Servicekontonøglen hører hjemme uden for repoet — `.gitignore` her fanger
`serviceaccount.json`, men læg den helst et helt andet sted.

## Deploy

```sh
cd web && npm run build
cd .. && firebase deploy --only hosting,firestore:rules,firestore:indexes
```

## Kommandoer

| Kommando | Hvor | Hvad |
| --- | --- | --- |
| `npm run dev` | `web/` | Dev-server på port 5180 |
| `npm run demo` | `web/` | Panelet med testdata, uden Firebase |
| `npm run build:demo` | `web/` | Statisk demo-build i `web/demo-dist` |
| `npm run build` | `web/` | Typecheck + produktionsbuild til `web/dist` |
| `npm run lint` | `web/` | ESLint |
| `npm test` | `web/` | Vitest |
| `npm run seed` | `seed/` | Skriver håndindtastede dokumenter til Firestore |

## Dansk og engelsk i koden

Alt der vises på skærmen er dansk. Alle navne i koden er engelske — funktioner,
komponenter, filnavne, CSS-klasser.

Tre steder er dansk med vilje, fordi de er data og ikke kode:

- **Feltnavnene i Firestore** (`beskedTekst`, `afgjortAf`, `dækketAfAbonnement` …)
  er lagringskontrakten fra projektbeskrivelsen.
- **Statusværdier** (`afventer`, `godkendt`, `tilbudSendt` …) er gemte strenge.
  `web/src/lib/labels.ts` oversætter dem til det der står på skærmen.
- **Ruterne** (`/sider`, `/afventer`, `/forbrug`, `/aktivitet`) står i adresse-
  linjen, hvor jeg kan se dem.

Én ting at vide om reglerne: Firestore-reglernes sprog accepterer kun ASCII i
identifikatorer. Et feltnavn med æ, ø eller å skal skrives i firkantede
parenteser — `request.resource.data['udførtAf']` — og et wildcard i en
match-sti kan slet ikke indeholde dem.

## Datamodel

Samlingerne følger projektbeskrivelsen. `web/src/types.ts` er den autoritative
beskrivelse af formerne.

```
kunder/{id}     navn, slackKanalId, repo, domæne, pakke, månedspris,
                fornyelsesdato, supportMinutterDenneMåned

sider/{id}      kundeId, repo, produktionsUrl, sidsteDeploy, status,
                forhåndsvisningsUrl (valgfri)

opgaver/{id}    kundeId, sideId, slackBeskedId, slackPermalink, beskedTekst,
                afsender, modtagetTidspunkt, resumé,
                klassifikation { type, estimatMinutter, dækketAfAbonnement },
                status, branch, prUrl, previewUrl, diff[],
                forbrug { inputTokens, outputTokens, kroner },
                afgjortAf, afgjortTidspunkt, afvisningsårsag

forbrug/{måned} totalTokens, totalKroner, perKunde { kundeId: kroner }

aktivitet/{id}  tidspunkt, handling, opgaveId, kundeId, udførtAf, detalje

system/automatik      pauseret, pausetAf, pausetTidspunkt, årsag,
                      pausedeKunder[], månedsbudgetKroner
system/indstillinger  timepris
```

Tilføjelser til modellen fra beskrivelsen:

- **`aktivitet`** — aktivitetsskærmen skal have et sted at læse fra. Poster
  skrives af panelet ved hver afgørelse og af baggrundsjobs ved automatiske
  kørsler.
- **`opgaver.resumé`** — den ene sætning om hvad ændringen gør. Beskrivelsen
  beder om den på skærmen, så den skal stå i dokumentet.
- **`system/automatik`** — nødstoppet og budgetloftet, se kontrakten ovenfor.
- **`system/indstillinger.timepris`** — uden en timepris kan panelet ikke regne
  ud, hvad en kunde er værd, når din egen tid er trukket fra. Er den ikke sat,
  siger kundesiden det i stedet for at gætte.
- **`kunder.supportMinutterPrMåned`** — brugte minutter uden et loft at måle mod
  er bare et tal.

`diff` er en liste af `{ filnavn, før, efter }`. Ændringsbyggeren gemmer begge
versioner ordret, så panelet ikke skal fortolke unified diff for at vise før og
efter.

## Timestamps

Firestore gemmer `Timestamp`, panelet arbejder med ISO-strenge. Konverteringen
sker ét sted: `toIso()` i `web/src/data/firestore.ts`. Skrivninger bruger altid
`serverTimestamp()` — reglerne kræver det, så min egen klok ikke kan sætte
tidspunktet for en godkendelse.

## Design

Panelet skal ligne et værktøj. Konkret:

- Dansk på skærmen, engelsk i koden.
- Rådata står der hvor det kan: filnavne, dokument-id'er, tokental, præcise
  tidsstempler ved siden af "for 3 timer siden".
- Fejl siger hvad der gik galt **og** hvad jeg gør ved det. Oversættelserne af
  Firebase-koder ligger i `web/src/lib/errors.ts`; en ny kode uden oversættelse
  falder tilbage på den rå besked frem for "noget gik galt".
- Ingen komponentbibliotek, ingen gradienter, ingen versal-etiketter. Al CSS
  ligger i `web/src/styles.css` og bruger papir/blæk-farver med lys og mørk
  tilstand.
- Mobil først. Diff'en bliver til én spalte under 52 rem, tabeller kan scrolle
  vandret, og godkend/afvis-knapperne er nået med en tommel.

## Sikkerhed

- Kun ét UID har adgang, håndhævet i `firestore.rules`.
- Panelet har ingen skriveadgang til kunde-, side- eller forbrugsdata.
- Firebase Hosting sender `X-Frame-Options: DENY` — panelet må ikke selv
  indlejres, selvom det indlejrer kundesider.
- Kundesiderne vises i en `sandbox`'et iframe med `referrerPolicy="no-referrer"`
  og `pointer-events: none` — rammen er en miniature at kigge på, ikke et vindue
  at bruge siden igennem. Den tegner i 1280 px bredde og skaleres ned, så kortet
  viser hele toppen af siden.
- Nogle sider sender `X-Frame-Options` og bliver blanke i rammen; derfor står
  URL, repo og sidste deploy altid som læsbar tekst ved siden af, med et link ud.
  Har en side en `forhåndsvisningsUrl` på dokumentet, loader rammen den i stedet
  — fx en staging-kopi — mens kortet stadig viser og linker produktions-URL'en.
- `.env.local` og servicekontonøgler er i `.gitignore`. Serverhemmeligheder
  (Slack signing secret, Claude API-nøgle) hører til i Secret Manager, ikke her.
- Ingen kundedata i logs.
