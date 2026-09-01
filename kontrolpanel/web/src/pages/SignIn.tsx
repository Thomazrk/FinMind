import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { ErrorNotice } from "../components/ErrorNotice";
import { translateError, type AppError } from "../lib/errors";

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="signin">
      <form onSubmit={submit}>
        <h1>Kontrolpanel</h1>
        <p className="muted">Panelet har én bruger. Ingen offentlig adgang.</p>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Adgangskode</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <ErrorNotice error={error} />}

        <button type="submit" className="button button-approve" disabled={busy}>
          {busy ? "Logger ind …" : "Log ind"}
        </button>
      </form>
    </main>
  );
}
