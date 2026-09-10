# Når det kører selv, og du kun godkender

Kontoret kan køre sin egen dag. Det, der kun læser og rapporterer, sker uden dig. Det, der
ville sende noget ud af huset, stopper og venter på dit tryk.

## Sådan virker godkendelsen

Det er bygget ind i motoren, ikke noget vi har fundet på. En rutine med `needsOk` kører i to
skridt:

1. **Rutinen fyrer.** Agenten får besked på at forberede alt og **ikke sende, betale eller
   ændre noget uden for maskinen**. Den skriver det færdige udkast og en linje om, hvad den
   ville gøre, hvis du siger ja.
2. **Kortet flytter til WAITING ON APPROVAL** i panelet til højre, og agenten rejser sig og
   vinker ved sit skrivebord. Udkastet ligger i agentens chat.
3. **Du trykker APPROVE.** Så kører agenten igen — nu med besked på at udføre det udgående
   skridt præcis som skrevet, med sine connectors.
4. **Eller du trykker REJECT og skriver hvad der skal ændres.** Agenten får din kommentar og
   sin egen forrige version og laver den om. Rettelsen bliver husket i
   `brain/Agents Office/feedback/<agent>.md` og læst igen næste gang.

Du behøver ikke have siden åben. Uret sidder i serveren, og kortene ligger og venter, til du
kigger.

## Dagen som den er sat op nu

| Klokken | Hvad | Hvem | Venter på dig? |
|---|---|---|---|
| Hverdage 08:00 | Morgentriage af kundepost | POSTCHEF | Nej — den sorterer og rapporterer |
| Hverdage 09:30 | Rykkere til selskaberne på åbne sager | SELSKABSPOST | **Ja** |
| Hverdage 10:00 | Tilbud der ikke er besvaret | OPFØLGNING | **Ja** |
| Hverdage 15:30 | Udkast til dagens ubesvarede post | KUNDEMAILS | **Ja** |
| Mandag 09:00 | Fornyelser 45 dage før hovedforfald | OPFØLGNING | Nej — en liste |
| Mandag 09:30 | Kontrollér provisionsopgørelserne | PROVISION | Nej — en liste |
| Mandag 10:30 | Månedsafstemning | AFSTEMNING | Nej — en liste |

Tre ting om dagen kræver et ja fra dig. Resten lander som noter og lister, du kan læse, når du
har tid — de sender ingenting.

## Det der skal være på plads

**1. Maskinen skal køre.** Uret sidder i serveren. Er maskinen slukket kl. 08:00, fyrer
morgentriagen ikke. En kørsel, der blev misset, tages én gang bagefter og markeres LATE — men
kun én. Se [DRIFT.md](DRIFT.md).

**2. Kommandoerne til tidsplanen.** Kør denne, så får du dem med jeres egne stier sat ind:

```
node <fuld sti>/klar-forsikring-office/automatik.mjs
```

Den ændrer ingenting — den skriver ud, hvad du skal køre, så du kan læse det først.

**3. Connectorne.** Uden Outlook har postrutinerne ikke noget at læse. Se
[vaerktoj/mcp-outlook/README.md](vaerktoj/mcp-outlook/README.md).

**4. Bestanden skal være frisk.** Fornyelses- og provisionsrutinerne regner på de noter,
CRM-importen skriver. Læg udtrækket som `.csv` i `privat/udtraek/`, så tager
`vaerktoj/importer-vagt.mjs` den nyeste hver morgen. Er der ikke kommet en ny fil, laver den
ingenting. Logbogen står i `privat/import-log.txt`.

## Det der ikke kan køre selv endnu

Motoren kører **kun rutiner for Kundepost, Salg og Økonomi** i denne udgivelse. Skade og
kundeservice, Drift og Marketing kan ikke sættes på timeplanen — kontoret afviser det med en
sætning, hvis man prøver. De afdelinger arbejder, når I giver dem en opgave i bjælken.

Det rammer især to ting, I nok gerne ville have automatisk: opfølgning på skadesager og den
faste compliance-overvågning. Indtil de kommer, er de en opgave, nogen skriver ind.

## Grænserne, der ikke flytter sig

- **Outlook-connectoren kan ikke sende.** Funktionen findes ikke i koden. Selv en godkendt
  rutine kan kun lægge en kladde. Et menneske trykker send i Outlook.
- **Portal-connectoren kan ikke skrive.** Kun læsning, og kun de samlinger, I har givet fri.
- **Ingen agent får Bash, filadgang eller en browser.** De har deres connectors og intet andet.
- **Klager besvares aldrig af en agent.** Færdigheden `klagesvar` siger: kvittér, og send til
  ledelsen.

## Sådan tilføjer I en rutine

Rutinerne står i `brain/Agents Office/routines.json`, og serveren læser filen hvert 20. sekund,
så en ny lander uden genstart. I kan også bare sige det til en afdelingsleder i chatten:
*"hver mandag kl. 9, list de tilbud der er over en uge gamle"*. Lederen lægger den på det rigtige
skrivebord og læser timeplanen tilbage.

Sæt `needsOk` til `true` på alt, der kunne sende, betale eller ændre noget. Standarden er
`true`, og det er den rigtige standard.
