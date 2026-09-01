/**
 * Skønnet bag "prøv selv" på forsiden.
 *
 * Det her er IKKE den rigtige klassificering. Hos os læser en model beskeden
 * ordentligt igennem, og et menneske ser resultatet efter. Det her er en
 * håndfuld nøgleord, der kører i den besøgendes browser, så hun kan se hvilken
 * slags svar hun ville få — uden at vi får hendes tekst at se.
 *
 * Grænsen på 30 minutter er den samme som i kontrolpanelet: derover skriver vi
 * ikke kode, før der er sagt ja til et tilbud.
 */

export const COVERED_LIMIT_MINUTES = 30;

export type Kind = "tekstrettelse" | "billede" | "fejl" | "nyside" | "design" | "nyfunktion" | "ukendt";

export interface Rule {
  kind: Kind;
  /** Vises som opgavetype. */
  label: string;
  minutes: number;
  words: string[];
  /** Hvad rettelsen typisk rører ved — gør skønnet konkret. */
  touches?: string;
}

/** Rækkefølgen betyder noget: den første regel der rammer, vinder. */
export const rules: Rule[] = [
  {
    kind: "nyfunktion",
    label: "Ny funktion",
    minutes: 960,
    words: ["webshop", "web shop", "betaling", "betal", "lager", "kurv", "sælge", "salg", "stripe", "checkout", "abonnement på siden"],
    touches: "Butik, betaling og lagerstyring skal bygges og testes",
  },
  {
    kind: "nyfunktion",
    label: "Ny funktion",
    minutes: 720,
    words: ["booking", "book tid", "tidsbestilling", "reservation", "reserver", "kalender"],
    touches: "Bookingflow, kalender og bekræftelsesmails",
  },
  {
    kind: "nyfunktion",
    label: "Ny funktion",
    minutes: 1200,
    words: ["login", "log ind", "medlem", "portal", "brugerkonto", "brugere", "intranet"],
    touches: "Brugerkonti, adgangskoder og sikkerhed",
  },
  {
    kind: "nyfunktion",
    label: "Ny funktion",
    minutes: 480,
    words: ["flersproget", "engelsk version", "på engelsk", "tysk version", "oversæt hele"],
    touches: "Sprogversioner af alle sider",
  },
  {
    kind: "design",
    label: "Nyt design",
    minutes: 360,
    words: ["nyt design", "redesign", "nyt udseende", "helt ny forside", "moderniser", "nye farver"],
    touches: "Design, opsætning og gennemgang af alle sider",
  },
  {
    kind: "nyside",
    label: "Ny side",
    minutes: 90,
    words: ["ny side", "ny underside", "tilføj en side", "en side om", "landingsside"],
    touches: "Ny side med tekst, billeder og menupunkt",
  },
  {
    kind: "fejl",
    label: "Fejl",
    minutes: 30,
    words: ["virker ikke", "kan ikke", "fejl", "ødelagt", "nede", "404", "hvid side", "crash", "kommer ikke frem", "loader ikke"],
    touches: "Vi finder årsagen og retter den — hastesager kommer forrest",
  },
  {
    kind: "billede",
    label: "Billede",
    minutes: 15,
    words: ["billede", "billeder", "foto", "logo", "banner", "galleri"],
    touches: "Beskæring, komprimering og udskiftning",
  },
  {
    kind: "tekstrettelse",
    label: "Tekstrettelse",
    minutes: 10,
    words: [
      "åbningstid", "åbningstider", "lukket", "lukker", "åbner",
      "telefon", "nummer", "mobil", "adresse", "mail", "e-mail",
      "pris", "priser", "tekst", "stavefejl", "ret", "retter", "opdater", "opdatere",
      "skift", "ændre", "navn", "titel", "overskrift", "cvr", "personale", "medarbejder",
    ],
    touches: "Vi finder alle de steder, det står, og retter dem i én omgang",
  },
];

export interface Verdict {
  label: string;
  minutes: number | null;
  covered: boolean;
  /** Sat når vi ikke kan sige noget fornuftigt ud fra nøgleord alene. */
  unsure: boolean;
  touches: string;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutter`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${String(hours).replace(".", ",")} timer`;
}

export function classify(message: string): Verdict {
  const text = message.toLowerCase();

  for (const rule of rules) {
    if (rule.words.some((w) => text.includes(w))) {
      return {
        label: rule.label,
        minutes: rule.minutes,
        covered: rule.minutes <= COVERED_LIMIT_MINUTES,
        unsure: false,
        touches: rule.touches ?? "",
      };
    }
  }

  return {
    label: "Skal læses ordentligt",
    minutes: null,
    covered: false,
    unsure: true,
    touches: "Nøgleord er ikke nok her — den slags svarer vi på i hånden samme dag",
  };
}
