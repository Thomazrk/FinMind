# Klar Forsikring — Agents Office

Et 3D-kontor, hvor AI-agenter laver rigtigt arbejde på jeres eget Claude-login. Motoren er
[agents-office](https://github.com/ajsahni/agents-office). **Denne mappe er ikke motoren** —
den er Klar Forsikrings udgave af den: de 35 pladser skrevet om til et dansk forsikringsagentur,
et brain med jeres noter, fem færdigheder og syv faste rutiner.

Motoren hentes af opsætningen og bliver liggende i sin egen mappe. Alt, der er jeres, ligger her
og er versionsstyret. En `git pull` i motoren rører aldrig noget af det.

## Kom i gang

Kommandoerne skal skrives i en **terminal** — filerne her skal ikke dobbeltklikkes.
På Mac: ⌘+mellemrum, skriv `Terminal`, tryk retur. På Windows: Start → `PowerShell`.

Én kommando klarer det hele, og den kan køres fra hvor som helst — den regner selv ud, hvor
den ligger, så I behøver ikke skifte mappe først:

```powershell
node C:\Users\Bruger\FinMind\klar-forsikring-office\koer.mjs
```

```bash
node ~/FinMind/klar-forsikring-office/koer.mjs
```

Den henter det nyeste, tjekker maskinen, sætter op og starter kontoret på
http://localhost:4520. Stop det med Ctrl+C.

| Tilføjelse | Gør |
|---|---|
| `--uden-opdatering` | Springer `git pull` over |
| `--kun-tjek` | Tjekker og sætter op, men starter ikke |
| `--connectors` | Installerer Outlook- og portal-connectorne |

Skridtene findes også hver for sig som `setup.mjs`, `start.mjs` og `tjek.mjs` i samme mappe.
De kan alle køres med fuld sti uden at skifte mappe. Det virker ens på Mac, Windows og Linux —
der er ingen bash involveret. `setup.sh` og `start.sh` findes stadig for dem, der er vant til dem.

Vil I have motoren et andet sted: `node setup.mjs /sti/til/agents-office`.

**Krav:** Node 20+, git, og **Claude Code logget ind** med jeres Claude-konto (eller en
`ANTHROPIC_API_KEY`). Uden Claude Code kører kontoret, men agenterne kan ikke arbejde.

Går noget galt, så kør:

```bash
node tjek.mjs
```

Den ændrer ingenting. Den kigger maskinen, opsætningen, configfilen, porten og netforbindelsen
igennem, siger hvad der skal rettes, og skriver til sidst en rapport, I kan kopiere og sende.

## Login eller API-nøgle

Kontoret kan køre på to måder, og de er ikke lige gode:

**Claude Code-login (anbefales).** Kør `claude` i en terminal og log ind med jeres Claude-konto.
Agenterne får connectors og websøgning, og det kører på det abonnement, I allerede betaler.

**ANTHROPIC_API_KEY.** Motoren tager nøglen fra en miljøvariabel — der er ingen fil og intet
felt i kontoret til den. Sæt den i den **samme terminal**, som starter kontoret:

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."      # Windows, kun dette vindue
setx ANTHROPIC_API_KEY "sk-ant-..."        # Windows, permanent — åbn en NY terminal bagefter
```

```bash
export ANTHROPIC_API_KEY="sk-ant-..."      # Mac og Linux, kun dette vindue
```

**Hvad nøglen koster jer:** motoren kalder API'et uden værktøjer
(`sdk.messages.create` med `system` og `messages`, intet `tools`-felt). Agenterne kan altså
skrive ud fra brain'et — men de kan **ikke** bruge Gmail, Drive, Notion eller websøgning.
Halvdelen af pointen med kontoret forsvinder. Og forbruget afregnes pr. token i stedet for at
ligge på abonnementet.

Er nøglen sat, vinder den over loginnet. `node tjek.mjs` siger, hvilken tilstand I kører i.

**Skriv aldrig nøglen ind i en fil i denne mappe.** Den ville blive committet og skubbet til
GitHub ved næste `git push`. Sker det alligevel: spær nøglen i Anthropic-konsollen med det samme
og lav en ny.

## CRM'et ind i brain'et

Portalen er kundevendt — agenterne kan ikke logge ind i den, og de får hverken browser eller
filadgang. Koblingen til jeres eget går gennem **et udtræk fra CRM'et**:

```bash
node vaerktoj/importer-crm.mjs udtraek.csv --se     # vis hvad der ville ske
node vaerktoj/importer-crm.mjs udtraek.csv          # skriv det ind i brain'et
```

Importen skriver tre noter, agenterne læser ved næste opgave — ingen genstart:

| Note | Indhold |
|---|---|
| `30-Kunder/bestand.md` | Kunder, policer, fordeling på produkt og selskab |
| `30-Kunder/fornyelser.md` | Hovedforfald inden for 60 dage (`--dage` ændrer det) |
| `00-Meta/bestandstal.md` | Tallene med kilde og dato, så agenterne må bruge dem |

**Navne og CVR kommer aldrig i brain'et.** Kunder får et kundenummer, og opslaget
kundenummer → navn lægges i `privat/kundeopslag.csv`, som ligger uden for brain'et og er
gitignoreret. Kundenumre er stabile mellem kørsler. En kolonne, der hedder noget med CPR,
personnummer, helbred eller kontonummer, bliver droppet uden at blive læst. Før noget skrives,
scanner importeren de færdige noter for navne og CVR fra udtrækket og for CPR-mønstre — findes
der ét, stopper den og skriver ingenting.

De tre noter er gitignorerede: rigtige kundedata hører ikke i git.

Hedder jeres kolonner noget andet, står listen i `vaerktoj/kolonner.json`. Importeren
genkender `;`, `,` og tab, Excels BOM, og datoer skrevet både `14-09-2026` og `2026-09-14`.

To rutiner arbejder på de noter: `fornyelser-45` læser fornyelseslisten, `provisionskontrol`
holder provisionsopgørelserne op mod bestanden. Er udtrækket ikke kørt, siger de det og stopper
i stedet for at gætte.

## Demo

En telefonvenlig demo af opsætningen — de 35 skriveborde, timeplanen, færdighederne og
skærmbilleder fra kontoret, mens det kørte:

```bash
node demo/build-demo.mjs      # bygger demo/demo.html af brain'ets egne filer
```

Filen er én selvstændig HTML uden eksterne kald (skærmbillederne ligger i
`demo/billeder/` og bakes ind), så den kan sendes videre eller lægges op som den er.
Den er ikke versionsstyret — byg den, når I har brug for den.

## Kommandoer

```bash
node start.mjs              # kontoret på http://localhost:4520
node validate.mjs           # vores roster, færdigheder, rutiner og config — ingen Claude-kald
```

Og i motorens mappe (`cat .office-path` viser hvor den ligger):

```bash
npm start                   # det samme som node start.mjs
npm run check               # motorens egen testpakke: build + smoke tests, ingen Claude-kald
npm run check:live          # plus én rigtig opgave og én chat gennem Claude
```

`http://localhost:4520/dark` er det samme kontor i mørkt lys. `FULL_CHECK=1 node setup.mjs` kører
`npm run check` med som en del af opsætningen.

`npm run check` fejler på `smoke: browser`, hvis Chrome ikke er installeret (`npx playwright
install chrome`). Den test har intet med vores opsætning at gøre — se efter andre linjer med ✗.
`npm run check:live` bruger af jeres Claude-forbrug.

## Konfigurationen

Opsætningen skriver den, og den ligger i motorens mappe, ikke her:

```json
{
  "name": "klarforsikring",
  "brain": "/sti/til/klar-forsikring-office/brain",
  "port": 4520,
  "model": ""
}
```

- **name** — står i titlen og i hver agents brief.
- **brain** — **skal være den fulde sti til `brain/` her i mappen.** Skriver I `"./brain"`,
  peger den på agents-office' egne eksempelnoter om et fiktivt designstudie, og så er hverken
  vores roster, færdigheder eller rutiner med. Kontoret siger det ikke — det starter bare.
- **port** — hvor kontoret lytter.
- **model** — `""` betyder kontorets standard (Sonnet). Ellers `sonnet`, `opus` eller `fable`.
  En opgave, en rutine eller en agent kan sætte sin egen ovenpå.

> **Pas på krøllede anførselstegn.** Skriver I configfilen i et tekstbehandlingsprogram, laver
> det `"` om til `“ ”`. Så er filen ikke gyldig JSON, og motoren **ignorerer den i tavshed** og
> starter som "Northgate Studio" på eksempelnoterne. `node validate.mjs` fanger begge dele og
> siger hvad der er galt.

## Hvad der er sat op

**De 35 pladser** (`brain/Agents Office/agents.json`) — seks afdelinger, som motoren har dem,
skrevet om til et agentur:

| Afdeling | Hos os | Pladser |
|---|---|---|
| Emails | Kundepost — kunder, selskaber, partnere, intern post | 5 |
| Sales | Salg og rådgivning — behovsafdækning, tilbud, fornyelser | 6 |
| Marketing | Marketing — indhold, annoncer, markedsovervågning | 7 |
| Operations | Drift — compliance, aftaler, rapportering, dashboards | 6 |
| Accounting | Økonomi — provision, udgifter, afstemning | 4 |
| Delivery | Skade og kundeservice — sager, police, dokumenter, klager | 7 |

Afdelinger, ledere og antal pladser er faste i motoren. En ny slags agent er en plads, der får
et nyt navn — ikke en plads mere.

**Brain'et** (`brain/`) — de noter, agenterne læser før hver opgave: forretningsmodel,
produktprogram, samarbejdspartnere, kundesegmenter, mailregler, behovsafdækning, skadeproces,
policeservice, kvalitetstjek, provision, afstemning, compliance, klagebehandling og tone of voice.

**Fem færdigheder** (`brain/Agents Office/skills/`) — sådan gør vi tingene:

| Færdighed | Hvem | Hvad |
|---|---|---|
| `house-style` | alle | Sådan skriver vi. Ingen dækningsvurdering, ingen personoplysninger, tal med kilde. |
| `client-reply` | Kundepost | Svar til en kunde: form, svartider, hvad der skal godkendes først. |
| `proposal` | TILBUD | Tilbud med dækningsoversigt. Skabelonen ligger ved siden af. |
| `skadesag` | SAGSKOORDINATOR, SERVICECHEF | Tag imod en skade, anmeld, følg sagen. |
| `klagesvar` | SERVICECHEF, DRIFTSCHEF | Klager: kvittér, til ledelsen, aldrig svar på egen hånd. |

De tre første hedder som motorens medfølgende engelske eksempler med vilje: en færdighed med
samme navn i brain'et **erstatter** eksemplet. Derfor er der ingen engelske
studie-instruktioner tilbage i agenternes hoveder.

**Syv rutiner** (`brain/Agents Office/routines.json`) — det kontoret gør af sig selv. Motoren
understøtter i denne udgivelse kun rutiner for Kundepost, Salg og Økonomi.

| Rutine | Hvornår | Sender selv? |
|---|---|---|
| Morgentriage af kundepost | hverdage 08:00 | nej, kun en liste |
| Rykkere til selskaberne på åbne sager | hverdage 09:30 | afventer godkendelse |
| Tilbud der ikke er besvaret | hverdage 10:00 | afventer godkendelse |
| Post der ikke er besvaret i dag | hverdage 15:30 | nej, kun en liste |
| Fornyelser 45 dage før hovedforfald | mandag 09:00 | nej |
| Kontrollér provisionsopgørelserne | mandag 09:30 | nej |
| Månedsafstemning | mandag 10:30 | nej |

## Det I skal rette, før det bliver rigtigt

Brain'et er en skabelon. Søg efter **UDFYLD** — hvert sted er noget, kun I ved:

```bash
grep -rn UDFYLD brain/
```

Vigtigst:
1. `10-Forretning/produktprogram.md` — hvilke produkter, hvilke selskaber.
2. `10-Forretning/samarbejdspartnere.md` — agenturaftaler, kontakter, døgnvagtnumre.
3. `80-Oekonomi/provision.md` — satserne fra agenturaftalen.
4. `90-Drift/compliance.md` — **skal gennemgås af jeres compliance-ansvarlige.** Noten er et
   udkast, ikke juridisk rådgivning.
5. `00-Meta/tal-og-kilder.md` — det eneste sted agenterne må hente tal fra.

**Connectors.** To er bygget til jer og ligger i `vaerktoj/`:

| Connector | Gør | Sæt op |
|---|---|---|
| `outlook` | Læser postkassen og lægger udkast i Kladder. **Kan ikke sende.** | [vaerktoj/mcp-outlook/README.md](vaerktoj/mcp-outlook/README.md) |
| `portal` | Læser portalens Firestore. **Kun læsning.** | [vaerktoj/mcp-portal/README.md](vaerktoj/mcp-portal/README.md) |

De er allerede skrevet ind i `tools` på de agenter, der skal bruge dem: 17 pladser har
`outlook`, 17 har `portal`, og marketing har ingen af delene — de har ikke brug for kundedata.
Har I andre connectors, viser `claude mcp list` dem, og navnene derfra skrives ind i `tools`.

## Sådan retter I noget

| Vil I… | Ret i | Virker |
|---|---|---|
| gøre en agent til noget andet | `brain/Agents Office/agents.json` | efter genstart |
| give en agent en stående regel | `brief` samme sted | næste opgave |
| lære agenterne en arbejdsgang | en mappe i `brain/Agents Office/skills/` | næste opgave |
| sætte noget på timeplanen | `brain/Agents Office/routines.json` | inden for 20 sekunder |
| give agenterne mere viden | en note i `brain/` | næste opgave |

Kør `node validate.mjs` efter en rettelse. Den siger, hvad der er galt, i almindelige sætninger.

I kan også lade Claude Code gøre det: åbn Claude Code i motorens mappe og sig, hvad I vil have
ændret. Motorens `CLAUDE.md` forklarer resten. Bed den skrive til brain'et her, ikke til
`office.agents.local.json`, så ændringerne bliver versionsstyret sammen med resten.

## Regler, der er bagt ind

Agenterne har fået dem i deres briefs og i `house-style`. De er der, fordi vi formidler
forsikring for andre:

- **Vi afgør ikke skader.** Selskabet afgør. Ingen agent skriver "det er dækket".
- **Ingen personoplysninger i brain'et.** Ingen CPR-numre, helbredsoplysninger eller
  kontonumre. Kunde-, police- og sagsnumre er nok.
- **Priser og dækninger kommer fra selskabets beregning eller policen** — aldrig fra
  hukommelsen. Uden kilde skrives "(antaget)".
- **Rådgivning dokumenteres samme dag.**
- **Intet, der koster kunden penge, sendes uden en rådgivers godkendelse.** Rutiner, der ville
  sende noget ud, har `needsOk` slået til.

Motorens egen regel gælder oveni: agenterne læser frit, men sender, betaler eller ændrer kun
noget uden for maskinen, når opgaven udtrykkeligt beder om netop det.

## Drift

Skal kontoret køre hver dag — hvilken maskine, automatisk start, sikkerhedskopi, opdatering, og
hvorfor det aldrig må stå på det åbne internet: **[DRIFT.md](DRIFT.md)**.

## Licens — læs den, før I bruger det i driften

agents-office er udgivet under **PolyForm Noncommercial 1.0.0**: kun ikke-kommercielle formål
er tilladt. At køre et forsikringsagenturs daglige drift på den er kommerciel brug, og den er
efter licensens ordlyd **ikke** dækket — uanset at projektets README taler om "internal use".

Skal kontoret bruges i forretningen, skal I have en skriftlig tilladelse fra ophavsmanden
(GitHub: `ajsahni`) først. Indtil da: brug det til at afprøve idéen, ikke på rigtige kundesager.

Denne mappe indeholder kun vores eget indhold — konfiguration, noter, roster og færdigheder.
Motorens kode er ikke kopieret ind her; opsætningen henter den fra kilden.
