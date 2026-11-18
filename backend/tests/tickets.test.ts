import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";
import { createApp } from "../src/app.ts";
import { initDb, resetDb } from "../src/db/db.ts";
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

describe("tickets", () => {
  it("lets an employee see only their tickets", async () => {
    const { agent } = await login(app, "alex.rivera");
    const res = await agent.get("/api/tickets");
    assert.equal(res.status, 200);
    assert.equal(
      res.body.tickets.every((t: { createdByUsername: string }) => t.createdByUsername === "alex.rivera"),
      true,
    );
    assert.equal(res.body.counts.total, 2);
  });

  it("creates a ticket as Open with server-owned fields", async () => {
    const { agent } = await login(app, "sam.patel");
    const res = await agent.post("/api/tickets").send({
      title: "Printer jam",
      description: "The 3rd floor printer is jammed.",
      category: "Hardware",
      priority: "Low",
      status: "Closed",
      createdBy: "u-alex",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.ticket.status, "Open");
    assert.equal(res.body.ticket.createdByUsername, "sam.patel");
  });

  it("rejects empty titles", async () => {
    const { agent } = await login(app, "sam.patel");
    const res = await agent.post("/api/tickets").send({
      title: "   ",
      description: "Something broke",
      category: "Other",
      priority: "Low",
    });
    assert.equal(res.status, 400);
  });

  it("forbids employees from viewing another employee's ticket", async () => {
    const { agent } = await login(app, "alex.rivera");
    const res = await agent.get("/api/tickets/t-003");
    assert.equal(res.status, 403);
  });

  it("prevents editing a closed ticket", async () => {
    const { agent } = await login(app, "jordan.lee");
    const res = await agent.patch("/api/tickets/t-005").send({
      title: "Changed",
      description: "Changed",
      category: "Hardware",
      priority: "Low",
    });
    assert.equal(res.status, 403);
  });

  it("lets an employee make a partial editable-field update", async () => {
    const { agent } = await login(app, "alex.rivera");
    const before = (await agent.get("/api/tickets/t-001")).body.ticket;
    const res = await agent.patch("/api/tickets/t-001").send({ priority: "Low" });
    assert.equal(res.status, 200);
    assert.equal(res.body.ticket.title, before.title);
    assert.equal(res.body.ticket.description, before.description);
    assert.equal(res.body.ticket.category, before.category);
    assert.equal(res.body.ticket.priority, "Low");
  });

  it("rejects invalid support filter values", async () => {
    const { agent } = await login(app, "support.agent");
    const res = await agent.get("/api/tickets/support").query({ priority: "Urgent" });
    assert.equal(res.status, 400);
  });

  it("prevents employees from changing status", async () => {
    const { agent } = await login(app, "alex.rivera");
    const res = await agent.patch("/api/tickets/t-001/status").send({ status: "In Progress" });
    assert.equal(res.status, 403);
  });

  it("lets support list all tickets and apply filters", async () => {
    const { agent } = await login(app, "support.agent");
    const all = await agent.get("/api/tickets/support");
    assert.equal(all.status, 200);
    assert.equal(all.body.counts.total, 5);
    const filtered = await agent.get("/api/tickets/support").query({ status: "Open", category: "Hardware" });
    assert.equal(filtered.body.tickets.length, 1);
    assert.equal(filtered.body.tickets[0].title, "Laptop not charging");
  });

  it("enforces one-step status workflow", async () => {
    const { agent } = await login(app, "support.agent");
    const skip = await agent.patch("/api/tickets/t-001/status").send({ status: "Resolved" });
    assert.equal(skip.status, 400);
    const ok = await agent.patch("/api/tickets/t-001/status").send({ status: "In Progress" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.ticket.status, "In Progress");
  });
});
