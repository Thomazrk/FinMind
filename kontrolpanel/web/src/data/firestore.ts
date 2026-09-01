import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ActivityEntry, Automation, Customer, MonthlyUsage, Settings, Site, Task } from "../types";

/** Firestore hands back Timestamp objects; the UI wants plain ISO strings. */
function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function withId<T>(
  snap: QueryDocumentSnapshot<DocumentData>,
  shape: (data: DocumentData) => Omit<T, "id">,
): T {
  return { id: snap.id, ...shape(snap.data()) } as T;
}

export type Unsubscribe = () => void;
type OnData<T> = (value: T) => void;
type OnError = (error: unknown) => void;

export function watchCustomers(onData: OnData<Customer[]>, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db(), "kunder"), orderBy("navn")),
    (snap) =>
      onData(
        snap.docs.map((d) =>
          withId<Customer>(d, (data) => ({
            navn: data.navn ?? "(uden navn)",
            slackKanalId: data.slackKanalId ?? "",
            repo: data.repo ?? "",
            domæne: data.domæne ?? "",
            pakke: data.pakke ?? "",
            månedspris: Number(data.månedspris ?? 0),
            fornyelsesdato: toIso(data.fornyelsesdato) ?? "",
            supportMinutterDenneMåned: Number(data.supportMinutterDenneMåned ?? 0),
            supportMinutterPrMåned:
              data.supportMinutterPrMåned == null ? null : Number(data.supportMinutterPrMåned),
          })),
        ),
      ),
    onError,
  );
}

export function watchSites(onData: OnData<Site[]>, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db(), "sider"), orderBy("produktionsUrl")),
    (snap) =>
      onData(
        snap.docs.map((d) =>
          withId<Site>(d, (data) => ({
            kundeId: data.kundeId ?? "",
            repo: data.repo ?? "",
            produktionsUrl: data.produktionsUrl ?? "",
            sidsteDeploy: toIso(data.sidsteDeploy),
            status: data.status ?? "live",
            forhåndsvisningsUrl: data.forhåndsvisningsUrl ?? null,
          })),
        ),
      ),
    onError,
  );
}

export function watchTasks(onData: OnData<Task[]>, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db(), "opgaver"), orderBy("modtagetTidspunkt", "desc")),
    (snap) =>
      onData(
        snap.docs.map((d) =>
          withId<Task>(d, (data) => ({
            kundeId: data.kundeId ?? "",
            sideId: data.sideId ?? "",
            slackBeskedId: data.slackBeskedId ?? "",
            slackPermalink: data.slackPermalink ?? "",
            beskedTekst: data.beskedTekst ?? "",
            afsender: data.afsender ?? "ukendt",
            modtagetTidspunkt: toIso(data.modtagetTidspunkt) ?? "",
            resumé: data.resumé ?? "",
            klassifikation: {
              type: data.klassifikation?.type ?? "andet",
              estimatMinutter: Number(data.klassifikation?.estimatMinutter ?? 0),
              dækketAfAbonnement: Boolean(data.klassifikation?.dækketAfAbonnement),
            },
            status: data.status ?? "afventer",
            branch: data.branch ?? null,
            prUrl: data.prUrl ?? null,
            previewUrl: data.previewUrl ?? null,
            diff: Array.isArray(data.diff) ? data.diff : [],
            forbrug: {
              inputTokens: Number(data.forbrug?.inputTokens ?? 0),
              outputTokens: Number(data.forbrug?.outputTokens ?? 0),
              kroner: Number(data.forbrug?.kroner ?? 0),
            },
            afgjortAf: data.afgjortAf ?? null,
            afgjortTidspunkt: toIso(data.afgjortTidspunkt),
            afvisningsårsag: data.afvisningsårsag ?? null,
          })),
        ),
      ),
    onError,
  );
}

export function watchActivity(onData: OnData<ActivityEntry[]>, onError: OnError, limit = 200): Unsubscribe {
  return onSnapshot(
    query(collection(db(), "aktivitet"), orderBy("tidspunkt", "desc")),
    (snap) =>
      onData(
        snap.docs.slice(0, limit).map((d) =>
          withId<ActivityEntry>(d, (data) => ({
            tidspunkt: toIso(data.tidspunkt) ?? "",
            handling: data.handling ?? "automatiskKørsel",
            opgaveId: data.opgaveId ?? null,
            kundeId: data.kundeId ?? null,
            udførtAf: data.udførtAf ?? "automatik",
            detalje: data.detalje ?? "",
          })),
        ),
      ),
    onError,
  );
}

export function watchMonthlyUsage(
  monthId: string,
  onData: OnData<MonthlyUsage | null>,
  onError: OnError,
): Unsubscribe {
  return onSnapshot(
    doc(db(), "forbrug", monthId),
    (snap) => {
      if (!snap.exists()) return onData(null);
      const data = snap.data();
      onData({
        id: snap.id,
        totalTokens: Number(data.totalTokens ?? 0),
        totalKroner: Number(data.totalKroner ?? 0),
        perKunde: (data.perKunde ?? {}) as Record<string, number>,
      });
    },
    onError,
  );
}

export function watchUsageMonths(onData: OnData<MonthlyUsage[]>, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db(), "forbrug"),
    (snap) =>
      onData(
        snap.docs
          .map((d) => ({
            id: d.id,
            totalTokens: Number(d.data().totalTokens ?? 0),
            totalKroner: Number(d.data().totalKroner ?? 0),
            perKunde: (d.data().perKunde ?? {}) as Record<string, number>,
          }))
          .sort((a, b) => b.id.localeCompare(a.id)),
      ),
    onError,
  );
}

