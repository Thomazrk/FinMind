/**
 * Pakker og priser.
 *
 * Tallene er hentet fra kontrolpanelets testdata og er IKKE et forslag til, hvad
 * du skal tage. Sæt dine egne ind, før siden går live.
 */
export interface Plan {
  navn: string;
  prisKroner: number;
  indeholder: string[];
}

export const plans: Plan[] = [
  {
    navn: "Lille",
    prisKroner: 1200,
    indeholder: ["60 minutters support", "op til 5 sider", "svar samme arbejdsdag"],
  },
  {
    navn: "Mellem",
    prisKroner: 2400,
    indeholder: [
      "120 minutters support",
      "op til 15 sider",
      "du kan selv rette tekst og billeder",
      "månedlig rapport",
    ],
  },
  {
    navn: "Stor",
    prisKroner: 3600,
    indeholder: [
      "180 minutters support",
      "ubegrænset antal sider",
      "flersproget",
      "kvartalsmøde om siden",
    ],
  },
];

export const newSite = {
  navn: "Ny hjemmeside",
  beskrivelse: "Design, opsætning og indhold. Typisk tre til fem uger.",
  prisTekst: "fra 18.000 kr.",
};

/** Det abonnementet ikke dækker. At sige det højt er billigere end en dårlig samtale senere. */
export const notIncluded: string[] = [
  "Webshop, betaling og lagerstyring",
  "Nye funktioner der tager mere end en halv times arbejde",
  "At skrive teksterne for dig",
  "Logo og grafisk identitet",
  "Google Ads, SEO-kampagner og nyhedsbreve",
  "Support uden for hverdage 8–16",
  "Andres systemer — booking, kassesystem, lønprogram",
];
