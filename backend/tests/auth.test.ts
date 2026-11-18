import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";
import request from "supertest";
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

describe("authentication", () => {
  it("logs in an employee and returns the role", async () => {
    const { res } = await login(app, "alex.rivera");
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "employee");
    assert.equal(res.body.user.displayName, "Alex Rivera");
  });

  it("rejects invalid credentials", async () => {
    const { res } = await login(app, "alex.rivera", "wrong");
    assert.equal(res.status, 401);
  });

  it("blocks protected routes without a session", async () => {
    const res = await request(app).get("/api/tickets");
    assert.equal(res.status, 401);
  });

  it("logs support staff in", async () => {
    const { res } = await login(app, "support.agent");
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "support");
  });
});
