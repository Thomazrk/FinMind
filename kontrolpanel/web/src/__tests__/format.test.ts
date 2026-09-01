import { describe, expect, it } from "vitest";
import {
  currentMonthId,
  formatCurrency,
  formatMinutes,
  formatMonth,
  formatNumber,
  formatRelative,
  formatTimestamp,
} from "../lib/format";

describe("format", () => {
  it("viser en tom værdi som tankestreg i stedet for at crashe", () => {
    expect(formatTimestamp(null)).toBe("—");
    expect(formatRelative(undefined)).toBe("—");
  });

  it("siger tydeligt til når et tidsstempel er ugyldigt", () => {
    expect(formatTimestamp("ikke en dato")).toBe("ugyldigt tidspunkt");
  });

  it("regner relativ tid ud på dansk", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    expect(formatRelative("2026-09-01T11:59:30.000Z", now)).toBe("lige nu");
    expect(formatRelative("2026-09-01T11:59:00.000Z", now)).toBe("for 1 minut siden");
    expect(formatRelative("2026-09-01T11:40:00.000Z", now)).toBe("for 20 minutter siden");
    expect(formatRelative("2026-09-01T09:00:00.000Z", now)).toBe("for 3 timer siden");
    expect(formatRelative("2026-08-30T12:00:00.000Z", now)).toBe("for 2 dage siden");
  });

  it("formaterer kroner og tal med danske skilletegn", () => {
    expect(formatCurrency(1.34)).toContain("1,34");
    expect(formatNumber(19527)).toBe("19.527");
  });

  it("formaterer minutter som timer når det er over en time", () => {
    expect(formatMinutes(8)).toBe("8 min.");
    expect(formatMinutes(60)).toBe("1 t.");
    expect(formatMinutes(960)).toBe("16 t.");
    expect(formatMinutes(95)).toBe("1 t. 35 min.");
  });

  it("oversætter måneds-id til dansk månedsnavn", () => {
    expect(formatMonth("2026-09")).toBe("september 2026");
    expect(formatMonth("noget-mærkeligt")).toBe("noget-mærkeligt");
  });

  it("laver måneds-id i samme form som forbrug-dokumenterne", () => {
    expect(currentMonthId(new Date(2026, 0, 5))).toBe("2026-01");
    expect(currentMonthId(new Date(2026, 11, 31))).toBe("2026-12");
  });
});
