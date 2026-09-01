import { initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const requiredKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export function missingConfigKeys(env: Record<string, unknown>): string[] {
  return requiredKeys.filter((key) => !env[key]);
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

/** Set VITE_BRUG_EMULATOR=1 to run against `firebase emulators:start`. */
function emulatorEnabled(): boolean {
  return (import.meta.env as unknown as Record<string, string>).VITE_BRUG_EMULATOR === "1";
}

/**
 * 127.0.0.1 rather than "localhost": the emulator listens on IPv4 only, and a
 * browser that resolves localhost to ::1 gets connection refused with no
 * explanation anywhere.
 */
const EMULATOR_HOST = "127.0.0.1";

function getApp(): FirebaseApp {
  if (app) return app;
  const env = import.meta.env as unknown as Record<string, string>;
  const missing = missingConfigKeys(env);
  if (missing.length > 0) {
    throw new Error(
      `Firebase er ikke konfigureret. Manglende nøgler i .env.local: ${missing.join(", ")}. ` +
        "Kopiér .env.example til .env.local og udfyld værdierne fra Firebase-konsollen.",
    );
  }
  app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  return app;
}

export function auth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getApp());
  if (emulatorEnabled()) {
    connectAuthEmulator(authInstance, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  }
  return authInstance;
}

export function db(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(getApp());
  if (emulatorEnabled()) {
    connectFirestoreEmulator(dbInstance, EMULATOR_HOST, 8085);
  }
  return dbInstance;
}

/** The single account allowed into the panel. Enforced again in firestore.rules. */
export function allowedEmail(): string | null {
  const env = import.meta.env as unknown as Record<string, string>;
  return env.VITE_TILLADT_EMAIL ?? null;
}
