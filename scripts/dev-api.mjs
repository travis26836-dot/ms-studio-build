#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";

const port = process.env.PORT ?? "3010";
const env = {
  ...process.env,
  PORT: port,
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

execSync("pnpm run build:server", { stdio: "inherit", env: { ...process.env, CI: "true" } });

const server = spawn(
  "node --env-file-if-exists=.env --env-file-if-exists=.env.local dist/index.js",
  {
  shell: true,
  stdio: "inherit",
  env,
  }
);

process.on("SIGINT", () => server.kill("SIGTERM"));
process.on("SIGTERM", () => server.kill("SIGTERM"));

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
