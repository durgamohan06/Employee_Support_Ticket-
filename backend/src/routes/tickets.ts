import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  countsFor,
  getTicketById,
  insertTicket,
  listTickets,
  updateTicketFields,
  updateTicketStatus,
} from "../db/db.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import { HttpError } from "../middleware/httpError.ts";
import {
  assertTransition,
  parseCategory,
  parseDescription,
  parsePriority,
  parseStatus,
  parseTitle,
} from "../validation/ticket.ts";
import type { AuthRequestUser, TicketWithCreator } from "../types.ts";

export const ticketsRouter = Router();

function canViewTicket(user: AuthRequestUser, ticket: TicketWithCreator): boolean {
  return user.role === "support" || ticket.createdBy === user.id;
}

function loadVisibleTicket(user: AuthRequestUser, id: string): TicketWithCreator {
  const ticket = getTicketById(id);
  if (!ticket) throw new HttpError(404, "Ticket not found.");
  if (!canViewTicket(user, ticket)) throw new HttpError(403, "You cannot access this ticket.");
  return ticket;
}

ticketsRouter.get("/", requireAuth, requireRole("employee"), (req, res, next) => {
  try {
    const tickets = listTickets({ createdBy: req.user!.id });
    res.json({ tickets, counts: countsFor(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.post("/", requireAuth, requireRole("employee"), (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const ticket = insertTicket({
      id: randomUUID(),
      title: parseTitle(req.body?.title),
      description: parseDescription(req.body?.description),
      category: parseCategory(req.body?.category),
      priority: parsePriority(req.body?.priority),
      status: "Open",
      createdBy: req.user!.id,
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json({ ticket });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.get("/support", requireAuth, requireRole("support"), (req, res, next) => {
  try {
    const status =
      typeof req.query.status === "string" && req.query.status ? parseStatus(req.query.status) : undefined;
    const priority =
      typeof req.query.priority === "string" && req.query.priority ? parsePriority(req.query.priority) : undefined;
    const category =
      typeof req.query.category === "string" && req.query.category ? parseCategory(req.query.category) : undefined;
    const tickets = listTickets({ status, priority, category });
    res.json({ tickets, counts: countsFor() });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.get("/:id", requireAuth, (req, res, next) => {
  try {
    const ticket = loadVisibleTicket(req.user!, req.params.id);
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.patch("/:id", requireAuth, requireRole("employee"), (req, res, next) => {
  try {
    const ticket = loadVisibleTicket(req.user!, req.params.id);
    if (ticket.createdBy !== req.user!.id) {
      throw new HttpError(403, "You cannot edit this ticket.");
    }
    if (ticket.status === "Closed") {
      throw new HttpError(403, "Closed tickets cannot be edited.");
    }
    if (req.body?.status !== undefined) {
      throw new HttpError(403, "Employees cannot change ticket status.");
    }
    const fields = {
      title: req.body?.title !== undefined ? parseTitle(req.body.title) : ticket.title,
      description: req.body?.description !== undefined ? parseDescription(req.body.description) : ticket.description,
      category: req.body?.category !== undefined ? parseCategory(req.body.category) : ticket.category,
      priority: req.body?.priority !== undefined ? parsePriority(req.body.priority) : ticket.priority,
    };
    const updated = updateTicketFields(
      ticket.id,
      fields,
      new Date().toISOString(),
    );
    res.json({ ticket: updated });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.patch("/:id/status", requireAuth, requireRole("support"), (req, res, next) => {
  try {
    const ticket = loadVisibleTicket(req.user!, req.params.id);
    const nextStatus = parseStatus(req.body?.status);
    assertTransition(ticket.status, nextStatus);
    const updated = updateTicketStatus(ticket.id, nextStatus, new Date().toISOString());
    res.json({ ticket: updated });
  } catch (err) {
    next(err);
  }
});

export { canViewTicket, loadVisibleTicket };
