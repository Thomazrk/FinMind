import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  watchAutomation,
  watchCustomers,
  watchSites,
  watchTasks,
  watchUsageMonths,
} from "../data/firestore";
import { useSubscription } from "../data/useData";
import { ErrorNotice } from "../components/ErrorNotice";
import { Loading } from "../components/States";
import {
  awaitingQuote,
  budgetState,
  customersOverSupport,
  pendingTasks,
  sitesNeedingAttention,
  supportUsage,
  upcomingRenewals,
} from "../lib/insights";
import { currentMonthId, formatCurrency, formatDate, formatMinutesOf } from "../lib/format";
import { siteStatusLabel } from "../lib/labels";
import type { Automation, Customer, MonthlyUsage, Site, Task } from "../types";

/**
 * One row per thing that wants me. A row only exists when there is something to
 * act on — an empty day shows an empty list, not a wall of zeroes.
 */
function Row({
  to,
  what,
  detail,
  tone = "normal",
}: {
  to: string;
  what: string;
  detail: string;
  tone?: "normal" | "waiting" | "bad";
}) {
  return (
    <li className={`today-row today-${tone}`}>
      <Link to={to}>
        <span className="today-what">{what}</span>
        <span className="today-detail">{detail}</span>
      </Link>
    </li>
  );
}

export default function TodayPage() {
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));
  const sites = useSubscription<Site[]>(useCallback((d, e) => watchSites(d, e), []));
  const months = useSubscription<MonthlyUsage[]>(useCallback((d, e) => watchUsageMonths(d, e), []));
  const automation = useSubscription<Automation>(useCallback((d, e) => watchAutomation(d, e), []));

  const now = useMemo(() => new Date(), []);

  if (tasks.error) return <ErrorNotice error={tasks.error} />;
  if (tasks.loading || customers.loading) return <Loading what="dagens overblik" />;

  const allTasks = tasks.data ?? [];
  const allCustomers = customers.data ?? [];
  const allSites = sites.data ?? [];
  const thisMonth = (months.data ?? []).find((m) => m.id === currentMonthId(now));

  const pending = pendingTasks(allTasks);
  const quotes = awaitingQuote(allTasks);
  const broken = sitesNeedingAttention(allSites);
  const renewals = upcomingRenewals(allCustomers, 30, now);
  const overSupport = customersOverSupport(allCustomers);
  const budget = budgetState(thisMonth?.totalKroner ?? 0, automation.data?.månedsbudgetKroner ?? null);
  const pausedCustomers = automation.data?.pausedeKunder ?? [];

  const rows = [
    pending.length > 0 && (
      <Row
        key="pending"
        to="/afventer"
        tone="waiting"
        what={`${pending.length} ${pending.length === 1 ? "forslag venter" : "forslag venter"} på dig`}
        detail={pending
          .slice(0, 3)
          .map((t) => allCustomers.find((c) => c.id === t.kundeId)?.navn ?? t.kundeId)
          .join(", ")}
      />
    ),
    broken.length > 0 && (
      <Row
        key="sites"
        to="/sider"
        tone="bad"
        what={`${broken.length} ${broken.length === 1 ? "side" : "sider"} er ikke live`}
        detail={broken.map((s) => `${s.produktionsUrl} (${siteStatusLabel[s.status]})`).join(", ")}
      />
    ),
    budget.over && (
      <Row
        key="budget"
        to="/forbrug"
        tone="bad"
        what="Månedens budgetloft er nået"
        detail={`${formatCurrency(budget.spend)} af ${formatCurrency(budget.cap!)} — automatikken skal stoppe`}
      />
    ),
    overSupport.length > 0 && (
      <Row
        key="support"
        to="/kunder"
        tone="waiting"
        what={`${overSupport.length} ${overSupport.length === 1 ? "kunde" : "kunder"} over sine supportminutter`}
        detail={overSupport
          .map((c) => {
            const u = supportUsage(c);
            return `${c.navn}: ${formatMinutesOf(u.used, u.included!)}`;
          })
          .join(", ")}
      />
    ),
    renewals.length > 0 && (
      <Row
        key="renewals"
        to="/kunder"
        what={`${renewals.length} ${renewals.length === 1 ? "fornyelse" : "fornyelser"} inden for 30 dage`}
        detail={renewals
          .map(
            ({ customer, days }) =>
              `${customer.navn} ${days < 0 ? `${Math.abs(days)} dage over` : days === 0 ? "i dag" : `om ${days} dage`}`,
          )
          .join(", ")}
      />
    ),
    quotes.length > 0 && (
      <Row
        key="quotes"
        to="/afventer"
        what={`${quotes.length} ${quotes.length === 1 ? "tilbud" : "tilbud"} sendt uden svar`}
        detail={quotes
          .map((t) => allCustomers.find((c) => c.id === t.kundeId)?.navn ?? t.kundeId)
          .join(", ")}
      />
    ),
    pausedCustomers.length > 0 && (
      <Row
        key="paused"
        to="/kunder"
        tone="waiting"
        what={`Automatikken er på pause for ${pausedCustomers.length} ${pausedCustomers.length === 1 ? "kunde" : "kunder"}`}
        detail={pausedCustomers
          .map((id) => allCustomers.find((c) => c.id === id)?.navn ?? id)
          .join(", ")}
      />
    ),
  ].filter(Boolean);

  return (
    <>
      {rows.length > 0 ? (
        <ul className="today">{rows}</ul>
      ) : (
        <div className="empty">
          <p className="empty-title">Ingenting kræver dig lige nu</p>
          <p className="empty-explanation">
            Ingen forslag venter, alle sider er live, og ingen fornyelser er tæt på. Panelet siger til
            når noget ændrer sig.
          </p>
        </div>
      )}

      <h2>Måneden indtil nu</h2>
      <div className="totals">
        <div className="total">
          <p className="total-figure">
            {formatCurrency(allCustomers.reduce((sum, c) => sum + c.månedspris, 0))}
          </p>
          <p className="total-caption">
            fast om måneden fra {allCustomers.length} {allCustomers.length === 1 ? "kunde" : "kunder"}
          </p>
        </div>
        <div className="total">
          <p className="total-figure">{formatCurrency(thisMonth?.totalKroner ?? 0)}</p>
          <p className="total-caption">
            brugt på AI
            {budget.cap !== null && ` · loft ${formatCurrency(budget.cap)}`}
          </p>
        </div>
        <div className="total">
          <p className="total-figure">
            {allTasks.filter((t) => t.status === "godkendt" || t.status === "leveret").length}
          </p>
          <p className="total-caption">opgaver godkendt i alt</p>
        </div>
      </div>

      {renewals.length > 0 && (
        <>
          <h2>Næste fornyelser</h2>
          <div className="table-frame">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Kunde</th>
                  <th scope="col">Dato</th>
                  <th scope="col" className="figure">
                    Månedspris
                  </th>
                </tr>
              </thead>
              <tbody>
                {renewals.map(({ customer, days }) => (
                  <tr key={customer.id}>
                    <td>
                      <Link to={`/kunder/${customer.id}`}>{customer.navn}</Link>
                    </td>
                    <td>
                      {formatDate(customer.fornyelsesdato)}
                      <span className="muted">
                        {" "}
                        · {days < 0 ? `${Math.abs(days)} dage over` : days === 0 ? "i dag" : `om ${days} dage`}
                      </span>
                    </td>
                    <td className="figure">{formatCurrency(customer.månedspris)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
