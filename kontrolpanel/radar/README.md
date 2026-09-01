# Kunderadar

Kundeporteføljen som et rum i stedet for en liste. Én statisk HTML-fil, ingen
byggetrin: åbn `index.html` i en browser, eller læg mappen på en statisk host.

## Sådan læses den

Radaren er polær, og begge akser betyder noget:

| Det du ser | Det det er |
| --- | --- |
| Afstand fra midten | Dage til fornyelse. Midten er i dag, ringene er 30, 60, 90 og 120 dage. |
| Søjlens højde | Månedsprisen. |
| Soklens bue | Hvor meget af pakkens supportminutter der er brugt. Grøn under 80 %, rav over, rød når den er brugt op. |
| Ravlys der svæver | Et forslag der venter på din godkendelse. Ét lys, ét klik. |
| Rødt bånd | Kundens side er nede. |
| Nedtonet søjle | Automatikken er sat på pause for den kunde. |

Det eneste der lyser og bevæger sig, er det der venter på dig. Alt andet står
stille — en rolig radar betyder, at der ikke er noget at gøre.

## Data

Testdata står i `KUNDER` øverst i scriptet: ni opdigtede små virksomheder i
samme form som kontrolpanelets `kunder`-samling, med de tre fra
`seed/data.json` iblandt. Ingen rigtige kunder, ingen Firebase-forbindelse.

Skal den vise rigtige tal, skal `KUNDER` fyldes fra Firestore i stedet — felterne
hedder det samme som i `web/src/types.ts`, bortset fra at `dage` her er talt ud
fra `fornyelsesdato`.

## Afhængigheder

three.js r128 hentes fra cdnjs, og de to skrifter fra Google Fonts. Kamerastyringen
er skrevet i hånden, så der ikke skal hentes en `OrbitControls` oveni. Kan
three.js ikke hentes, siger siden præcis det — og skelner det fra det tilfælde,
hvor det er browseren der ikke vil tegne WebGL.

## Bemærk

Radaren er til at kigge på, ikke til at arbejde i. Godkendelser sker i
kontrolpanelet i `../web`, hvor der er en revisionslog og regler bag hvert klik.
Der er ingen skriveadgang herfra overhovedet.
