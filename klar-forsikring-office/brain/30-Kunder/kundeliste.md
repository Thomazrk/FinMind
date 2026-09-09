# Kundeliste

> **Ingen personoplysninger i denne note.** Ingen navne, CVR-numre, CPR-numre, adresser,
> helbredsoplysninger eller kontonumre. Kunder omtales med kundenummer, policenummer eller
> sagsnummer. De rigtige data ligger i CRM'et — ikke i brain'et. Se [[compliance]].

Bestanden kommer fra CRM'et og lægges ind med `node vaerktoj/importer-crm.mjs <udtræk.csv>`.
Importen skriver tre noter, som agenterne læser:

- [[bestand]] — hvor mange kunder og policer, fordelt på produkt og selskab
- [[fornyelser]] — policer med hovedforfald inden for de næste 60 dage
- [[bestandstal]] — tallene med kilde og dato

Kundenummeret er nøglen. **Hvem kunde K-00042 er, slår I op i CRM'et** — eller i
`privat/kundeopslag.csv`, som ligger uden for brain'et og ikke deles med agenterne.

Er noterne ikke der endnu, er udtrækket ikke kørt. Så arbejder agenterne uden bestand og
skriver "Mangler: bestand" i stedet for at gætte.
