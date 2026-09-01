import { describe, expect, it } from "vitest";
import { missingConfigKeys } from "../firebase";

describe("missingConfigKeys", () => {
  it("nævner præcis de nøgler der mangler", () => {
    expect(missingConfigKeys({})).toEqual([
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_APP_ID",
    ]);
  });

  it("er tilfreds når de påkrævede nøgler er sat", () => {
    expect(
      missingConfigKeys({
        VITE_FIREBASE_API_KEY: "a",
        VITE_FIREBASE_AUTH_DOMAIN: "b",
        VITE_FIREBASE_PROJECT_ID: "c",
        VITE_FIREBASE_APP_ID: "d",
      }),
    ).toEqual([]);
  });
});
