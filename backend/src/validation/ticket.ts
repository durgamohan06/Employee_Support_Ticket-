import type { Category, Priority, Status } from "../types.ts";
import { HttpError } from "../middleware/httpError.ts";

export const CATEGORIES: Category[] = ["Hardware", "Software", "Network", "Access", "Other"];
export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
export const STATUSES: Status[] = ["Open", "In Progress", "Resolved", "Closed"];

const NEXT_STATUS: Record<Status, Status | null> = {
  Open: "In Progress",
  "In Progress": "Resolved",
  Resolved: "Closed",
  Closed: null,
};

export function trimRequired(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} is required.`);
  }
  return value.trim();
}

export function parseTitle(value: unknown): string {
  const title = trimRequired(value, "Title");
  if (title.length > 100) {
    throw new HttpError(400, "Title cannot exceed 100 characters.");
  }
  return title;
}

export function parseDescription(value: unknown): string {
  return trimRequired(value, "Description");
}

export function parseCategory(value: unknown): Category {
  const category = trimRequired(value, "Category");
  if (!CATEGORIES.includes(category as Category)) {
    throw new HttpError(400, "Category is invalid.");
  }
  return category as Category;
}

export function parsePriority(value: unknown): Priority {
  const priority = trimRequired(value, "Priority");
  if (!PRIORITIES.includes(priority as Priority)) {
    throw new HttpError(400, "Priority is invalid.");
  }
  return priority as Priority;
}

export function parseStatus(value: unknown): Status {
  const status = trimRequired(value, "Status");
  if (!STATUSES.includes(status as Status)) {
    throw new HttpError(400, "Status is invalid.");
  }
  return status as Status;
}

export function assertTransition(from: Status, to: Status): void {
  if (NEXT_STATUS[from] !== to) {
    throw new HttpError(
      400,
      `Status cannot change from ${from} to ${to}. Use Open → In Progress → Resolved → Closed.`,
    );
  }
}

export function parseCommentText(value: unknown): string {
  return trimRequired(value, "Comment");
}
