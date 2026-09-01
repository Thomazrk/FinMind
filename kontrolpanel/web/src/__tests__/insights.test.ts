import { describe, expect, it } from "vitest";
import {
  budgetState,
  customerEconomics,
  customerSpendThisMonth,
  customersOverSupport,
  daysUntil,
  sitesNeedingAttention,
  supportUsage,
  upcomingRenewals,
} from "../lib/insights";
import type { Customer, MonthlyUsage, Site } from "../types";

const now = new Date("2026-09-01T12:00:00.000Z");

function customer(over: Partial<Customer> = {}): Customer {
  return {
    id: "bageriet",
    navn: "Bageriet på Torvet",
    slackKanalId: "C1",
    repo: "studie/bageriet",
    domæne: "bageriet.dk",
    pakke: "Vedligehold lille",
    månedspris: 1200,
    fornyelsesdato: "2026-11-01",
    supportMinutterDenneMåned: 42,
    supportMinutterPrMåned: 60,
    ...over,
  };
}

describe("daysUntil", () => {
  it("tæller hele dage frem og tilbage", () => {
    expect(daysUntil("2026-09-01T23:00:00.000Z", now)).toBe(0);
    expect(daysUntil("2026-09-15T00:00:00.000Z", now)).toBe(14);
    expect(daysUntil("2026-08-25T00:00:00.000Z", now)).toBe(-7);
  });

  it("giver null for tomme og ugyldige datoer", () => {
    expect(daysUntil(null, now)).toBeNull();
    expect(daysUntil("ikke en dato", now)).toBeNull();
  });
});

describe("upcomingRenewals", () => {
  it("tager dem inden for grænsen og dem der er løbet over, tættest først", () => {
    const list = upcomingRenewals(
      [
        customer({ id: "a", fornyelsesdato: "2026-09-20T00:00:00.000Z" }),
        customer({ id: "b", fornyelsesdato: "2026-12-01T00:00:00.000Z" }),
        customer({ id: "c", fornyelsesdato: "2026-08-28T00:00:00.000Z" }),
      ],
      30,
      now,
    );
    expect(list.map((r) => r.customer.id)).toEqual(["c", "a"]);
    expect(list[0].days).toBe(-4);
  });
});

describe("supportUsage", () => {
  it("regner andelen ud mod pakkens grænse", () => {
    const u = supportUsage(customer({ supportMinutterDenneMåned: 30, supportMinutterPrMåned: 60 }));
    expect(u.ratio).toBe(0.5);
    expect(u.over).toBe(false);
  });

  it("markerer når grænsen er overskredet", () => {
    const u = supportUsage(customer({ supportMinutterDenneMåned: 134, supportMinutterPrMåned: 120 }));
    expect(u.over).toBe(true);
  });

  it("måler ikke mod en grænse der ikke findes", () => {
    const u = supportUsage(customer({ supportMinutterPrMåned: null }));
    expect(u.ratio).toBeNull();
    expect(u.over).toBe(false);
  });

  it("finder kunderne der er over", () => {
    const over = customersOverSupport([
      customer({ id: "under", supportMinutterDenneMåned: 10 }),
      customer({ id: "over", supportMinutterDenneMåned: 90 }),
    ]);
    expect(over.map((c) => c.id)).toEqual(["over"]);
  });
});

describe("customerEconomics", () => {
  it("trækker AI-forbrug og tid fra abonnementet", () => {
    const e = customerEconomics(customer({ supportMinutterDenneMåned: 60 }), 40, 750);
    expect(e.tidKroner).toBe(750);
    expect(e.tilbage).toBe(1200 - 40 - 750);
  });

  it("kan blive negativ når kunden koster mere end hun betaler", () => {
    const e = customerEconomics(customer({ supportMinutterDenneMåned: 120 }), 60, 750);
    expect(e.tilbage).toBeLessThan(0);
  });

  it("lader tiden stå åben når der ikke er sat en timepris", () => {
    const e = customerEconomics(customer(), 40, null);
    expect(e.tidKroner).toBeNull();
    expect(e.tilbage).toBeNull();
  });
});

describe("budgetState", () => {
  it("er nået når forbruget rammer loftet", () => {
    expect(budgetState(400, 400).over).toBe(true);
    expect(budgetState(399.99, 400).over).toBe(false);
  });

  it("måler ikke mod et loft der ikke er sat", () => {
    expect(budgetState(1000, null)).toEqual({ cap: null, spend: 1000, ratio: null, over: false });
    expect(budgetState(1000, 0).over).toBe(false);
  });
});

describe("customerSpendThisMonth", () => {
  const month: MonthlyUsage = {
    id: "2026-09",
    totalTokens: 100,
    totalKroner: 5,
    perKunde: { bageriet: 1.34 },
  };

  it("finder kundens andel", () => {
    expect(customerSpendThisMonth(month, "bageriet")).toBe(1.34);
  });

  it("er nul for en kunde uden forbrug, og når måneden mangler", () => {
    expect(customerSpendThisMonth(month, "ukendt")).toBe(0);
    expect(customerSpendThisMonth(undefined, "bageriet")).toBe(0);
  });
});

describe("sitesNeedingAttention", () => {
  it("tager dem der ikke er live og kørende", () => {
    const sites = [
      { id: "a", status: "live" },
      { id: "b", status: "nede" },
      { id: "c", status: "ændringVenter" },
      { id: "d", status: "underOpbygning" },
    ] as Site[];
    expect(sitesNeedingAttention(sites).map((s) => s.id)).toEqual(["b", "d"]);
  });
});
