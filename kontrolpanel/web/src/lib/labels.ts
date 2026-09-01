import type { ActivityAction, SiteStatus, TaskStatus, TaskType } from "../types";

/** Stored values are Danish; these are the words that reach the screen. */

export const taskStatusLabel: Record<TaskStatus, string> = {
  afventer: "Afventer godkendelse",
  godkendt: "Godkendt",
  afvist: "Afvist",
  tilbudSendt: "Tilbud sendt",
  leveret: "Leveret",
};

export const siteStatusLabel: Record<SiteStatus, string> = {
  live: "Live",
  ændringVenter: "Ændring venter",
  nede: "Nede",
  underOpbygning: "Under opbygning",
};

export const taskTypeLabel: Record<TaskType, string> = {
  tekstrettelse: "Tekstrettelse",
  billede: "Billede",
  nyside: "Ny side",
  fejl: "Fejl",
  design: "Design",
  andet: "Andet",
};

export const activityLabel: Record<ActivityAction, string> = {
  godkendt: "Godkendt og udgivet",
  afvist: "Afvist",
  automatiskKørsel: "Automatisk kørsel",
  tilbudSendt: "Tilbud sendt",
  leveret: "Leveret",
};
