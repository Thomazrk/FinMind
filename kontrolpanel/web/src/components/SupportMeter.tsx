import { formatMinutes, formatMinutesOf, formatNumber } from "../lib/format";
import type { SupportUsage } from "../lib/insights";

/**
 * Minutes used against what the package includes. Without a stated ceiling
 * there is nothing to measure against, so it shows the number and says so
 * rather than drawing a bar that means nothing.
 */
export function SupportMeter({ usage }: { usage: SupportUsage }) {
  if (usage.ratio === null) {
    return (
      <p className="meter-text muted">
        {formatNumber(usage.used)} minutters support brugt · pakken har ingen angivet grænse
      </p>
    );
  }

  const percent = Math.min(usage.ratio, 1) * 100;
  return (
    <div className={`meter${usage.over ? " meter-over" : ""}`}>
      <div className="meter-bar">
        <div className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="meter-text">
        {formatMinutesOf(usage.used, usage.included!)} support brugt
        {usage.over && ` · ${formatMinutes(usage.used - usage.included!)} over`}
      </p>
    </div>
  );
}