export function watchCustomerTasks(
  customerId: string,
  onData: OnData<Task[]>,
  onError: OnError,
): Unsubscribe {
  return onSnapshot(
    query(collection(db(), "opgaver"), where("kundeId", "==", customerId)),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)),
    onError,
  );
}

export function watchAutomation(onData: OnData<Automation>, onError: OnError): Unsubscribe {
  return onSnapshot(
    doc(db(), "system", "automatik"),
    (snap) => {
      const data = snap.data() ?? {};
      onData({
        pauseret: Boolean(data.pauseret),
        pausetAf: data.pausetAf ?? null,
        pausetTidspunkt: toIso(data.pausetTidspunkt),
        årsag: data.årsag ?? null,
        pausedeKunder: Array.isArray(data.pausedeKunder) ? data.pausedeKunder : [],
        månedsbudgetKroner:
          data.månedsbudgetKroner == null ? null : Number(data.månedsbudgetKroner),
      });
    },
    onError,
  );
}

export function watchSettings(onData: OnData<Settings>, onError: OnError): Unsubscribe {
  return onSnapshot(
    doc(db(), "system", "indstillinger"),
    (snap) => {
      const data = snap.data() ?? {};
      onData({ timepris: data.timepris == null ? null : Number(data.timepris) });
    },
    onError,
  );
}

/**
 * The emergency stop. Pausing is always allowed; starting again is the
 * direction that needs a deliberate click, which is why both go through here
 * and both land in the activity log.
 */
export async function setAutomationPause(
  paused: boolean,
  reason: string,
  changedBy: string,
): Promise<void> {
  if (paused && !reason.trim()) {
    throw new Error("Skriv hvorfor du sætter automatikken på pause — det bliver logget.");
  }

  await setDoc(
    doc(db(), "system", "automatik"),
    {
      pauseret: paused,
      pausetAf: paused ? changedBy : null,
      pausetTidspunkt: paused ? serverTimestamp() : null,
      årsag: paused ? reason.trim() : null,
    },
    { merge: true },
  );

  await addDoc(collection(db(), "aktivitet"), {
    tidspunkt: serverTimestamp(),
    handling: paused ? "automatikPauset" : "automatikGenstartet",
    opgaveId: null,
    kundeId: null,
    udførtAf: changedBy,
    detalje: paused ? `Automatikken sat på pause — ${reason.trim()}` : "Automatikken kører igen",
  });
}

/** Pausing one customer while the rest keep running. */
export async function setCustomerPause(
  customerId: string,
  paused: boolean,
  changedBy: string,
): Promise<void> {
  await setDoc(
    doc(db(), "system", "automatik"),
    { pausedeKunder: paused ? arrayUnion(customerId) : arrayRemove(customerId) },
    { merge: true },
  );

  await addDoc(collection(db(), "aktivitet"), {
    tidspunkt: serverTimestamp(),
    handling: paused ? "automatikPauset" : "automatikGenstartet",
    opgaveId: null,
    kundeId: customerId,
    udførtAf: changedBy,
    detalje: paused
      ? "Automatikken sat på pause for denne kunde"
      : "Automatikken kører igen for denne kunde",
  });
}

export async function setMonthlyBudget(kroner: number | null, changedBy: string): Promise<void> {
  if (kroner !== null && (!Number.isFinite(kroner) || kroner < 0)) {
    throw new Error("Budgetloftet skal være et positivt beløb, eller tomt for intet loft.");
  }

  await setDoc(doc(db(), "system", "automatik"), { månedsbudgetKroner: kroner }, { merge: true });

  await addDoc(collection(db(), "aktivitet"), {
    tidspunkt: serverTimestamp(),
    handling: "automatiskKørsel",
    opgaveId: null,
    kundeId: null,
    udførtAf: changedBy,
    detalje:
      kroner === null
        ? "Budgetloft fjernet"
        : `Budgetloft sat til ${kroner.toLocaleString("da-DK")} kr. om måneden`,
  });
}

export interface Decision {
  taskId: string;
  approved: boolean;
  rejectionReason?: string;
  decidedBy: string;
}

/**
 * Records my decision on a task. This is the ONLY way a task leaves "afventer".
 *
 * Note what this does NOT do: it does not merge the branch, it does not deploy,
 * and it does not post to Slack. Those steps belong to backend workers that react
 * to status === "godkendt". Nothing reaches a customer site without this write
 * happening first, by hand.
 */
export async function decideTask(decision: Decision): Promise<void> {
  const { taskId, approved, rejectionReason, decidedBy } = decision;
  if (!approved && !rejectionReason?.trim()) {
    throw new Error("En afvisning skal have en årsag — den bliver logget på opgaven.");
  }

  const ref = doc(db(), "opgaver", taskId);
  const current = await getDoc(ref);
  if (!current.exists()) {
    throw new Error(`Opgaven ${taskId} findes ikke længere i Firestore.`);
  }
  if (current.data().status !== "afventer") {
    throw new Error(
      `Opgaven er allerede afgjort (status: ${current.data().status}). Genindlæs panelet for at se den nyeste tilstand.`,
    );
  }

  await updateDoc(ref, {
    status: approved ? "godkendt" : "afvist",
    afgjortAf: decidedBy,
    afgjortTidspunkt: serverTimestamp(),
    afvisningsårsag: approved ? null : rejectionReason!.trim(),
  });

  await addDoc(collection(db(), "aktivitet"), {
    tidspunkt: serverTimestamp(),
    handling: approved ? "godkendt" : "afvist",
    opgaveId: taskId,
    kundeId: current.data().kundeId ?? null,
    udførtAf: decidedBy,
    detalje: approved
      ? `Godkendt til udgivelse — branch ${current.data().branch ?? "(ingen)"}`
      : `Afvist — ${rejectionReason!.trim()}`,
  });
}
