/**
 * ALT DER IDENTIFICERER DIG STÅR HER.
 *
 * Det var pointen med at flytte siden til Astro: navn, mail, telefon og CVR lå
 * spredt over seks steder i én HTML-fil. Nu er der ét sted at rette.
 *
 * Værdierne herunder er pladsholdere. Ret dem, før siden går live.
 */
export const studio = {
  navn: "Studiet",
  /** Med https:// og uden skråstreg til sidst. Bruges til kanoniske adresser og sitemap. */
  url: "https://studiet.dk",
  email: "hej@studiet.dk",
  /** Som det skal læses på skærmen. */
  telefon: "20 00 00 00",
  /** Samme nummer i internationalt format, til tel:-linket. */
  telefonLink: "+4520000000",
  cvr: "00 00 00 00",
  by: "Aarhus",
  beskrivelse:
    "Vi bygger og passer hjemmesider for små virksomheder. Du skriver en besked, " +
    "når noget skal laves om — vi retter det og viser dig resultatet, før det går live.",
  /** Vises i sidefoden. */
  undertitel: "Hjemmesider til små virksomheder",
} as const;
