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
import type { ActivityEntry, Customer, MonthlyUsage, Site, Task } from "../src/types";

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

export interface Decision {
  taskId: string;
  approved: boolean;
  rejectionReason?: string;
  decidedBy: string;
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

  activity = [
    {
      id: `demo-${Date.now()}`,
      tidspunkt: now,
      handling: approved ? "godkendt" : "afvist",
      opgaveId: taskId,
      kundeId: task.kundeId,
      udførtAf: decidedBy,
      detalje: approved
        ? `Godkendt til udgivelse — branch ${task.branch ?? "(ingen)"}`
        : `Afvist — ${rejectionReason!.trim()}`,
    },
    ...activity,
  ];

  notify();
}
