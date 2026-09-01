import { useCallback, useMemo, useState } from "react";
import { watchCustomers, watchTasks, watchUsageMonths } from "../data/firestore";
import { useSubscription } from "../data/useData";
import { ErrorNotice } from "../components/ErrorNotice";
import { EmptyState, Loading } from "../components/States";
import { currentMonthId, formatCurrency, formatMonth, formatNumber } from "../lib/format";
import type { Customer, MonthlyUsage, Task } from "../types";

export default function UsagePage() {
  const months = useSubscription<MonthlyUsage[]>(useCallback((d, e) => watchUsageMonths(d, e), []));
  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const customerNames = useMemo(() => {
    const map = new Map<string, string>();
    (customers.data ?? []).forEach((c) => map.set(c.id, c.navn));
    return map;
  }, [customers.data]);

  if (months.error) return <ErrorNotice error={months.error} />;
  if (months.loading) return <Loading what="forbrug" />;

  const list = months.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        title="Ingen forbrugstal endnu"
        explanation="Samlingen forbrug er tom. Hver kørsel af klassificering og ændringsbygger skriver tokens og kroner hertil."
      />
    );
  }

  const month =
    list.find((m) => m.id === selectedMonth) ?? list.find((m) => m.id === currentMonthId()) ?? list[0];

  const perCustomer = Object.entries(month.perKunde).sort(([, a], [, b]) => b - a);

  /** Per-task lines for the selected month — the raw rows behind the totals. */
  const rows = (tasks.data ?? [])
    .filter((t) => t.modtagetTidspunkt.slice(0, 7) === month.id)
    .sort((a, b) => b.forbrug.kroner - a.forbrug.kroner);

  return (
    <>
      <div className="month-picker">
        <label htmlFor="month">Måned</label>
        <select id="month" value={month.id} onChange={(e) => setSelectedMonth(e.target.value)}>
          {list.map((m) => (
            <option key={m.id} value={m.id}>
              {formatMonth(m.id)}
            </option>
          ))}
        </select>
      </div>

      <div className="totals">
        <div className="total">
          <p className="total-figure">{formatCurrency(month.totalKroner)}</p>
          <p className="total-caption">brugt i {formatMonth(month.id)}</p>
        </div>
        <div className="total">
          <p className="total-figure">{formatNumber(month.totalTokens)}</p>
          <p className="total-caption">tokens i alt</p>
        </div>
      </div>

      <h2>Pr. kunde</h2>
      {perCustomer.length === 0 ? (
        <p className="note">Ingen kunder har forbrug denne måned.</p>
      ) : (
        <div className="table-frame">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Kunde</th>
                <th scope="col" className="figure">
                  Kroner
                </th>
                <th scope="col" className="figure">
                  Andel
                </th>
              </tr>
            </thead>
            <tbody>
              {perCustomer.map(([customerId, kroner]) => (
                <tr key={customerId}>
                  <td>
                    {customerNames.get(customerId) ?? customerId}
                    <span className="mono muted"> kunder/{customerId}</span>
                  </td>
                  <td className="figure">{formatCurrency(kroner)}</td>
                  <td className="figure">
                    {month.totalKroner > 0 ? `${((kroner / month.totalKroner) * 100).toFixed(1)} %` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Pr. opgave</h2>
      {rows.length === 0 ? (
        <p className="note">Ingen opgaver registreret i {formatMonth(month.id)}.</p>
      ) : (
        <div className="table-frame">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Opgave</th>
                <th scope="col" className="figure">
                  Input
                </th>
                <th scope="col" className="figure">
                  Output
                </th>
                <th scope="col" className="figure">
                  Kroner
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    {customerNames.get(t.kundeId) ?? t.kundeId}
                    <span className="mono muted"> opgaver/{t.id}</span>
                  </td>
                  <td className="figure mono">{formatNumber(t.forbrug.inputTokens)}</td>
                  <td className="figure mono">{formatNumber(t.forbrug.outputTokens)}</td>
                  <td className="figure">{formatCurrency(t.forbrug.kroner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
