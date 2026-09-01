/**
 * Demo stand-in for src/data/firestore.ts.
 *
 * Same function signatures, but the documents live in memory and start from
 * seed/data.json. Approving or rejecting updates the store and pushes to every
 * subscriber, exactly like an onSnapshot listener would — so the whole flow is
 * clickable without Firebase.
 */
import seed from "../../seed/data.json";
import { demoPreviewUrl } from "./demoSites";
import type {
  ActivityEntry,
  Automation,
  Customer,
  MonthlyUsage,
  Settings,
  Site,
  Task,
} from "../src/types";

export type Unsubscribe = () => void;
type OnData<T> = (value: T) => void;

const customers = seed.kunder as unknown as Customer[];
/** The cards keep the real domain; only the frame loads the stand-in page. */
const sites = (seed.sider as unknown as Site[]).map((site) => ({
  ...site,
  forhåndsvisningsUrl: demoPreviewUrl(site.id),
}));
let tasks = seed.opgaver as unknown as Task[];
let activity = seed.aktivitet as unknown as ActivityEntry[];
const usage = seed.forbrug as unknown as MonthlyUsage[];

const systemDocs = seed.system as unknown as Array<Record<string, unknown>>;
let automation = {
  ...(systemDocs.find((d) => d.id === "automatik") as unknown as Automation),
  pausedeKunder: [] as string[],
};
const settings = systemDocs.find((d) => d.id === "indstillinger") as unknown as Settings;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe<T>(read: () => T, onData: OnData<T>): Unsubscribe {
  const push = () => onData(read());
  listeners.add(push);
  push();
  return () => listeners.delete(push);
}

export function watchCustomers(onData: OnData<Customer[]>): Unsubscribe {
  return subscribe(() => [...customers].sort((a, b) => a.navn.localeCompare(b.navn, "da")), onData);
}

export function watchSites(onData: OnData<Site[]>): Unsubscribe {
  return subscribe(() => [...sites], onData);
}

export function watchTasks(onData: OnData<Task[]>): Unsubscribe {
  return subscribe(
    () => [...tasks].sort((a, b) => b.modtagetTidspunkt.localeCompare(a.modtagetTidspunkt)),
    onData,
  );
}

export function watchActivity(onData: OnData<ActivityEntry[]>): Unsubscribe {
  return subscribe(
    () => [...activity].sort((a, b) => b.tidspunkt.localeCompare(a.tidspunkt)),
    onData,
  );
}

export function watchUsageMonths(onData: OnData<MonthlyUsage[]>): Unsubscribe {
  return subscribe(() => [...usage].sort((a, b) => b.id.localeCompare(a.id)), onData);
}

export function watchMonthlyUsage(monthId: string, onData: OnData<MonthlyUsage | null>): Unsubscribe {
  return subscribe(() => usage.find((m) => m.id === monthId) ?? null, onData);
}

export function watchCustomerTasks(customerId: string, onData: OnData<Task[]>): Unsubscribe {
  return subscribe(() => tasks.filter((t) => t.kundeId === customerId), onData);
}

export function watchAutomation(onData: OnData<Automation>): Unsubscribe {
  return subscribe(() => automation, onData);
}

export function watchSettings(onData: OnData<Settings>): Unsubscribe {
  return subscribe(() => settings, onData);
}

export async function setAutomationPause(
  paused: boolean,
  reason: string,
  changedBy: string,
): Promise<void> {
  if (paused && !reason.trim()) {
    throw new Error("Skriv hvorfor du sætter automatikken på pause — det bliver logget.");
  }
  const now = new Date().toISOString();
  automation = {
    ...automation,
    pauseret: paused,
    pausetAf: paused ? changedBy : null,
    pausetTidspunkt: paused ? now : null,
    årsag: paused ? reason.trim() : null,
  };
  logActivity({
    handling: paused ? "automatikPauset" : "automatikGenstartet",
    kundeId: null,
    udførtAf: changedBy,
    detalje: paused ? `Automatikken sat på pause — ${reason.trim()}` : "Automatikken kører igen",
  });
  notify();
}

export async function setCustomerPause(
  customerId: string,
  paused: boolean,
  changedBy: string,
): Promise<void> {
  automation = {
    ...automation,
    pausedeKunder: paused
      ? [...automation.pausedeKunder, customerId]
      : automation.pausedeKunder.filter((id) => id !== customerId),
  };
  logActivity({
    handling: paused ? "automatikPauset" : "automatikGenstartet",
    kundeId: customerId,
    udførtAf: changedBy,
    detalje: paused
      ? "Automatikken sat på pause for denne kunde"
      : "Automatikken kører igen for denne kunde",
  });
  notify();
}

export async function setMonthlyBudget(kroner: number | null, changedBy: string): Promise<void> {
  if (kroner !== null && (!Number.isFinite(kroner) || kroner < 0)) {
    throw new Error("Budgetloftet skal være et positivt beløb, eller tomt for intet loft.");
  }
  automation = { ...automation, månedsbudgetKroner: kroner };
  logActivity({
    handling: "automatiskKørsel",
    kundeId: null,
    udførtAf: changedBy,
    detalje:
      kroner === null
        ? "Budgetloft fjernet"
        : `Budgetloft sat til ${kroner.toLocaleString("da-DK")} kr. om måneden`,
  });
  notify();
}

export interface Decision {
  taskId: string;
  approved: boolean;
  rejectionReason?: string;
  decidedBy: string;
}

function logActivity(entry: Omit<ActivityEntry, "id" | "tidspunkt" | "opgaveId"> & { opgaveId?: string | null }) {
  activity = [
    {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tidspunkt: new Date().toISOString(),
      opgaveId: entry.opgaveId ?? null,
      ...entry,
    } as ActivityEntry,
    ...activity,
  ];
}

export async function decideTask(decision: Decision): Promise<void> {
  const { taskId, approved, rejectionReason, decidedBy } = decision;
  if (!approved && !rejectionReason?.trim()) {
    throw new Error("En afvisning skal have en årsag — den bliver logget på opgaven.");
  }

  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Opgaven ${taskId} findes ikke længere i Firestore.`);
  if (task.status !== "afventer") {
    throw new Error(
      `Opgaven er allerede afgjort (status: ${task.status}). Genindlæs panelet for at se den nyeste tilstand.`,
    );
  }

  const now = new Date().toISOString();
  tasks = tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          status: approved ? "godkendt" : "afvist",
          afgjortAf: decidedBy,
          afgjortTidspunkt: now,
          afvisningsårsag: approved ? null : rejectionReason!.trim(),
        }
      : t,
  );

  logActivity({
    handling: approved ? "godkendt" : "afvist",
    opgaveId: taskId,
    kundeId: task.kundeId,
    udførtAf: decidedBy,
    detalje: approved
      ? `Godkendt til udgivelse — branch ${task.branch ?? "(ingen)"}`
      : `Afvist — ${rejectionReason!.trim()}`,
  });

  notify();
}
