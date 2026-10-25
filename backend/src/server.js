import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

await connectDatabase();
const server = app.listen(env.PORT, () => {
  console.info(`Skillora API listening on port ${env.PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  });
}
