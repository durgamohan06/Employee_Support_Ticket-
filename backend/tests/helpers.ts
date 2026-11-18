import request from "supertest";
import type { Express } from "express";

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@123";

export async function login(app: Express, username: string, password = DEMO_PASSWORD) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  return { agent, res };
}
