/**
 * De tre beskeder i forsidens demo.
 *
 * Kunderne er opdigtede. Byt dem ud med rigtige, når du har fået lov til at
 * nævne dem — formen er den samme.
 *
 * Den sidste ender med et tilbud i stedet for en rettelse, og det skal den
 * blive ved med. En side der kun viser lykkelige udfald lyver om, hvordan det
 * er at være kunde.
 */
export type StepKind = "normal" | "wait" | "done";

export interface Step {
  what: string;
  detail: string;
  kind?: StepKind;
  diff?: { before: string; after: string };
}

export interface DemoCase {
  chip: string;
  channel: string;
  sender: string;
  initials: string;
  time: string;
  text: string;
  steps: Step[];
  verdict: { tone: "live" | "quote"; text: string };
}

export const demoCases: DemoCase[] = [
  {
    chip: "Ret en åbningstid",
    channel: "#bageriet-paa-torvet",
    sender: "Mette Krogh",
    initials: "MK",
    time: "07.32",
    text: "Hej! Vi lukker kl. 16 om lørdagen fra på lørdag i stedet for kl. 14. Kan du rette det på forsiden?",
    steps: [
      { what: "Læst og vurderet", detail: "Tekstrettelse · anslået 8 minutter · dækket af abonnementet" },
      {
        what: "Rettelsen bygget",
        detail: "src/components/Aabningstider.astro",
        diff: { before: "Lørdag  07.00–14.00", after: "Lørdag  07.00–16.00" },
      },
      { what: "Afventer godkendelse", detail: "Et menneske ser forslaget igennem", kind: "wait" },
      { what: "Udgivet", detail: "Live 07.49 · 17 minutter efter beskeden", kind: "done" },
    ],
    verdict: {
      tone: "live",
      text: "Rettet og live samme morgen. Trukket fra månedens supportminutter.",
    },
  },
  {
    chip: "Nyt telefonnummer",
    channel: "#vestergaard-vvs",
    sender: "Lars Vestergaard",
    initials: "LV",
    time: "11.04",
    text: "Vores vagttelefon er skiftet til 40 12 88 90. Den gamle skal væk alle steder.",
    steps: [
      { what: "Læst og vurderet", detail: "Tekstrettelse · anslået 12 minutter · dækket af abonnementet" },
      {
        what: "Rettelsen bygget",
        detail: "Fundet 4 steder: sidefod, kontakt, vagtside, strukturerede data",
        diff: { before: "40 11 77 22", after: "40 12 88 90" },
      },
      { what: "Afventer godkendelse", detail: "Et menneske tjekker, at alle fire steder er med", kind: "wait" },
      { what: "Udgivet", detail: "Live 11.21", kind: "done" },
    ],
    verdict: {
      tone: "live",
      text: "Alle fire forekomster rettet i én omgang. Du skal ikke selv holde styr på hvor de står.",
    },
  },
  {
    chip: "Ønske om en webshop",
    channel: "#nordhavn-tandklinik",
    sender: "Jonas Bech",
    initials: "JB",
    time: "10.20",
    text: "Vi vil gerne kunne sælge tandblegningssæt direkte fra siden med betaling og lager. Hvad koster det?",
    steps: [
      {
        what: "Læst og vurderet",
        detail: "Ny funktion · anslået 16 timer · ikke dækket af abonnementet",
        kind: "wait",
      },
      { what: "Ingen kode skrevet", detail: "Vi går ikke i gang med noget, du ikke har sagt ja til" },
      { what: "Tilbud sendt", detail: "Pris og tidsplan på mail samme dag", kind: "wait" },
    ],
    verdict: {
      tone: "quote",
      text: "Uden for abonnementet. Du får en pris, før der bliver rørt ved noget — ikke en regning bagefter.",
    },
  },
];
