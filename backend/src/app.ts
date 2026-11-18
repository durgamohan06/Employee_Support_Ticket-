import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { optionalAuth } from "./middleware/auth.ts";
import { errorHandler, HttpError } from "./middleware/httpError.ts";
import { authRouter } from "./routes/auth.ts";
import { commentsRouter } from "./routes/comments.ts";
import { ticketsRouter } from "./routes/tickets.ts";

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(optionalAuth);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tickets", commentsRouter);
  app.use("/api/tickets", ticketsRouter);

  app.use((_req, _res, next) => {
    next(new HttpError(404, "Not found."));
  });
  app.use(errorHandler);
  return app;
}
