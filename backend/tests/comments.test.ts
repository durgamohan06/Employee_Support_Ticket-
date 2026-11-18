import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { getTicketById, initDb, resetDb } from "../src/db/db.ts";
import { login } from "./helpers.ts";

process.env.DEMO_PASSWORD ??= "Demo@123";
process.env.SESSION_SECRET ??= "test-session-secret";

const app = createApp();

before(() => {
  initDb(":memory:");
});

beforeEach(() => {
  resetDb();
});

describe("ticket comments", () => {
  it("lets an employee comment on their own ticket", async () => {
    const { agent } = await login(app, "alex.rivera");
    const res = await agent.post("/api/tickets/t-001/comments").send({ text: "I tried a different charger." });
    assert.equal(res.status, 201);
    assert.equal(res.body.comment.text, "I tried a different charger.");
    assert.equal(res.body.comment.ticketId, "t-001");
    assert.equal(res.body.comment.authorUsername, "alex.rivera");
    assert.ok(res.body.comment.id);
    assert.ok(res.body.comment.createdAt);
  });

  it("lets support comment on any ticket", async () => {
    const { agent } = await login(app, "support.agent");
    const res = await agent.post("/api/tickets/t-003/comments").send({ text: "Access request received." });
    assert.equal(res.status, 201);
    assert.equal(res.body.comment.authorUsername, "support.agent");
  });

  it("rejects empty comments", async () => {
    const { agent } = await login(app, "alex.rivera");
    const empty = await agent.post("/api/tickets/t-001/comments").send({ text: "   " });
    assert.equal(empty.status, 400);
  });

  it("returns comments in chronological order", async () => {
    const { agent } = await login(app, "jordan.lee");
    await agent.post("/api/tickets/t-002/comments").send({ text: "Second note" });
    const list = await agent.get("/api/tickets/t-002/comments");
    assert.equal(list.status, 200);
    const texts = list.body.comments.map((c: { text: string }) => c.text);
    assert.equal(texts[0], "Investigating the VPN gateway logs now.");
    assert.equal(texts[texts.length - 1], "Second note");
    const times = list.body.comments.map((c: { createdAt: string }) => c.createdAt);
    assert.deepEqual([...times].sort(), times);
  });

  it("allows comments on closed tickets", async () => {
    const { agent } = await login(app, "jordan.lee");
    const res = await agent.post("/api/tickets/t-005/comments").send({ text: "Still using the extra monitor." });
    assert.equal(res.status, 201);
    const list = await agent.get("/api/tickets/t-005/comments");
    assert.equal(
      list.body.comments.some((c: { text: string }) => c.text.includes("Still using")),
      true,
    );
  });

  it("does not change ticket status when a comment is added", async () => {
    const before = getTicketById("t-005")!;
    const { agent } = await login(app, "support.agent");
    const res = await agent.post("/api/tickets/t-005/comments").send({ text: "Closing notes filed." });
    assert.equal(res.status, 201);
    assert.equal(res.body.ticket.status, before.status);
    assert.equal(getTicketById("t-005")!.status, "Closed");
    assert.equal(getTicketById("t-005")!.updatedAt, before.updatedAt);
  });

  it("rejects employee comments on another employee's ticket", async () => {
    const { agent } = await login(app, "alex.rivera");
    const res = await agent.post("/api/tickets/t-003/comments").send({ text: "I should not see this." });
    assert.equal(res.status, 403);
  });

  it("rejects unauthenticated comment access", async () => {
    const res = await request(app).post("/api/tickets/t-001/comments").send({ text: "hello" });
    assert.equal(res.status, 401);
  });
});
