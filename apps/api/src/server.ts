import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    // Fastify doesn't print a startup confirmation on its own — without
    // this, a successfully-running server looks identical to a silently
    // hung one in the terminal.
    app.log.info(`API server listening at http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
