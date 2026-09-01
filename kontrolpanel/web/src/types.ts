/**
 * Firestore document shapes.
 *
 * Identifiers are English, but the *field* names are Danish: they are the
 * storage contract from the project spec, and renaming them here would just
 * move the mismatch into the mapping layer. Status values are stored strings,
 * so they stay Danish too.
 */

export type TaskStatus = "afventer" | "godkendt" | "afvist" | "tilbudSendt" | "leveret";

export type SiteStatus = "live" | "ændringVenter" | "nede" | "underOpbygning";

export type TaskType = "tekstrettelse" | "billede" | "nyside" | "fejl" | "design" | "andet";

export interface Customer {
  id: string;
  navn: string;
  slackKanalId: string;
  repo: string;
  domæne: string;
  pakke: string;
  månedspris: number;
  fornyelsesdato: string; // ISO date, e.g. "2026-03-01"
  supportMinutterDenneMåned: number;
}

export interface Site {
  id: string;
  kundeId: string;
  repo: string;
  produktionsUrl: string;
  sidsteDeploy: string | null; // ISO timestamp
  status: SiteStatus;
  /**
   * Optional: what the preview frame loads, when that has to differ from the
   * production URL — a staging copy, for a site whose production host sends
   * X-Frame-Options. The card always shows and links produktionsUrl.
   */
  forhåndsvisningsUrl?: string | null;
}

export interface Classification {
  type: TaskType;
  estimatMinutter: number;
  dækketAfAbonnement: boolean;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  kroner: number;
}

export interface DiffFile {
  filnavn: string;
  før: string;
  efter: string;
}

export interface Task {
  id: string;
  kundeId: string;
  sideId: string;
  slackBeskedId: string;
  slackPermalink: string;
  beskedTekst: string;
  afsender: string;
  modtagetTidspunkt: string; // ISO timestamp
  resumé: string; // one sentence: what the change does
  klassifikation: Classification;
  status: TaskStatus;
  branch: string | null;
  prUrl: string | null;
  previewUrl: string | null;
  diff: DiffFile[];
  forbrug: Usage;
  afgjortAf: string | null;
  afgjortTidspunkt: string | null;
  afvisningsårsag: string | null;
}

export interface MonthlyUsage {
  id: string; // "2026-09"
  totalTokens: number;
  totalKroner: number;
  perKunde: Record<string, number>;
}

export type ActivityAction =
  | "godkendt"
  | "afvist"
  | "automatiskKørsel"
  | "tilbudSendt"
  | "leveret";

export interface ActivityEntry {
  id: string;
  tidspunkt: string; // ISO timestamp
  handling: ActivityAction;
  opgaveId: string | null;
  kundeId: string | null;
  udførtAf: string; // user email, or "automatik"
  detalje: string;
}
