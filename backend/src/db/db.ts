import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.ts";
import type {
  Category,
  CommentWithAuthor,
  Priority,
  PublicUser,
  Role,
  Status,
  TicketWithCreator,
  User,
} from "../types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

export function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, usedSalt, 64).toString("hex");
  return `${usedSalt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const actual = Buffer.from(hash, "hex");
  if (candidate.length !== actual.length) return false;
  return timingSafeEqual(candidate, actual);
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    role: row.role as Role,
    passwordHash: String(row.password_hash),
  };
}

function mapPublicUser(row: Record<string, unknown>): PublicUser {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    role: row.role as Role,
  };
}

function mapTicket(row: Record<string, unknown>): TicketWithCreator {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    category: row.category as Category,
    priority: row.priority as Priority,
    status: row.status as Status,
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    createdByName: String(row.created_by_name),
    createdByUsername: String(row.created_by_username),
  };
}

export function initDb(databasePath = config.databasePath): DatabaseSync {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON;");
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
  seedIfEmpty();
  return db;
}

export function resetDb(): void {
  const database = getDb();
  database.exec("DELETE FROM comments;");
  database.exec("DELETE FROM tickets;");
  database.exec("DELETE FROM users;");
  seedIfEmpty();
}

function seedIfEmpty(): void {
  const database = getDb();
  const count = database.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (Number(count.c) > 0) return;

  const passwordHash = hashPassword(config.demoPassword);
  const users = [
    ["u-alex", "alex.rivera", "Alex Rivera", "employee"],
    ["u-jordan", "jordan.lee", "Jordan Lee", "employee"],
    ["u-sam", "sam.patel", "Sam Patel", "employee"],
    ["u-support", "support.agent", "Taylor Brooks", "support"],
  ] as const;

  const insertUser = database.prepare(
    "INSERT INTO users (id, username, display_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
  );
  for (const user of users) {
    insertUser.run(...user, passwordHash);
  }

  const tickets: Array<[string, string, string, string, string, string, string, string, string]> = [
    [
      "t-001",
      "Laptop not charging",
      "The laptop charger light does not turn on and the battery drains while plugged in.",
      "Hardware",
      "High",
      "Open",
      "u-alex",
      "2026-11-10T09:00:00.000Z",
      "2026-11-10T09:00:00.000Z",
    ],
    [
      "t-002",
      "Cannot log in to VPN",
      "VPN client reports an authentication timeout after entering credentials.",
      "Network",
      "High",
      "In Progress",
      "u-jordan",
      "2026-11-11T10:15:00.000Z",
      "2026-11-12T14:20:00.000Z",
    ],
    [
      "t-003",
      "Need access to the shared project folder",
      "Please grant read access to the shared project folder for the current sprint.",
      "Access",
      "Medium",
      "Open",
      "u-sam",
      "2026-11-12T08:30:00.000Z",
      "2026-11-12T08:30:00.000Z",
    ],
    [
      "t-004",
      "Excel keeps crashing on startup",
      "Excel closes immediately after the splash screen on the finance workstation.",
      "Software",
      "Medium",
      "Resolved",
      "u-alex",
      "2026-11-08T11:45:00.000Z",
      "2026-11-13T16:00:00.000Z",
    ],
    [
      "t-005",
      "Request a second monitor",
      "Requesting a second monitor for dual-screen document review.",
      "Hardware",
      "Low",
      "Closed",
      "u-jordan",
      "2026-11-01T13:00:00.000Z",
      "2026-11-09T17:30:00.000Z",
    ],
  ];

  const insertTicket = database.prepare(
    `INSERT INTO tickets (id, title, description, category, priority, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const ticket of tickets) {
    insertTicket.run(...ticket);
  }

  const insertComment = database.prepare(
    "INSERT INTO comments (id, ticket_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
  );
  insertComment.run(
    "c-001",
    "t-002",
    "u-support",
    "Investigating the VPN gateway logs now.",
    "2026-11-12T14:20:00.000Z",
  );
  insertComment.run(
    "c-002",
    "t-005",
    "u-jordan",
    "Monitor received. Thank you.",
    "2026-11-09T17:00:00.000Z",
  );
}

