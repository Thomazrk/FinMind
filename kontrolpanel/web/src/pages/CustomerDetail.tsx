import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  setCustomerPause,
  watchAutomation,
  watchCustomers,
  watchSettings,
  watchSites,
  watchTasks,
  watchUsageMonths,
} from "../data/firestore";
import { useSubscription } from "../data/useData";
import { useAuth } from "../auth";
import { ErrorNotice } from "../components/ErrorNotice";
import { EmptyState, Loading } from "../components/States";
import { SupportMeter } from "../components/SupportMeter";
import { TaskBadge } from "../components/StatusBadge";
import { translateError, type AppError } from "../lib/errors";
import {
  currentMonthId,
  formatCurrency,
  formatDate,
  formatMinutes,
  formatRelative,
  formatTimestamp,
} from "../lib/format";
import {
  customerEconomics,
  customerSpendThisMonth,
  daysUntil,
  supportUsage,
} from "../lib/insights";
import { taskTypeLabel } from "../lib/labels";
import type { Automation, Customer, MonthlyUsage, Settings, Site, Task } from "../types";

export default function CustomerDetailPage() {
  const { kundeId } = useParams<{ kundeId: string }>();
  const { user } = useAuth();

  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));
  const sites = useSubscription<Site[]>(useCallback((d, e) => watchSites(d, e), []));
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const months = useSubscription<MonthlyUsage[]>(useCallback((d, e) => watchUsageMonths(d, e), []));
  const automation = useSubscription<Automation>(useCallback((d, e) => watchAutomation(d, e), []));
  const settings = useSubscription<Settings>(useCallback((d, e) => watchSettings(d, e), []));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const now = useMemo(() => new Date(), []);

  if (customers.error) return <ErrorNotice error={customers.error} />;
  if (customers.loading) return <Loading what="kunden" />;

  const customer = (customers.data ?? []).find((c) => c.id === kundeId);
  if (!customer) {
    return (
      <EmptyState
        title="Den kunde findes ikke"
        explanation={`Der er intet dokument på kunder/${kundeId}. Gå tilbage til kundelisten og vælg en anden.`}
      />
    );
  }

  const usage = supportUsage(customer);
  const days = daysUntil(customer.fornyelsesdato, now);
  const thisMonth = (months.data ?? []).find((m) => m.id === currentMonthId(now));
  const aiKroner = customerSpendThisMonth(thisMonth, customer.id);
  const economics = customerEconomics(customer, aiKroner, settings.data?.timepris ?? null);
  const customerSites = (sites.data ?? []).filter((s) => s.kundeId === customer.id);
  const customerTasks = (tasks.data ?? []).filter((t) => t.kundeId === customer.id);
  const paused = (automation.data?.pausedeKunder ?? []).includes(customer.id);

  const togglePause = async () => {
    setBusy(true);
    setError(null);
    try {
      await setCustomerPause(customer.id, !paused, user?.email ?? "ukendt bruger");
    } catch (e) {
      setError(translateError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="crumb">
        <Link to="/kunder">Kunder</Link> · {customer.navn}
      </p>

      <header className="customer-head">
        <div>
          <h2 className="customer-title">{customer.navn}</h2>
          <p className="muted">
            {customer.pakke} · {formatCurrency(customer.månedspris)} om måneden
          </p>
        </div>
        {paused && <span className="badge badge-paused">Automatik på pause</span>}
      </header>

      {error && <ErrorNotice error={error} />}

      <section className="panel">
        <h3>Support denne måned</h3>
        <SupportMeter usage={usage} />
      </section>

      <section className="panel">
        <h3>Hvad kunden er værd denne måned</h3>
        <dl className="raw raw-flat">
          <dt>Abonnement</dt>
          <dd>{formatCurrency(economics.månedspris)}</dd>
          <dt>AI-forbrug</dt>
          <dd>− {formatCurrency(economics.aiKroner)}</dd>
          <dt>Din tid</dt>
          <dd>
            {economics.tidKroner === null ? (
              <span className="muted">
                sæt timepris på <span className="mono">system/indstillinger</span> for at regne den med
              </span>
            ) : (
              <>
                − {formatCurrency(economics.tidKroner)}
                <span className="muted"> · {formatMinutes(usage.used)}</span>
              </>
            )}
          </dd>
          <dt>Tilbage</dt>
          <dd>
            {economics.tilbage === null ? (
              <span className="muted">—</span>
            ) : (
              <strong className={economics.tilbage < 0 ? "negative" : undefined}>
                {formatCurrency(economics.tilbage)}
              </strong>
            )}
          </dd>
        </dl>
      </section>

      <section className="panel">
        <h3>Aftale</h3>
        <dl className="raw raw-flat">
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
          <dt>Repo</dt>
          <dd className="mono">{customer.repo || "—"}</dd>
          <dt>Slack-kanal</dt>
          <dd className="mono">{customer.slackKanalId || "—"}</dd>
          <dt>Dokument</dt>
          <dd className="mono muted">kunder/{customer.id}</dd>
        </dl>
      </section>

      <section className="panel">
        <h3>Sider</h3>
        {customerSites.length === 0 ? (
          <p className="note">Ingen sider på denne kunde.</p>
        ) : (
          <ul className="plain-list">
            {customerSites.map((site) => (
              <li key={site.id}>
                <a href={site.produktionsUrl} target="_blank" rel="noreferrer noopener">
                  {site.produktionsUrl}
                </a>
                <span className="muted">
                  {" "}
                  · sidste deploy {formatTimestamp(site.sidsteDeploy)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h3>Historik</h3>
        {customerTasks.length === 0 ? (
          <p className="note">Ingen opgaver registreret på denne kunde endnu.</p>
        ) : (
          <div className="table-frame">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Modtaget</th>
                  <th scope="col">Opgave</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="figure">
                    Estimat
                  </th>
                  <th scope="col" className="figure">
                    AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {customerTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      {formatTimestamp(task.modtagetTidspunkt)}
                      <span className="muted"> · {formatRelative(task.modtagetTidspunkt)}</span>
                    </td>
                    <td>
                      {task.resumé || task.beskedTekst.slice(0, 60)}
                      <span className="mono muted"> {taskTypeLabel[task.klassifikation.type]}</span>
                    </td>
                    <td>
                      <TaskBadge status={task.status} />
                      {task.afvisningsårsag && (
                        <p className="muted small">{task.afvisningsårsag}</p>
                      )}
                    </td>
                    <td className="figure">{formatMinutes(task.klassifikation.estimatMinutter)}</td>
                    <td className="figure">{formatCurrency(task.forbrug.kroner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Automatik for denne kunde</h3>
        <p className="muted">
          {paused
            ? "Sat på pause. Klassificering og ændringsbygger skal springe denne kunde over, indtil du starter den igen."
            : "Kører. Beskeder fra kundens Slack-kanal bliver klassificeret, og ændringer under grænsen bliver bygget som forslag."}
        </p>
        <div className="actions">
          <button
            type="button"
            className={`button ${paused ? "button-approve" : "button-reject"}`}
            disabled={busy}
            onClick={() => void togglePause()}
          >
            {busy ? "Gemmer …" : paused ? "Start automatikken igen" : "Sæt automatikken på pause"}
          </button>
        </div>
      </section>
    </>
  );
}
