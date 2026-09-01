import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { allowedEmail, auth } from "./firebase";
import { translateError, type AppError } from "./lib/errors";

interface AuthState {
  user: User | null;
  loading: boolean;
  startupError: AppError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState<AppError | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(
        auth(),
        (u) => {
          setUser(u);
          setLoading(false);
        },
        (error) => {
          setStartupError(translateError(error));
          setLoading(false);
        },
      );
    } catch (error) {
      setStartupError(translateError(error));
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      startupError,
      async signIn(email, password) {
        const allowed = allowedEmail();
        if (allowed && email.trim().toLowerCase() !== allowed.toLowerCase()) {
          throw new Error(
            `Kun ${allowed} har adgang til panelet. Skriv den adresse, eller ret VITE_TILLADT_EMAIL i .env.local.`,
          );
        }
        await signInWithEmailAndPassword(auth(), email.trim(), password);
      },
      async signOutUser() {
        await signOut(auth());
      },
    }),
    [user, loading, startupError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth skal bruges inden i <AuthProvider>.");
  return ctx;
}
