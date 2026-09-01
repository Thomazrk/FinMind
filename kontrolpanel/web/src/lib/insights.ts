/**
 * Pure derivations behind the "I dag" screen and the customer page.
 *
 * Kept out of the components so the arithmetic that decides what needs my
 * attention can be tested on its own.
 */
import type { Customer, MonthlyUsage, Site, Task } from "../types";

export function daysUntil(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const startOfDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((startOfDay(then) - startOfDay(now)) / 86_400_000);
}

export interface Renewal {
  customer: Customer;
  days: number;
}

/** Renewals due within `withinDays` — including ones already overdue. */
export function upcomingRenewals(
  customers: Customer[],
  withinDays = 30,
  now: Date = new Date(),
): Renewal[] {
  return customers
    .map((customer) => ({ customer, days: daysUntil(customer.fornyelsesdato, now) }))
    .filter((r): r is Renewal => r.days !== null && r.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

export interface SupportUsage {
  used: number;
  included: number | null;
  /** 0–1 against the package, or null when the package has no stated ceiling. */
  ratio: number | null;
  over: boolean;
}

export function supportUsage(customer: Customer): SupportUsage {
  const used = customer.supportMinutterDenneMåned;
  const included = customer.supportMinutterPrMåned ?? null;
  if (included === null || included <= 0) {
    return { used, included, ratio: null, over: false };
  }
  return { used, included, ratio: used / included, over: used > included };
}

export interface Economics {
  månedspris: number;
  /** Tokens spent on this customer this month. */
  aiKroner: number;
  /** Support minutes valued at the hourly rate, when one is set. */
  tidKroner: number | null;
  /** What is left of the subscription once AI and time are paid for. */
  tilbage: number | null;
}

export function customerEconomics(
  customer: Customer,
  aiKroner: number,
  timepris: number | null,
): Economics {
  const tidKroner =
    timepris === null ? null : (customer.supportMinutterDenneMåned / 60) * timepris;
  return {
    månedspris: customer.månedspris,
    aiKroner,
    tidKroner,
    tilbage: tidKroner === null ? null : customer.månedspris - aiKroner - tidKroner,
  };
}

export function customerSpendThisMonth(usage: MonthlyUsage | undefined, customerId: string): number {
  return usage?.perKunde?.[customerId] ?? 0;
}

export interface BudgetState {
  cap: number | null;
  spend: number;
  ratio: number | null;
  over: boolean;
}

export function budgetState(spend: number, cap: number | null): BudgetState {
  if (cap === null || cap <= 0) return { cap, spend, ratio: null, over: false };
  return { cap, spend, ratio: spend / cap, over: spend >= cap };
}

/** Sites that are not simply live and running. */
export function sitesNeedingAttention(sites: Site[]): Site[] {
  return sites.filter((s) => s.status === "nede" || s.status === "underOpbygning");
}

export function pendingTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === "afventer");
}

/** Quotes sent that nobody has come back to. */
export function awaitingQuote(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === "tilbudSendt");
}

export function customersOverSupport(customers: Customer[]): Customer[] {
  return customers.filter((c) => supportUsage(c).over);
}
