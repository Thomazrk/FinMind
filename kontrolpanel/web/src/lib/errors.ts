/**
 * Every error message must say what went wrong AND what to do about it.
 * Firebase error codes are opaque, so they get translated here.
 */

export interface AppError {
  whatHappened: string;
  whatToDo: string;
  code?: string;
}

function codeOf(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function translateError(error: unknown): AppError {
  const code = codeOf(error);

  switch (code) {
    case "permission-denied":
      return {
        code,
        whatHappened: "Firestore afviste forespørgslen.",
        whatToDo:
          "Tjek at du er logget ind med den konto der står i firestore.rules, og at reglerne er deployet med `firebase deploy --only firestore:rules`.",
      };
    case "unavailable":
      return {
        code,
        whatHappened: "Der er ingen forbindelse til Firestore.",
        whatToDo: "Tjek din internetforbindelse. Panelet prøver igen af sig selv når nettet er tilbage.",
      };
    case "failed-precondition":
      return {
        code,
        whatHappened: "Forespørgslen mangler et Firestore-indeks.",
        whatToDo:
          "Kør `firebase deploy --only firestore:indexes` — indekserne ligger i kontrolpanel/firestore.indexes.json.",
      };
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return {
        code,
        whatHappened: "E-mail eller adgangskode passer ikke.",
        whatToDo: "Prøv igen. Nulstil adgangskoden i Firebase-konsollen hvis du er låst ude.",
      };
    case "auth/too-many-requests":
      return {
        code,
        whatHappened: "For mange loginforsøg i træk — Firebase har spærret midlertidigt.",
        whatToDo: "Vent et par minutter og prøv igen.",
      };
    case "auth/network-request-failed":
      return {
        code,
        whatHappened: "Login kunne ikke nå Firebase.",
        whatToDo: "Tjek din internetforbindelse og prøv igen.",
      };
    default:
      break;
  }

  const message = messageOf(error);
  if (message.includes("Firebase er ikke konfigureret")) {
    return {
      code,
      whatHappened: "Panelet mangler Firebase-konfiguration.",
      whatToDo: message.split(". ").slice(1).join(". ") || "Udfyld .env.local og genstart dev-serveren.",
    };
  }

  return {
    code,
    whatHappened: message || "Ukendt fejl.",
    whatToDo: "Prøv igen. Bliver den ved, så se browserens konsol for det fulde spor.",
  };
}
