# Portalen som connector

Giver agenterne læseadgang til portalens Firestore-database. **Kun læsning.** Der er ingen
skrive- eller slettefunktioner i serveren, og service-kontoen skal oveni have en rolle, der
kun må læse — så kan hverken en fejl eller en misforstået opgave ændre noget i portalen.

| Værktøj | Gør |
|---|---|
| `portal_samlinger` | Viser samlingerne i databasen, og hvilke agenterne må læse |
| `portal_find` | Søger i en samling med filtre og sortering |
| `portal_dokument` | Henter ét dokument ud fra dets id |

## 1. Lav en service-konto, der kun må læse

Firebase tilbyder at lave en nøgle under **Projektindstillinger → Tjenestekonti → Generér ny
privat nøgle**. **Brug den ikke.** Den nøgle har Editor-adgang til hele projektet og må skrive
og slette. Lav i stedet en konto, der kun må læse:

1. Gå til [console.cloud.google.com](https://console.cloud.google.com) og vælg projektet
   (det hedder noget med `studio-5224734247`).
2. **IAM & Admin → Service Accounts → Create service account**.
   Navn: fx `agentkontor-laeser`.
3. Giv den én rolle: **Cloud Datastore Viewer** (`roles/datastore.viewer`). Ikke andet.
4. Åbn kontoen → **Keys → Add key → Create new key → JSON**. Filen hentes ned.
5. Læg filen i `klar-forsikring-office/privat/` — den mappe er gitignoreret. **Læg den aldrig
   et sted, der bliver committet.** Nøglen er en adgangsbillet til jeres data.

## 2. Installér og peg på nøglen

```bash
cd vaerktoj/mcp-portal
npm install
```

Windows PowerShell:

```powershell
setx KLAR_FIREBASE_KEY "C:\Users\Bruger\FinMind\klar-forsikring-office\privat\agentkontor-laeser.json"
```

Mac og Linux:

```bash
export KLAR_FIREBASE_KEY="$HOME/FinMind/klar-forsikring-office/privat/agentkontor-laeser.json"
```

Åbn en ny terminal bagefter, hvis I brugte `setx`.

## 3. Bestem hvad agenterne må læse

`samlinger.json` styrer det. Den starter tom, og **tom betyder, at agenterne ingenting må** —
`portal_find` og `portal_dokument` afviser alt, indtil I har skrevet noget ind.

Kobl serveren på (næste afsnit), spørg en agent om at køre `portal_samlinger`, og se, hvad
databasen indeholder. Skriv så de samlinger ind, agenterne har brug for:

```json
"tilladte_samlinger": ["kunder", "policer", "sager"]
```

Lad brugerkonti, adgangskoder og alt administrativt blive udenfor.

`skjulte_felter` maskerer felter ud fra deres navn — CPR, personnummer, adgangskode, token,
kontonummer, helbred. Et felt, hvis navn indeholder et af ordene, kommer aldrig ud af serveren;
agenten ser `[skjult]`. Det gælder uanset hvilken samling det ligger i, og hvor dybt det ligger.
Tilføj jeres egne feltnavne, hvis I har nogle, der hedder noget andet.

Tjek maskeringen når I har rettet listen:

```bash
node vaerktoj/mcp-portal/test-rens.mjs
```

## 4. Kobl den på kontoret

```bash
claude mcp add portal -- node <fuld sti>/klar-forsikring-office/vaerktoj/mcp-portal/server.mjs
```

Genstart kontoret. `portal` dukker op i bjælken under CONNECTED TO.

## Portalen og brain'et er to forskellige ting

- **Portalen** er live opslag: hvad står der på den her kunde lige nu.
- **Brain'et** er bestanden lagt ind som noter med `vaerktoj/importer-crm.mjs`, pseudonymiseret,
  og det er det, rutinerne regner på — fornyelseslister, provisionskontrol.

Begge dele må gerne være der. Live-opslag er godt til en enkelt sag; noterne er gode til at
regne på en hel bestand uden at hive tusind dokumenter gennem modellen.

## Når noget ikke virker

| Beskeden siger | Det betyder |
|---|---|
| `KLAR_FIREBASE_KEY er ikke sat` | Miljøvariablen mangler, eller terminalen er ikke genåbnet efter `setx` |
| `Service-konto-filen blev ikke fundet` | Stien passer ikke |
| `Ingen samlinger er givet fri endnu` | `samlinger.json` er tom — det er meningen, indtil I fylder den ud |
| `"x" er ikke givet fri` | Samlingen står ikke i `tilladte_samlinger` |
| `Firestore mangler et indeks` | Søgningen kræver et sammensat indeks. Forenkl søgningen, eller lav indekset i Firebase-konsollen — beskeden indeholder et link |
| `PERMISSION_DENIED` | Service-kontoen mangler Cloud Datastore Viewer |
