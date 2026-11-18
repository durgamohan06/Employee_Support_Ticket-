import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_PATH: ":memory:",
      SESSION_SECRET: "test-session-secret",
      DEMO_PASSWORD: "Demo@123",
      NODE_ENV: "test",
    },
  },
});
