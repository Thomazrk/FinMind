import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { watchCustomers, watchSites, watchTasks } from "../data/firestore";
import { useSubscription } from "../data/useData";
import { ErrorNotice } from "../components/ErrorNotice";
import { SiteBadge } from "../components/StatusBadge";
import { EmptyState, Loading } from "../components/States";
import { formatRelative, formatTimestamp } from "../lib/format";
import type { Customer, Site, Task } from "../types";

const PREVIEW_TIMEOUT_MS = 8000;

/**
 * The frame renders the site at a desktop width and is then scaled down to fit
 * the card, so the card shows the top of the page rather than a crop of its
 * top-left corner. Width and height are both 100%/scale in CSS, which makes the
 * frame's own viewport exactly PREVIEW_WIDTH px wide.
 */
const PREVIEW_WIDTH = 1280;

/**
 * Live preview in an iframe. Customer sites are on our own domains, but some
 * still send X-Frame-Options, and an iframe cannot tell us it was blocked. So
 * the frame is never the only thing on the card: URL, repo and last deploy stay
 * readable as text, and there is a direct link out.
 *
 * `url` is forhåndsvisningsUrl when the document has one, otherwise
 * produktionsUrl — so a framing-hostile site can point at a staging copy
 * without changing what the card says the site's address is.
 */
function Preview({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || loaded) return;
    const id = window.setTimeout(() => setGaveUp(true), PREVIEW_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [url, loaded]);

  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = (width: number) => {
      if (width > 0) el.style.setProperty("--preview-scale", String(width / PREVIEW_WIDTH));
    };
    fit(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  if (!url) {
    return <div className="preview preview-missing">Ingen produktionsUrl på dokumentet</div>;
  }

  return (
    <div className="preview" ref={frame}>
      {!loaded && !gaveUp && <p className="preview-status">Indlæser {url} …</p>}
      {!loaded && gaveUp && (
        <div className="preview-blocked">
          <p>Rammen er stadig tom efter {PREVIEW_TIMEOUT_MS / 1000} sekunder.</p>
          <p className="muted">
            Siden svarer ikke, eller den sender X-Frame-Options og nægter at blive indlejret. Brug linket nedenfor.
          </p>
        </div>
      )}
      <iframe
        src={url}
        title={`Forhåndsvisning af ${name}`}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default function SitesPage() {
  const sites = useSubscription<Site[]>(useCallback((d, e) => watchSites(d, e), []));
  const customers = useSubscription<Customer[]>(useCallback((d, e) => watchCustomers(d, e), []));
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));

  const customerNames = useMemo(() => {
    const map = new Map<string, string>();
    (customers.data ?? []).forEach((c) => map.set(c.id, c.navn));
    return map;
  }, [customers.data]);

  /** Sites with something waiting for me get marked. */
  const pendingPerSite = useMemo(() => {
    const map = new Map<string, number>();
    (tasks.data ?? [])
      .filter((t) => t.status === "afventer")
      .forEach((t) => map.set(t.sideId, (map.get(t.sideId) ?? 0) + 1));
    return map;
  }, [tasks.data]);

  if (sites.error) return <ErrorNotice error={sites.error} />;
  if (sites.loading) return <Loading what="kundesider" />;

  const list = sites.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        title="Ingen sider i Firestore endnu"
        explanation="Opret dokumenter i samlingen sider — eller kør `npm run seed` i kontrolpanel/seed for at lægge nogle håndindtastede eksempler ind."
      />
    );
  }

  return (
    <>
      <p className="counter">
        {list.length} {list.length === 1 ? "side" : "sider"} · {pendingPerSite.size} med ændring der venter
      </p>
      <div className="site-cards">
        {list.map((site) => {
          const pending = pendingPerSite.get(site.id) ?? 0;
          const name = customerNames.get(site.kundeId) ?? site.kundeId;
          return (
            <article className={`site-card${pending > 0 ? " site-card-waiting" : ""}`} key={site.id}>
              <header className="site-card-head">
                <h2>{name}</h2>
                <SiteBadge status={site.status} />
              </header>

              <Preview url={site.forhåndsvisningsUrl || site.produktionsUrl} name={name} />

              <dl className="raw">
                <dt>Url</dt>
                <dd>
                  <a href={site.produktionsUrl} target="_blank" rel="noreferrer noopener">
                    {site.produktionsUrl || "—"}
                  </a>
                </dd>
                <dt>Repo</dt>
                <dd className="mono">{site.repo || "—"}</dd>
                <dt>Sidste deploy</dt>
                <dd>
                  {formatTimestamp(site.sidsteDeploy)}
                  {site.sidsteDeploy && <span className="muted"> · {formatRelative(site.sidsteDeploy)}</span>}
                </dd>
                <dt>Dokument</dt>
                <dd className="mono muted">sider/{site.id}</dd>
              </dl>

              {pending > 0 && (
                <Link className="waiting-band" to="/afventer">
                  {pending} {pending === 1 ? "ændring venter" : "ændringer venter"} på godkendelse
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
