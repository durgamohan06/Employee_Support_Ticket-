import type { Priority, Status } from "../types.ts";

export function StatusBadge({ status }: { status: Status }) {
  const cls = status === "In Progress" ? "status-InProgress" : `status-${status}`;
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge priority-${priority}`}>{priority}</span>;
}
