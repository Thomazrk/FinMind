import { useCallback, useMemo, useState } from "react";
import { decideTask, watchCustomers, watchTasks } from "../data/firestore";
import { useSubscription } from "../data/useData";
import { useAuth } from "../auth";
import { Diff } from "../components/Diff";
import { ErrorNotice } from "../components/ErrorNotice";
import { EmptyState, Loading } from "../components/States";
import { translateError, type AppError } from "../lib/errors";
import {
  formatCurrency,
  formatMinutes,
  formatNumber,
  formatRelative,
  formatTimestamp,
} from "../lib/format";
import { taskTypeLabel } from "../lib/labels";
import type { Customer, Task } from "../types";

function Proposal({ task, customer }: { task: Task; customer: Customer | undefined }) {
  const { user } = useAuth();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const decide = async (approved: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await decideTask({
        taskId: task.id,
        approved,
        rejectionReason: approved ? undefined : reason,
        decidedBy: user?.email ?? "ukendt bruger",
      });
      setRejecting(false);
      setReason("");
    } catch (e) {
      setError(translateError(e));
    } finally {
      setBusy(false);
    }
  };

  const c = task.klassifikation;

  return (
    <article className="proposal">
      <header className="proposal-head">
        <div>
          <h2>{customer?.navn ?? task.kundeId}</h2>
          <p className="muted">
            {task.afsender} skrev {formatRelative(task.modtagetTidspunkt)} ·{" "}
            <span className="mono">{formatTimestamp(task.modtagetTidspunkt)}</span>
          </p>
        </div>
        {task.slackPermalink && (
          <a className="outlink" href={task.slackPermalink} target="_blank" rel="noreferrer noopener">
            Åbn i Slack
          </a>
        )}
      </header>

      <blockquote className="message">{task.beskedTekst}</blockquote>

      <p className="summary">{task.resumé || "Ændringsbyggeren har ikke skrevet et resumé."}</p>

      <dl className="raw raw-inline">
        <dt>Type</dt>
        <dd>{taskTypeLabel[c.type] ?? c.type}</dd>
        <dt>Estimat</dt>
        <dd>{formatMinutes(c.estimatMinutter)}</dd>
        <dt>Abonnement</dt>
        <dd>{c.dækketAfAbonnement ? "Dækket" : "Ikke dækket — kræver tilbud"}</dd>
        <dt>Branch</dt>
        <dd className="mono">{task.branch ?? "—"}</dd>
        <dt>Opgave</dt>
        <dd className="mono muted">opgaver/{task.id}</dd>
        <dt>Slack-besked</dt>
        <dd className="mono muted">{task.slackBeskedId || "—"}</dd>
      </dl>

      <Diff files={task.diff} />

      <div className="links">
        {task.previewUrl && (
          <a className="button button-secondary" href={task.previewUrl} target="_blank" rel="noreferrer noopener">
            Åbn preview
          </a>
        )}
        {task.prUrl && (
          <a className="button button-secondary" href={task.prUrl} target="_blank" rel="noreferrer noopener">
            Åbn pull request
          </a>
        )}
      </div>

      <p className="usage-line">
        Forslaget kostede {formatNumber(task.forbrug.inputTokens)} input-tokens og{" "}
        {formatNumber(task.forbrug.outputTokens)} output-tokens ={" "}
        <strong>{formatCurrency(task.forbrug.kroner)}</strong>
      </p>

      {error && <ErrorNotice error={error} />}

      {!rejecting ? (
        <div className="actions">
          <button type="button" className="button button-approve" disabled={busy} onClick={() => decide(true)}>
            {busy ? "Gemmer …" : "Godkend og udgiv"}
          </button>
          <button type="button" className="button button-reject" disabled={busy} onClick={() => setRejecting(true)}>
            Afvis
          </button>
        </div>
      ) : (
        <form
          className="reject-form"
          onSubmit={(e) => {
            e.preventDefault();
            void decide(false);
          }}
        >
          <label htmlFor={`reason-${task.id}`}>Hvorfor afviser du?</label>
          <textarea
            id={`reason-${task.id}`}
            value={reason}
            rows={2}
            required
            placeholder="Årsagen bliver gemt på opgaven og vist i aktivitetsloggen."
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="actions">
            <button type="submit" className="button button-reject" disabled={busy || reason.trim().length === 0}>
              {busy ? "Gemmer …" : "Afvis og slet branch"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
            >
              Fortryd
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export default function PendingPage() {
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));

  const customerById = useMemo(() => {
    const map = new Map<string, Customer>();
    (customers.data ?? []).forEach((c) => map.set(c.id, c));
    return map;
  }, [customers.data]);

  if (tasks.error) return <ErrorNotice error={tasks.error} />;
  if (tasks.loading) return <Loading what="forslag" />;

  const waiting = (tasks.data ?? []).filter((t) => t.status === "afventer");

  if (waiting.length === 0) {
    return (
      <EmptyState
        title="Intet venter på dig"
        explanation="Alle forslag er afgjort. Nye lander her når ændringsbyggeren har åbnet en pull request."
      />
    );
  }

  return (
    <>
      <p className="counter">
        {waiting.length} forslag venter · ingenting er udgivet før du klikker
      </p>
      <div className="proposals">
        {waiting.map((t) => (
          <Proposal key={t.id} task={t} customer={customerById.get(t.kundeId)} />
        ))}
      </div>
    </>
  );
}
