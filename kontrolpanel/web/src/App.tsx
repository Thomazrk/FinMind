import { useCallback } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { ErrorNotice } from "./components/ErrorNotice";
import { watchAutomation, watchTasks } from "./data/firestore";
import { useSubscription } from "./data/useData";
import ActivityPage from "./pages/Activity";
import AutomationPage from "./pages/Automation";
import CustomerDetailPage from "./pages/CustomerDetail";
import CustomersPage from "./pages/Customers";
import PendingPage from "./pages/Pending";
import SignInPage from "./pages/SignIn";
import SitesPage from "./pages/Sites";
import TodayPage from "./pages/Today";
import UsagePage from "./pages/Usage";
import type { Automation, Task } from "./types";

/** Routes stay Danish — they show up in the address bar. */
function Navigation() {
  const tasks = useSubscription<Task[]>(useCallback((d, e) => watchTasks(d, e), []));
  const pending = (tasks.data ?? []).filter((t) => t.status === "afventer").length;

  return (
    <nav className="mainnav">
      <NavLink to="/" end>
        I dag
      </NavLink>
      <NavLink to="/afventer">
        Afventer godkendelse
        {pending > 0 && <span className="nav-count">{pending}</span>}
      </NavLink>
      <NavLink to="/kunder">Kunder</NavLink>
      <NavLink to="/sider">Sider</NavLink>
      <NavLink to="/forbrug">Forbrug</NavLink>
      <NavLink to="/automatik">Automatik</NavLink>
      <NavLink to="/aktivitet">Aktivitet</NavLink>
    </nav>
  );
}

/** A stopped automation is the one state that has to be visible on every screen. */
function StopBanner() {
  const automation = useSubscription<Automation>(useCallback((d, e) => watchAutomation(d, e), []));
  if (!automation.data?.pauseret) return null;

  return (
    <Link className="stop-banner" to="/automatik">
      Automatikken er stoppet
      {automation.data.årsag && <span className="stop-banner-reason"> — {automation.data.årsag}</span>}
    </Link>
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
      <StopBanner />

      <main className="content">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/afventer" element={<PendingPage />} />
          <Route path="/kunder" element={<CustomersPage />} />
          <Route path="/kunder/:kundeId" element={<CustomerDetailPage />} />
          <Route path="/sider" element={<SitesPage />} />
          <Route path="/forbrug" element={<UsagePage />} />
          <Route path="/automatik" element={<AutomationPage />} />
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
