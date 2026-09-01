import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { watchAutomation, watchCustomers, watchTasks, watchUsageMonths } from "../data/firestore";
import { useSubscription } from "../data/useData";
import { ErrorNotice } from "../components/ErrorNotice";
import { EmptyState, Loading } from "../components/States";
import { SupportMeter } from "../components/SupportMeter";
import { currentMonthId, formatCurrency, formatDate } from "../lib/format";
import { customerSpendThisMonth, daysUntil, supportUsage } from "../lib/insights";
import type { Automation, Customer, MonthlyUsage, Task } from "../types";

export default function CustomersPage() {
  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const months = useSubscription<MonthlyUsage[]>(useCallback((d, e) => watchUsageMonths(d, e), []));
  const automation = useSubscription<Automation>(useCallback((d, e) => watchAutomation(d, e), []));

  const now = useMemo(() => new Date(), []);
  const thisMonth = (months.data ?? []).find((m) => m.id === currentMonthId(now));

  if (customers.error) return <ErrorNotice error={customers.error} />;
  if (customers.loading) return <Loading what="kunder" />;

  const list = customers.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        title="Ingen kunder i Firestore endnu"
        explanation="Opret dokumenter i samlingen kunder — eller kør `npm run seed` i kontrolpanel/seed for at lægge nogle håndindtastede eksempler ind."
      />
    );
  }

  const pending = (tasks.data ?? []).filter((t) => t.status === "afventer");
  const paused = automation.data?.pausedeKunder ?? [];
  const total = list.reduce((sum, c) => sum + c.månedspris, 0);

  return (
    <>
      <p className="counter">
        {list.length} {list.length === 1 ? "kunde" : "kunder"} · {formatCurrency(total)} fast om måneden
      </p>

      <div className="customer-list">
        {list.map((customer) => {
          const usage = supportUsage(customer);
          const days = daysUntil(customer.fornyelsesdato, now);
          const waiting = pending.filter((t) => t.kundeId === customer.id).length;
          return (
            <Link className="customer-row" to={`/kunder/${customer.id}`} key={customer.id}>
              <div className="customer-row-head">
                <span className="customer-name">{customer.navn}</span>
                <span className="muted">{customer.pakke}</span>
              </div>

              <SupportMeter usage={usage} />

              <dl className="raw raw-flat">
                <dt>Månedspris</dt>
                <dd>{formatCurrency(customer.månedspris)}</dd>
                <dt>AI denne måned</dt>
                <dd>{formatCurrency(customerSpendThisMonth(thisMonth, customer.id))}</dd>
                <dt>Fornyes</dt>
                <dd>
                  {formatDate(customer.fornyelsesdato)}
                  {days !== null && (
                    <span className="muted">
                      {" "}
                      · {days < 0 ? `${Math.abs(days)} dage over` : days === 0 ? "i dag" : `om ${days} dage`}
                    </span>
                  )}
                </dd>
                <dt>Domæne</dt>
                <dd className="mono">{customer.domæne || "—"}</dd>
              </dl>

              <div className="customer-flags">
                {waiting > 0 && <span className="badge badge-task-afventer">{waiting} venter</span>}
                {paused.includes(customer.id) && <span className="badge badge-paused">Automatik på pause</span>}
                {usage.over && <span className="badge badge-task-afvist">Over supportminutter</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
