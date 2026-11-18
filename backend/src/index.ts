import { config } from "./config.ts";
import { initDb } from "./db/db.ts";
import { createApp } from "./app.ts";

initDb();
const app = createApp();
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
