/** Danish formatting helpers. Raw numbers are always shown, never rounded away. */

const dateTime = new Intl.DateTimeFormat("da-DK", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("da-DK", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "ugyldigt tidspunkt";
  return dateTime.format(d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "ugyldig dato";
  return dateOnly.format(d);
}

/** "for 4 minutter siden" — shown next to the exact stamp, never instead of it. */
export function formatRelative(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "ugyldigt tidspunkt";
  const seconds = Math.round((now.getTime() - d.getTime()) / 1000);
  if (seconds < 0) return "i fremtiden";
  if (seconds < 60) return "lige nu";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `for ${minutes} ${minutes === 1 ? "minut" : "minutter"} siden`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `for ${hours} ${hours === 1 ? "time" : "timer"} siden`;
  const days = Math.round(hours / 24);
  if (days < 31) return `for ${days} ${days === 1 ? "dag" : "dage"} siden`;
  return formatDate(iso);
}

export function formatCurrency(kroner: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kroner);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("da-DK").format(n);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min.`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} t.` : `${hours} t. ${rest} min.`;
}

/** "2026-09" -> "september 2026" */
export function formatMonth(id: string): string {
  const [year, month] = id.split("-").map(Number);
  if (!year || !month) return id;
  const d = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("da-DK", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function currentMonthId(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
