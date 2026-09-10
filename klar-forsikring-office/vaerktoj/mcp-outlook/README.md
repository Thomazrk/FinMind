# Outlook som connector

Giver agenterne adgang til postkassen: de kan **læse** og **lægge udkast i Kladder**.
De kan ikke sende. Der findes ingen send-funktion i serveren — ikke som en indstilling, men
fordi værktøjet ikke er skrevet. Et menneske trykker send i Outlook.

| Værktøj | Gør |
|---|---|
| `outlook_mapper` | Viser mapperne og antal ulæste |
| `outlook_mails` | Lister mails i en mappe — afsender, emne, tid, de første linjer |
| `outlook_mail` | Henter hele teksten i én mail |
| `outlook_udkast` | Lægger et udkast i Kladder, som svar eller som ny mail |

## 1. Opret en appregistrering i Microsoft 365

Det skal gøres af en, der må registrere apps i jeres Microsoft 365. Det tager fem minutter.

1. Gå til [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** →
   **App registrations** → **New registration**.
2. Navn: fx `Klarforsikring agentkontor`. Kontotyper: **kun denne organisation**.
   Redirect URI: lad den stå tom.
3. Åbn registreringens **Authentication** og sæt **Allow public client flows** til **Yes**.
   Uden den kan vi ikke logge ind fra en terminal.
4. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions** →
   tilføj `Mail.Read`, `Mail.ReadWrite` og `offline_access`.
   Kræver jeres lejer administratorgodkendelse, så tryk **Grant admin consent**.
5. Notér **Application (client) ID** og **Directory (tenant) ID** fra oversigten.

Der er ingen client secret. Vi bruger device code flow, så der ligger ingen hemmelighed på
maskinen — kun det token, Microsoft udsteder til den bruger, der loggede ind.

## 2. Installér og log ind

```bash
cd vaerktoj/mcp-outlook
npm install
```

Sæt de to id'er. Windows PowerShell:

```powershell
setx KLAR_MS_CLIENT_ID "<application client id>"
setx KLAR_MS_TENANT    "<directory tenant id>"
```

Mac og Linux — læg dem i `~/.zshrc` eller `~/.bashrc`:

```bash
export KLAR_MS_CLIENT_ID="<application client id>"
export KLAR_MS_TENANT="<directory tenant id>"
```

Åbn en **ny** terminal, og log ind:

```bash
node vaerktoj/mcp-outlook/login.mjs
```

Den viser en kode og en adresse. Åbn adressen, skriv koden, log ind med den konto, postkassen
hører til. Tokenet lægges i `privat/outlook-token.json` — den mappe er gitignoreret, og filen
skrives med rettigheder, kun din bruger kan læse.

Loginnet fornyer sig selv. Skifter I adgangskode eller trækker adgangen tilbage, kører I
`login.mjs` igen.

## 3. Kobl den på kontoret

```bash
claude mcp add outlook -- node <fuld sti>/klar-forsikring-office/vaerktoj/mcp-outlook/server.mjs
```

Genstart kontoret. `outlook` dukker op i bjælken under CONNECTED TO, og de agenter, der har
`outlook` i deres `tools`, kan bruge den.

## Hvad agenterne må

Kontorets egen regel gælder oveni: de læser frit, men ændrer kun noget uden for maskinen, når
opgaven udtrykkeligt beder om det. Et udkast er en ændring — så en agent laver kun et udkast,
når I har bedt om det.

Rutinen `morgenpost` kan læse indbakken og sortere den uden at røre noget.
Rutinen `skadeopfoelgning` skriver rykkere som udkast og venter på jeres ja, fordi den har
`needsOk` slået til.

## Når noget ikke virker

| Beskeden siger | Det betyder |
|---|---|
| `Ikke logget ind i Microsoft 365 endnu` | Kør `login.mjs` |
| `Microsoft afviste adgangen` | Tokenet er udløbet eller trukket tilbage — kør `login.mjs` |
| `Ingen tilladelse til det` | Appregistreringen mangler `Mail.Read` eller `Mail.ReadWrite`, eller admin har ikke godkendt |
| `Microsoft beder os vente lidt` | For mange kald på kort tid. Prøv igen om et øjeblik |

Test serveren uden kontoret:

```bash
node vaerktoj/mcp-outlook/server.mjs
```

Den venter på MCP-beskeder på stdin. Kommer der ingen fejl med det samme, kan den starte.
