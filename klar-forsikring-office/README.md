# Klar Forsikring — Agents Office

Et 3D-kontor, hvor AI-agenter laver rigtigt arbejde på jeres eget Claude-login. Motoren er
[agents-office](https://github.com/ajsahni/agents-office). **Denne mappe er ikke motoren** —
den er Klar Forsikrings udgave af den: de 35 pladser skrevet om til et dansk forsikringsagentur,
et brain med jeres noter, fem færdigheder og syv faste rutiner.

Motoren hentes af `setup.sh` og bliver liggende i sin egen mappe. Alt, der er jeres, ligger her
og er versionsstyret. En `git pull` i motoren rører aldrig noget af det.

## Kom i gang

```bash
./setup.sh          # henter agents-office til ~/agents-office, installerer, bygger, tjekker
./start.sh          # → http://localhost:4520
```

Vil I have motoren et andet sted: `./setup.sh /sti/til/agents-office`.

**Krav:** Node 20+, git, og **Claude Code logget ind** med jeres Claude-konto (eller en
`ANTHROPIC_API_KEY`). Uden Claude Code kører kontoret, men agenterne kan ikke arbejde.

Tjek jeres egne filer når som helst — også uden at starte kontoret:

```bash
node validate.mjs
```

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

**Connectors.** Feltet `tools` på hver agent i `agents.json` er gæt (gmail, notion, canva).
Kør `claude mcp list` og skriv jeres egne navne ind — det er dem, der står i kontorets øverste
bjælke. Uden en connector arbejder agenten ud fra brain'et alene.

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

## Licens — læs den, før I bruger det i driften

agents-office er udgivet under **PolyForm Noncommercial 1.0.0**: kun ikke-kommercielle formål
er tilladt. At køre et forsikringsagenturs daglige drift på den er kommerciel brug, og den er
efter licensens ordlyd **ikke** dækket — uanset at projektets README taler om "internal use".

Skal kontoret bruges i forretningen, skal I have en skriftlig tilladelse fra ophavsmanden
(GitHub: `ajsahni`) først. Indtil da: brug det til at afprøve idéen, ikke på rigtige kundesager.

Denne mappe indeholder kun vores eget indhold — konfiguration, noter, roster og færdigheder.
Motorens kode er ikke kopieret ind her; `setup.sh` henter den fra kilden.
