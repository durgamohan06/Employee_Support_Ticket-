import { Router } from "express";
import { findUserByUsername, verifyPassword } from "../db/db.ts";
import { clearSessionCookie, requireAuth, setSessionCookie } from "../middleware/auth.ts";
import { HttpError } from "../middleware/httpError.ts";

export const authRouter = Router();

authRouter.post("/login", (req, res, next) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!username || !password) {
      throw new HttpError(400, "Username and password are required.");
    }
    const user = findUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "Invalid username or password.");
    }
    setSessionCookie(res, user.id);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
