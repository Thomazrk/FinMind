import { useCallback } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { ErrorNotice } from "./components/ErrorNotice";
import { watchTasks } from "./data/firestore";
import { useSubscription } from "./data/useData";
import ActivityPage from "./pages/Activity";
import PendingPage from "./pages/Pending";
import SignInPage from "./pages/SignIn";
import SitesPage from "./pages/Sites";
import UsagePage from "./pages/Usage";
import type { Task } from "./types";

/** Routes stay Danish — they show up in the address bar. */
function Navigation() {
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const pending = (tasks.data ?? []).filter((t) => t.status === "afventer").length;

  return (
    <nav className="mainnav">
      <NavLink to="/sider">Sider</NavLink>
      <NavLink to="/afventer">
        Afventer godkendelse
        {pending > 0 && <span className="nav-count">{pending}</span>}
      </NavLink>
      <NavLink to="/forbrug">Forbrug</NavLink>
      <NavLink to="/aktivitet">Aktivitet</NavLink>
    </nav>
  );
}

export default function App() {
  const { user, loading, startupError, signOutUser } = useAuth();

  if (startupError) {
    return (
      <main className="startup">
        <h1>Kontrolpanel</h1>
        <ErrorNotice error={startupError} />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="startup">
        <p role="status">Tjekker login …</p>
      </main>
    );
  }

  if (!user) return <SignInPage />;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-title">
          <h1>Kontrolpanel</h1>
          <p className="muted">{user.email}</p>
        </div>
        <button type="button" className="button button-secondary" onClick={() => void signOutUser()}>
          Log ud
        </button>
      </header>

      <Navigation />

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/afventer" replace />} />
          <Route path="/sider" element={<SitesPage />} />
          <Route path="/afventer" element={<PendingPage />} />
          <Route path="/forbrug" element={<UsagePage />} />
          <Route path="/aktivitet" element={<ActivityPage />} />
          <Route
            path="*"
            element={<p className="note">Den adresse findes ikke i panelet. Brug menuen ovenfor.</p>}
          />
        </Routes>
      </main>

      <footer className="footnote">Ingen ændring når en kundeside uden et klik herfra.</footer>
    </div>
  );
}
