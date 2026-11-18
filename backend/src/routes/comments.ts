import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getTicketById, insertComment, listComments } from "../db/db.ts";
import { requireAuth } from "../middleware/auth.ts";
import { HttpError } from "../middleware/httpError.ts";
import { parseCommentText } from "../validation/ticket.ts";
import { loadVisibleTicket } from "./tickets.ts";

export const commentsRouter = Router();

commentsRouter.get("/:id/comments", requireAuth, (req, res, next) => {
  try {
    loadVisibleTicket(req.user!, req.params.id);
    const comments = listComments(req.params.id);
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

commentsRouter.post("/:id/comments", requireAuth, (req, res, next) => {
  try {
    const ticket = loadVisibleTicket(req.user!, req.params.id);
    const text = parseCommentText(req.body?.text);
    const before = getTicketById(ticket.id)!;
    const comment = insertComment({
      id: randomUUID(),
      ticketId: ticket.id,
      authorId: req.user!.id,
      text,
      createdAt: new Date().toISOString(),
    });
    const after = getTicketById(ticket.id)!;
    if (after.status !== before.status) {
      throw new HttpError(500, "Comment unexpectedly changed ticket status.");
    }
    res.status(201).json({ comment, ticket: after });
  } catch (err) {
    next(err);
  }
});