export function findUserByUsername(username: string): User | undefined {
  const row = getDb().prepare("SELECT * FROM users WHERE username = ?").get(username) as
    | Record<string, unknown>
    | undefined;
  return row ? mapUser(row) : undefined;
}

export function findUserById(id: string): PublicUser | undefined {
  const row = getDb()
    .prepare("SELECT id, username, display_name, role FROM users WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapPublicUser(row) : undefined;
}

const TICKET_SELECT = `
  SELECT t.*, u.display_name AS created_by_name, u.username AS created_by_username
  FROM tickets t
  JOIN users u ON u.id = t.created_by
`;

export function listTickets(filters: {
  createdBy?: string;
  status?: string;
  priority?: string;
  category?: string;
}): TicketWithCreator[] {
  const clauses: string[] = [];
  const params: string[] = [];
  if (filters.createdBy) {
    clauses.push("t.created_by = ?");
    params.push(filters.createdBy);
  }
  if (filters.status) {
    clauses.push("t.status = ?");
    params.push(filters.status);
  }
  if (filters.priority) {
    clauses.push("t.priority = ?");
    params.push(filters.priority);
  }
  if (filters.category) {
    clauses.push("t.category = ?");
    params.push(filters.category);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(`${TICKET_SELECT} ${where} ORDER BY t.created_at DESC`)
    .all(...params) as Record<string, unknown>[];
  return rows.map(mapTicket);
}

export function getTicketById(id: string): TicketWithCreator | undefined {
  const row = getDb()
    .prepare(`${TICKET_SELECT} WHERE t.id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapTicket(row) : undefined;
}

export function insertTicket(ticket: {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}): TicketWithCreator {
  getDb()
    .prepare(
      `INSERT INTO tickets (id, title, description, category, priority, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ticket.id,
      ticket.title,
      ticket.description,
      ticket.category,
      ticket.priority,
      ticket.status,
      ticket.createdBy,
      ticket.createdAt,
      ticket.updatedAt,
    );
  return getTicketById(ticket.id)!;
}

export function updateTicketFields(
  id: string,
  fields: { title: string; description: string; category: Category; priority: Priority },
  updatedAt: string,
): TicketWithCreator | undefined {
  getDb()
    .prepare(
      `UPDATE tickets SET title = ?, description = ?, category = ?, priority = ?, updated_at = ? WHERE id = ?`,
    )
    .run(fields.title, fields.description, fields.category, fields.priority, updatedAt, id);
  return getTicketById(id);
}

export function updateTicketStatus(id: string, status: Status, updatedAt: string): TicketWithCreator | undefined {
  getDb().prepare("UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, id);
  return getTicketById(id);
}

export function listComments(ticketId: string): CommentWithAuthor[] {
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.ticket_id AS ticketId, c.author_id AS authorId, c.body AS text, c.created_at AS createdAt,
              u.display_name AS authorName, u.username AS authorUsername
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC, c.id ASC`,
    )
    .all(ticketId) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    ticketId: String(row.ticketId),
    authorId: String(row.authorId),
    text: String(row.text),
    createdAt: String(row.createdAt),
    authorName: String(row.authorName),
    authorUsername: String(row.authorUsername),
  }));
}

export function insertComment(comment: {
  id: string;
  ticketId: string;
  authorId: string;
  text: string;
  createdAt: string;
}): CommentWithAuthor {
  getDb()
    .prepare("INSERT INTO comments (id, ticket_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(comment.id, comment.ticketId, comment.authorId, comment.text, comment.createdAt);
  return listComments(comment.ticketId).find((item) => item.id === comment.id)!;
}

export function countsFor(createdBy?: string): {
  total: number;
  Open: number;
  "In Progress": number;
  Resolved: number;
  Closed: number;
} {
  const tickets = listTickets({ createdBy });
  const base = { total: tickets.length, Open: 0, "In Progress": 0, Resolved: 0, Closed: 0 };
  for (const ticket of tickets) {
    base[ticket.status] += 1;
  }
  return base;
}
