import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.ts";
import { findUserById } from "../db/db.ts";
import type { AuthRequestUser, Role } from "../types.ts";
import { HttpError } from "./httpError.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthRequestUser;
    }
  }
}

function sign(payload: string): string {
  return createHmac("sha256", config.sessionSecret).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + config.sessionDays * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      exp?: number;
    };
    if (!data.userId || !data.exp || Date.now() > data.exp) return null;
    return data.userId;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, userId: string): void {
  const token = createSessionToken(userId);
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.cookieName, { path: "/" });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.cookieName];
  if (typeof token === "string") {
    const userId = readSessionToken(token);
    if (userId) {
      const user = findUserById(userId);
      if (user) req.user = user;
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new HttpError(401, "Authentication required."));
    return;
  }
  next();
}

export function requireRole(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, "Authentication required."));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, "You are not allowed to perform this action."));
      return;
    }
    next();
  };
}
