import type { ReactNode } from "react";

/** Demo stand-in for src/auth.tsx — always signed in, nothing to configure. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    user: { email: "mig@studiet.dk" } as { email: string },
    loading: false,
    startupError: null,
    async signIn() {},
    async signOutUser() {},
  };
}
