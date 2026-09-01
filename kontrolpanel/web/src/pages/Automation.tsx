import { useCallback, useState } from "react";
import {
  setAutomationPause,
  setMonthlyBudget,
  watchAutomation,
  watchUsageMonths,
} from "../data/firestore";
import { useSubscription } from "../data/useData";
import { useAuth } from "../auth";
import { ErrorNotice } from "../components/ErrorNotice";
import { Loading } from "../components/States";
import { translateError, type AppError } from "../lib/errors";
import { budgetState } from "../lib/insights";
import { currentMonthId, formatCurrency, formatTimestamp } from "../lib/format";
import type { Automation, MonthlyUsage } from "../types";

export default function AutomationPage() {
  const automation = useSubscription<Automation>(useCallback((d, e) => watchAutomation(d, e), []));
  const months = useSubscription<MonthlyUsage[]>(useCallback((d, e) => watchUsageMonths(d, e), []));
  const { user } = useAuth();

  const [reason, setReason] = useState("");
  const [budgetField, setBudgetField] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  if (automation.error) return <ErrorNotice error={automation.error} />;
  if (automation.loading) return <Loading what="automatikkens tilstand" />;

  const state = automation.data ?? {
    pauseret: false,
    pausetAf: null,
    pausetTidspunkt: null,
    årsag: null,
    pausedeKunder: [],
    månedsbudgetKroner: null,
  };

  const spend = (months.data ?? []).find((m) => m.id === currentMonthId())?.totalKroner ?? 0;
  const budget = budgetState(spend, state.månedsbudgetKroner);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(translateError(e));
    } finally {
      setBusy(false);
    }
  };

  const saveBudget = () => {
    const raw = (budgetField ?? "").trim().replace(",", ".");
    const value = raw === "" ? null : Number(raw);
    if (value !== null && Number.isNaN(value)) {
      setError({
        whatHappened: `"${raw}" er ikke et tal.`,
        whatToDo: "Skriv et beløb i kroner, eller lad feltet stå tomt for intet loft.",
      });
      return;
    }
    void run(async () => {
      await setMonthlyBudget(value, user?.email ?? "ukendt bruger");
      setBudgetField(null);
    });
  };

  return (
    <>
      {error && <ErrorNotice error={error} />}

      <section className={`panel stop ${state.pauseret ? "stop-paused" : "stop-running"}`}>
        <h3>{state.pauseret ? "Automatikken er stoppet" : "Automatikken kører"}</h3>
        {state.pauseret ? (
          <>
            <p>
              Ingen beskeder bliver klassificeret, og der bliver ikke bygget ændringer — for nogen
              kunde. Forslag der allerede ligger og venter, kan du stadig godkende.
            </p>
            <dl className="raw raw-flat">
              <dt>Stoppet af</dt>
              <dd>{state.pausetAf ?? "—"}</dd>
              <dt>Tidspunkt</dt>
              <dd>{formatTimestamp(state.pausetTidspunkt)}</dd>
              <dt>Årsag</dt>
              <dd>{state.årsag ?? "—"}</dd>
            </dl>
            <div className="actions">
              <button
                type="button"
                className="button button-approve"
                disabled={busy}
                onClick={() => void run(() => setAutomationPause(false, "", user?.email ?? "ukendt bruger"))}
              >
                {busy ? "Gemmer …" : "Start automatikken igen"}
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await setAutomationPause(true, reason, user?.email ?? "ukendt bruger");
                setReason("");
              });
            }}
          >
            <p>
              Slack-lytteren, klassificeringen og ændringsbyggeren kører. Stopper du dem her, rører
              intet automatisk ved nogen kunde, før du starter igen.
            </p>
            <label htmlFor="reason">Hvorfor stopper du?</label>
            <textarea
              id="reason"
              rows={2}
              required
              value={reason}
              placeholder="Bliver gemt på stoppet og i aktivitetsloggen."
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="actions">
              <button
                type="submit"
                className="button button-reject"
                disabled={busy || reason.trim().length === 0}
              >
                {busy ? "Gemmer …" : "Stop al automatik"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel">
        <h3>Budgetloft for måneden</h3>
        <p className="muted">
          Når månedens tokenforbrug når loftet, skal arbejderne stoppe af sig selv. Tomt felt betyder
          intet loft.
        </p>

        {budget.cap !== null && (
          <div className={`meter${budget.over ? " meter-over" : ""}`}>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${Math.min(budget.ratio ?? 0, 1) * 100}%` }} />
            </div>
            <p className="meter-text">
              {formatCurrency(budget.spend)} af {formatCurrency(budget.cap)} brugt
              {budget.over && " · loftet er nået"}
            </p>
          </div>
        )}

        <form
          className="budget-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveBudget();
          }}
        >
          <label htmlFor="budget">Loft i kroner</label>
          <div className="budget-row">
            <input
              id="budget"
              inputMode="decimal"
              value={budgetField ?? (state.månedsbudgetKroner ?? "")}
              placeholder="fx 400"
              onChange={(e) => setBudgetField(e.target.value)}
            />
            <button type="submit" className="button button-secondary" disabled={busy}>
              {busy ? "Gemmer …" : "Gem loft"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Sådan bliver stoppet håndhævet</h3>
        <p>
          Knappen her skriver til <span className="mono">system/automatik</span>. Den stopper ikke
          noget af sig selv — hver baggrundsarbejder skal læse dokumentet, før den går i gang, og
          holde sig i ro hvis <span className="mono">pauseret</span> er sat, hvis kunden står i{" "}
          <span className="mono">pausedeKunder</span>, eller hvis månedens forbrug har nået{" "}
          <span className="mono">månedsbudgetKroner</span>.
        </p>
        <p className="muted">
          Firestore-regler kan ikke tvinge det igennem: arbejderne kører på Admin SDK'et, som går uden
          om reglerne. Kontrakten står i kontrolpanel/README.md, og trin 2–4 skal følge den.
        </p>
      </section>
    </>
  );
}
