export type Role = "employee" | "support";

export type Category = "Hardware" | "Software" | "Network" | "Access" | "Other";
export type Priority = "Low" | "Medium" | "High";
export type Status = "Open" | "In Progress" | "Resolved" | "Closed";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  passwordHash: string;
}

export interface PublicUser {
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
}

export interface TicketWithCreator extends Ticket {
  createdByName: string;
  createdByUsername: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface CommentWithAuthor extends Comment {
  authorName: string;
  authorUsername: string;
}

export interface AuthRequestUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
}
