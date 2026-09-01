import { useCallback, useMemo } from "react";
import { watchActivity, watchCustomers } from "../data/firestore";
import { useSubscription } from "../data/useData";
import { ErrorNotice } from "../components/ErrorNotice";
import { EmptyState, Loading } from "../components/States";
import { formatRelative, formatTimestamp } from "../lib/format";
import { activityLabel } from "../lib/labels";
import type { ActivityEntry, Customer } from "../types";

export default function ActivityPage() {
  const log = useSubscription<ActivityEntry[]>(useCallback((d, e) => watchActivity(d, e), []));
  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));

  const customerNames = useMemo(() => {
    const map = new Map<string, string>();
    (customers.data ?? []).forEach((c) => map.set(c.id, c.navn));
    return map;
  }, [customers.data]);

  if (log.error) return <ErrorNotice error={log.error} />;
  if (log.loading) return <Loading what="aktivitet" />;

  const entries = log.data ?? [];
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Loggen er tom"
        explanation="Godkendelser, afvisninger og automatiske kørsler skrives til samlingen aktivitet efterhånden som de sker."
      />
    );
  }

  return (
    <ol className="log">
      {entries.map((entry) => (
        <li className={`log-entry log-${entry.handling}`} key={entry.id}>
          <div className="log-head">
            <span className="log-action">{activityLabel[entry.handling] ?? entry.handling}</span>
            <span className="mono muted">{formatTimestamp(entry.tidspunkt)}</span>
          </div>
          <p className="log-detail">{entry.detalje}</p>
          <p className="muted log-meta">
            {entry.udførtAf} · {formatRelative(entry.tidspunkt)}
            {entry.kundeId && ` · ${customerNames.get(entry.kundeId) ?? entry.kundeId}`}
            {entry.opgaveId && (
              <>
                {" · "}
                <span className="mono">opgaver/{entry.opgaveId}</span>
              </>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
