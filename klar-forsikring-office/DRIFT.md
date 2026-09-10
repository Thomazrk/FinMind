# Drift — at have kontoret kørende

Kontoret er en server, der kører på en maskine hos jer. Det er ikke en hjemmeside, og det skal
ikke blive til en. Denne note er, hvad der skal til, for at det kører hver dag.

## Det vigtigste først: kontoret har ingen adgangskode

Motoren lytter på alle netværkskort (`listen(port)` uden adresse) og har **ingen** form for
login — ingen brugere, ingen adgangskode, intet token. Enhver, der kan nå porten, kan:

- læse hele brain'et, inklusive bestanden
- give agenterne opgaver
- bruge jeres connectors og jeres Claude-konto

Derfor:

- **Læg det aldrig på det åbne internet.** Ingen port-videresendelse i routeren, ingen offentlig
  IP, ingen tunnel med en offentlig adresse.
- På et kontornetværk er det tilgængeligt for alle på samme net. Det er sjældent et problem på
  et lille kontor, men det er værd at vide.
- Skal I nå det hjemmefra, så brug et privat netværk — Tailscale eller WireGuard. Så er
  maskinen kun synlig for jeres egne enheder, og der åbnes ingen porte udadtil.

Skal det på et tidspunkt være rigtigt tilgængeligt udefra, kræver det en omvendt proxy med
HTTPS og login foran (fx Caddy med basic auth). Det er en beslutning, ikke en indstilling — og
den skal træffes sammen med spørgsmålet om persondata og licensen.

## Hvilken maskine

Rutinerne fyrer kun, mens serveren kører. En bærbar, der klappes i om aftenen, er ikke en
driftsmaskine — en misset kørsel tages én gang bagefter og markeres LATE, men resten falder på
gulvet.

Vælg noget, der står tændt: en fast PC på kontoret, en Mac Mini, en lille Intel NUC. Den skal
have Node 20+, git og et **Claude Code-login**. Log ind som den bruger, der ejer maskinen, og
lad være med at dele den bruger med andre.

## Start automatisk

**Windows** — Opgavestyring (Task Scheduler). Én linje i PowerShell som administrator, med jeres
egne stier:

```powershell
schtasks /create /tn "Klarforsikring kontor" /sc onlogon /rl highest ^
  /tr "node C:\Users\Bruger\FinMind\klar-forsikring-office\start.mjs"
```

Sæt maskinen til at logge automatisk ind efter genstart, ellers starter opgaven ikke.

**Mac** — en fil i `~/Library/LaunchAgents/dk.klarforsikring.kontor.plist` med
`ProgramArguments` = `/usr/local/bin/node` og stien til `start.mjs`, `RunAtLoad` = true og
`KeepAlive` = true. Aktivér den med `launchctl load -w <filen>`.

**Linux** — en systemd-service med `Restart=always` og `WorkingDirectory` sat til
agents-office-mappen.

Tjek en gang om ugen, at den faktisk kører: åbn kontoret, kig på SCHEDULED-feltet, og se om
næste kørsel står med en fornuftig dato.

## Sikkerhedskopi

Brain'et er det, der er jeres. Motoren kan altid hentes igen.

- Alt i `klar-forsikring-office/` er i git. `git add -A && git commit -m "..." && git push`
  efter hver gang I har rettet noter, briefs eller færdigheder.
- **Undtagelser, der med vilje ikke er i git:** `privat/kundeopslag.csv`, de tre importerede
  noter (`bestand.md`, `fornyelser.md`, `bestandstal.md`) og `demo/demo.html`. Kundedata hører
  ikke i et git-repo. Skal de sikkerhedskopieres, så tag dem med jeres almindelige backup af
  maskinen — ikke med git.
- Agenternes egne leverancer lander i `brain/Agents Office/` og er også i git.

## Opdatering

```bash
cd <stien>/klar-forsikring-office
git pull            # henter vores rettelser
node setup.mjs      # opdaterer motoren og bygger igen
node validate.mjs   # siger, om noget er gået i stykker
```

Motoren er stadig i beta. Læs `CHANGELOG.md` i agents-office-mappen, hvis noget opfører sig
anderledes efter en opdatering.

## Når noget går galt

`node tjek.mjs` gennemgår Node, git, Claude Code, mappen, motoren, configfilen, porten og
netforbindelsen, og skriver en rapport, der kan sendes videre. Den ændrer ingenting.

Kontoret svarer ikke → er terminalen med `node start.mjs` stadig åben? Rutiner fyrer ikke →
kørte maskinen på det tidspunkt? Agenterne skriver generisk → mangler der en brief eller en
færdighed, eller er bestanden ikke importeret?

## Det, der stadig skal besluttes

- **Licensen.** agents-office er PolyForm Noncommercial. Daglig drift i et agentur er
  kommerciel brug. Skriftlig tilladelse fra ophavsmanden, før det kører i produktion.
- **Persondata.** Hvad må ligge i brain'et, hvor længe, og hvem har adgang til maskinen. Hører
  til i `90-Drift/compliance.md`, godkendt af jeres compliance-ansvarlige.
