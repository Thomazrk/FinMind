/**
 * Writes hand-entered documents into Firestore so the panel has something to
 * show in step 1 — before Slack and the AI are wired up.
 *
 * Against the emulator:
 *   firebase emulators:start --only firestore,auth        (in kontrolpanel/)
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 GOOGLE_CLOUD_PROJECT=demo-kontrolpanel npm run seed
 *
 * Against the real project:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceaccount.json \
 *   GOOGLE_CLOUD_PROJECT=<project-id> npm run seed
 *
 * Only the document ids listed in data.json are touched. Nothing is deleted.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const here = dirname(fileURLToPath(import.meta.url));

const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error(
    "Mangler projekt-id.\n" +
      "Sæt GOOGLE_CLOUD_PROJECT=<dit-firebase-projekt> (brug fx demo-kontrolpanel mod emulatoren) og kør igen.",
  );
  process.exit(1);
}

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!usingEmulator && !keyFile) {
  console.error(
    "Hverken emulator eller servicekonto er sat op.\n" +
      "Enten: FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 (mod emulatoren)\n" +
      "eller:  GOOGLE_APPLICATION_CREDENTIALS=/sti/til/serviceaccount.json (mod det rigtige projekt).",
  );
  process.exit(1);
}

// The emulator needs no credentials — asking for them makes the Admin SDK reach
// for the metadata server and complain about a 403 that does not matter.
initializeApp(
  usingEmulator
    ? { projectId }
    : { projectId, credential: cert(JSON.parse(await readFile(keyFile, "utf8"))) },
);

const db = getFirestore();

/** ISO strings in data.json become real Firestore Timestamps. */
const timeFields = new Set(["modtagetTidspunkt", "afgjortTidspunkt", "sidsteDeploy", "tidspunkt"]);

function convert(document) {
  const out = {};
  for (const [key, value] of Object.entries(document)) {
    if (key === "id") continue;
    out[key] =
      timeFields.has(key) && typeof value === "string" ? Timestamp.fromDate(new Date(value)) : value;
  }
  return out;
}

async function write(collection, documents) {
  const batch = db.batch();
  for (const document of documents) {
    batch.set(db.collection(collection).doc(document.id), convert(document), { merge: true });
  }
  await batch.commit();
  console.log(`${collection}: ${documents.length} dokumenter skrevet`);
}

try {
  const data = JSON.parse(await readFile(join(here, "data.json"), "utf8"));
  for (const collection of ["kunder", "sider", "opgaver", "forbrug", "aktivitet"]) {
    await write(collection, data[collection] ?? []);
  }
  console.log(`\nFærdig. Projekt: ${projectId}${usingEmulator ? " (emulator)" : ""}`);
} catch (error) {
  console.error("\nSeed fejlede:", error.message);
  console.error(
    "Tjek at Firestore kører (emulator eller rigtigt projekt), og at kontoen må skrive til samlingerne.",
  );
  process.exit(1);
}
