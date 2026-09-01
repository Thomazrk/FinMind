import type { SiteStatus, TaskStatus } from "../types";
import { siteStatusLabel, taskStatusLabel } from "../lib/labels";

export function TaskBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge badge-task-${status}`}>{taskStatusLabel[status] ?? status}</span>;
}

export function SiteBadge({ status }: { status: SiteStatus }) {
  return <span className={`badge badge-site-${status}`}>{siteStatusLabel[status] ?? status}</span>;
}
