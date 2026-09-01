/**
 * Pakkeanbefalingen.
 *
 * Et bud, ikke et tilbud. Regnestykket står på skærmen, så den besøgende kan se,
 * hvad buddet bygger på — og selv vurdere om det passer.
 */
import { plans } from "./plans";

export const CHANGES_PER_MONTH = [
  { value: 1, label: "Sjældent", detail: "0–2 gange om måneden" },
  { value: 4, label: "Jævnligt", detail: "3–6 gange om måneden" },
  { value: 9, label: "Tit", detail: "7 gange eller mere" },
] as const;

export const SITE_SIZES = [
  { value: 4, label: "Under 5" },
  { value: 12, label: "5 til 15" },
  { value: 25, label: "Over 15" },
] as const;

/** Gennemsnitlig tid på en almindelig rettelse, målt på kontrolpanelets opgaver. */
export const MINUTES_PER_CHANGE = 12;

export interface Recommendation {
  plan: (typeof plans)[number];
  estimatedMinutes: number;
  reasons: string[];
  tight: boolean;
}

export function recommend(changes: number, sites: number, selfEdit: boolean): Recommendation {
  const estimatedMinutes = changes * MINUTES_PER_CHANGE;
  const reasons: string[] = [
    `${changes === 1 ? "Cirka 1 rettelse" : `Cirka ${changes} rettelser`} om måneden à ${MINUTES_PER_CHANGE} minutter = ${estimatedMinutes} minutter`,
  ];

  let index = 0;
  if (estimatedMinutes > 60 || sites > 5 || selfEdit) index = 1;
  if (estimatedMinutes > 120 || sites > 15) index = 2;

  if (sites > 15) reasons.push("Over 15 sider kræver den store pakke");
  else if (sites > 5) reasons.push("5 til 15 sider ligger i den mellemste pakke");

  if (selfEdit) reasons.push("Du vil selv kunne rette tekst og billeder");

  const plan = plans[index]!;
  const included = Number(plan.indeholder[0]?.match(/\d+/)?.[0] ?? 0);
  const tight = included > 0 && estimatedMinutes > included * 0.8;

  return { plan, estimatedMinutes, reasons, tight };
}
