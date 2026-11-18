export type Role = "employee" | "support";
export type Category = "Hardware" | "Software" | "Network" | "Access" | "Other";
export type Priority = "Low" | "Medium" | "High";
export type Status = "Open" | "In Progress" | "Resolved" | "Closed";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: Role;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  createdByUsername: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
}

export interface Counts {
  total: number;
  Open: number;
  "In Progress": number;
  Resolved: number;
  Closed: number;
}

export const CATEGORIES: Category[] = ["Hardware", "Software", "Network", "Access", "Other"];
export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
export const STATUSES: Status[] = ["Open", "In Progress", "Resolved", "Closed"];
