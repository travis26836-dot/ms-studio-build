#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";

const API_PORT = process.env.API_PORT ?? "3010";
const MAIN_PORT = process.env.MAIN_PORT ?? "3003";
const PORTAL_PORT = process.env.PORTAL_PORT ?? "3004";
const isWindows = process.platform === "win32";
const children = [];
let shuttingDown = false;

function run(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" });
}

function getPidsOnPort(port) {
  try {
    if (isWindows) {
      const output = run(`netstat -ano -p tcp | findstr :${port}`);
      const lines = output.split(/\r?\n/).filter(Boolean);
      const pids = lines
        .map((line) => line.trim().split(/\s+/).at(-1))
        .filter((pid) => pid && /^\d+$/.test(pid));
      return [...new Set(pids)];
    }

    const output = run(`lsof -ti tcp:${port}`);
    return output
      .split(/\r?\n/)
      .map((pid) => pid.trim())
      .filter((pid) => /^\d+$/.test(pid));
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (isWindows) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(Number(pid), "SIGTERM");
    }
  } catch {
    // Ignore already-exited processes.
  }
}

function freePort(port) {
  const pids = getPidsOnPort(port);
  if (pids.length > 0) {
    console.log(`Freeing port :${port}`);
    for (const pid of pids) {
      killPid(pid);
    }
  }
}

function startProcess(label, command, extraEnv = {}) {
  console.log(`Starting ${label}`);
  const child = spawn(command, {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const signalText = signal ? ` (signal: ${signal})` : "";
    console.error(`${label} exited with code ${code ?? "null"}${signalText}`);
    shutdown(code ?? 1);
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
});

freePort(API_PORT);
freePort(MAIN_PORT);
freePort(PORTAL_PORT);

startProcess(`API on :${API_PORT}`, "pnpm run dev:api", {
  PORT: API_PORT,
  NODE_ENV: "development",
});

startProcess(`main app on :${MAIN_PORT}`, `pnpm exec vite --host --port ${MAIN_PORT} --strictPort`);
startProcess(
  `customer portal on :${PORTAL_PORT}`,
  `pnpm --dir customer-portal exec vite --host --port ${PORTAL_PORT} --strictPort`,
);

console.log("All servers starting...");
console.log(`Main app:       http://127.0.0.1:${MAIN_PORT}`);
console.log(`Customer portal:http://127.0.0.1:${PORTAL_PORT}`);
