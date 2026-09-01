import { describe, expect, it } from "vitest";
import { translateError } from "../lib/errors";

describe("translateError", () => {
  it("giver altid både hvad der skete og hvad jeg gør ved det", () => {
    const codes = [
      "permission-denied",
      "unavailable",
      "failed-precondition",
      "auth/invalid-credential",
      "auth/too-many-requests",
      "auth/network-request-failed",
      "noget-helt-andet",
    ];
    for (const code of codes) {
      const error = translateError(Object.assign(new Error("boom"), { code }));
      expect(error.whatHappened.length).toBeGreaterThan(0);
      expect(error.whatToDo.length).toBeGreaterThan(0);
    }
  });

  it("peger på det manglende indeks-deploy ved failed-precondition", () => {
    const error = translateError(Object.assign(new Error("index"), { code: "failed-precondition" }));
    expect(error.whatToDo).toContain("firestore:indexes");
  });

  it("beholder beskeden fra en almindelig Error", () => {
    expect(translateError(new Error("noget gik galt her")).whatHappened).toBe("noget gik galt her");
  });

  it("håndterer en fejl der ikke er en Error", () => {
    expect(translateError("bare en streng").whatHappened).toBe("bare en streng");
  });
});
