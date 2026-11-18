export const config = {
  port: Number(process.env.PORT ?? 3001),
  databasePath: process.env.DATABASE_PATH ?? "./data/tickets.db",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
  demoPassword: process.env.DEMO_PASSWORD ?? "Demo@123",
  cookieName: "ticket_session",
  sessionDays: 7,
  isProd: process.env.NODE_ENV === "production",
};
